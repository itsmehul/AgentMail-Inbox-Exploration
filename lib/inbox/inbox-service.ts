import type { AgentMail } from "agentmail";
import { createAgentMailClient } from "@/lib/agentmail/client";
import {
  getEngEmail,
  getHmEmail,
  getJillInboxEmail,
  isJillAddress,
  parseEmailAddress,
  resolveAllRoleInboxes,
  type RoleInbox,
} from "@/lib/agentmail/config";
import {
  blockedRecipientFromError,
  ensureSendAllowed,
  isBlockedRecipientError,
  unblockSendRecipient,
} from "@/lib/agentmail/recipient-lists";
import { normalizeWebhookEvent, type RawMessageReceivedEvent } from "@/lib/agentmail/webhook-normalize";
import {
  getFirstInboundMessage,
  isIntroSent,
  listPipelineLogicalIds,
  markEventProcessed,
  setIntroSent,
  upsertThread,
  upsertThreadInboxLink,
  findPipelineByIntroSubject,
  getThreadRow,
} from "@/lib/db/inbox-repository";
import { buildAckBody, buildIntroSubject } from "@/lib/inbox/ack-template";
import { buildIntroBody } from "@/lib/inbox/intro-template";
import { handleJillWhisper, isWhisperMessage } from "@/lib/inbox/jill-actions";
import { cleanEmailBody } from "@/lib/inbox/email-body-clean";
import { extractProspect } from "@/lib/inbox/prospect-extract";
import { persistAgentMailMessage } from "@/lib/inbox/persist-message";
import { pipelineLogicalId } from "@/lib/inbox/pipeline-link";
import { ensurePipelineRoleLink } from "@/lib/inbox/role-thread-link";
import { isPipelineIntroSubject } from "@/lib/inbox/subject-match";
import { broadcastInboxChanged } from "@/lib/inbox/sse-hub";
import { threadHeaderFromMessage } from "@/lib/inbox/thread-mapper";

function isInboundReceivedEvent(eventType: string): boolean {
  return eventType === "message.received";
}

async function sendWithRecipientRetry<T>(
  client: ReturnType<typeof createAgentMailClient>,
  inboxId: string,
  sendFn: () => Promise<T>
): Promise<T> {
  try {
    return await sendFn();
  } catch (error) {
    if (!isBlockedRecipientError(error)) throw error;
    const blocked = blockedRecipientFromError(error);
    if (blocked) {
      await unblockSendRecipient(client, inboxId, blocked);
      return sendFn();
    }
    throw error;
  }
}

async function sendAckReply(
  client: ReturnType<typeof createAgentMailClient>,
  inboxId: string,
  triggerMessageId: string,
  senderEmail: string,
  ackText: string
) {
  await ensureSendAllowed(client, inboxId, senderEmail);
  return sendWithRecipientRetry(client, inboxId, () =>
    client.inboxes.messages.reply(inboxId, triggerMessageId, {
      to: [senderEmail],
      text: ackText,
    })
  );
}

async function sendNewIntroEmail(
  client: ReturnType<typeof createAgentMailClient>,
  inboxId: string,
  senderEmail: string,
  hmEmail: string,
  subject: string,
  introText: string
) {
  await ensureSendAllowed(client, inboxId, senderEmail);
  await ensureSendAllowed(client, inboxId, hmEmail);

  try {
    return await client.inboxes.messages.send(inboxId, {
      to: [senderEmail, hmEmail],
      subject,
      text: introText,
    });
  } catch (error) {
    if (!isBlockedRecipientError(error)) throw error;
    const blocked = blockedRecipientFromError(error);
    if (blocked) {
      await unblockSendRecipient(client, inboxId, blocked);
      try {
        return await client.inboxes.messages.send(inboxId, {
          to: [senderEmail, hmEmail],
          subject,
          text: introText,
        });
      } catch (retryError) {
        if (!isBlockedRecipientError(retryError) || blockedRecipientFromError(retryError) !== hmEmail) {
          throw retryError;
        }
      }
    }
    return client.inboxes.messages.send(inboxId, {
      to: [senderEmail],
      subject,
      text: `${introText}\n\n(HM ${hmEmail} could not be added — address is blocked on AgentMail. Unblock in AgentMail console → Lists.)`,
    });
  }
}

export async function maybeHandleFirstCandidateInbound(
  threadId: string,
  inboxId: string,
  triggerMessageId: string
): Promise<boolean> {
  if (isIntroSent(threadId)) return false;

  const jillEmail = getJillInboxEmail();
  const hmEmail = getHmEmail();
  const inbound = getFirstInboundMessage(threadId, jillEmail);
  if (!inbound) return false;

  const prospect = extractProspect(inbound.from_addr, inbound.subject, cleanEmailBody(inbound.body));
  const sender = parseEmailAddress(inbound.from_addr);
  if (!sender.email) return false;

  const client = createAgentMailClient();
  const ackText = buildAckBody(prospect);
  const introText = buildIntroBody(prospect);
  const introSubject = buildIntroSubject(prospect);

  const ackSent = await sendAckReply(client, inboxId, triggerMessageId, sender.email, ackText);
  if (ackSent.messageId) {
    const ackFull = await client.inboxes.messages.get(inboxId, ackSent.messageId);
    persistAgentMailMessage(ackFull, jillEmail, "jill");
  }

  const introSent = await sendNewIntroEmail(
    client,
    inboxId,
    sender.email,
    hmEmail,
    introSubject,
    introText
  );

  if (introSent.messageId) {
    const introFull = await client.inboxes.messages.get(inboxId, introSent.messageId);
    persistAgentMailMessage(introFull, jillEmail, "jill");

    const logicalThreadId = pipelineLogicalId(String(introSent.threadId));
    setIntroSent(threadId);

    upsertThread({
      threadId,
      inboxId,
      subject: inbound.subject,
      preview: ackText.slice(0, 160),
      fromDisplay: inbound.from_addr,
      timeDisplay: inbound.time_display,
      prospect,
      introSent: true,
      status: "ack sent",
      lastAction: "Ack",
      threadKind: "inbound",
    });

    upsertThread({
      threadId: String(introSent.threadId),
      inboxId,
      subject: introSubject,
      preview: introText.slice(0, 160),
      fromDisplay: `${prospect.name} <${sender.email}>`,
      timeDisplay: threadHeaderFromMessage(introFull).timeDisplay,
      prospect,
      logicalThreadId,
      threadKind: "pipeline",
      candidateEmail: sender.email,
      status: "intro sent",
      lastAction: "Intro-Setter",
      stages: ["intro"],
    });

    upsertThreadInboxLink({
      logical_thread_id: logicalThreadId,
      inbox_id: inboxId,
      thread_id: String(introSent.threadId),
      role: "jill",
    });

    try {
      await ensurePipelineRoleLink(logicalThreadId, "hm");
    } catch (error) {
      console.warn("Could not link HM inbox for new pipeline:", error);
    }
  } else {
    setIntroSent(threadId);
  }

  return true;
}

export async function handleMessageReceivedEvent(
  event: {
    event_type: string;
    message: AgentMail.Message;
    thread?: { messageCount?: number };
  },
  inboxRole?: RoleInbox
) {
  if (!isInboundReceivedEvent(event.event_type)) return;

  const message = event.message;
  const jillEmail = getJillInboxEmail();
  const roles = await resolveAllRoleInboxes();
  const role =
    inboxRole ?? roles.find((r) => r.inboxId === String(message.inboxId))?.role ?? "jill";

  const persisted = persistAgentMailMessage(message, jillEmail, role);

  const threadId = String(message.threadId);
  const inboxId = String(message.inboxId);
  const messageCount = event.thread?.messageCount ?? 1;

  upsertThread({
    threadId,
    inboxId,
    subject: message.subject ?? "",
    preview: message.preview ?? "",
    fromDisplay: threadHeaderFromMessage(message).fromDisplay,
    timeDisplay: threadHeaderFromMessage(message).timeDisplay,
    messageCount,
    logicalThreadId: persisted.logicalThreadId,
  });

  if (persisted.logicalThreadId && role !== "jill") {
    upsertThreadInboxLink({
      logical_thread_id: persisted.logicalThreadId,
      inbox_id: inboxId,
      thread_id: threadId,
      role,
    });
  }

  if (isJillAddress(message.from ?? "", jillEmail)) {
    broadcastInboxChanged("message_received");
    return;
  }

  if (isWhisperMessage(message, jillEmail) && persisted.logicalThreadId && (role === "hm" || role === "eng")) {
    await handleJillWhisper(message, persisted.logicalThreadId, role);
    broadcastInboxChanged("jill_whisper");
    return;
  }

  if (role === "jill" && messageCount === 1 && !isIntroSent(threadId)) {
    await maybeHandleFirstCandidateInbound(threadId, inboxId, String(message.messageId));
  }

  broadcastInboxChanged("message_received");
}

async function syncSingleInbox(inboxId: string, email: string, role: RoleInbox): Promise<number> {
  const client = createAgentMailClient();
  const jillEmail = getJillInboxEmail();
  if (role === "jill") {
    await ensureSendAllowed(client, inboxId, getHmEmail());
    await ensureSendAllowed(client, inboxId, getEngEmail());
  }

  const listed = await client.inboxes.threads.list(inboxId, { limit: 50 });
  let synced = 0;

  for (const item of listed.threads) {
    const full = await client.inboxes.threads.get(inboxId, item.threadId);
    for (const message of full.messages) {
      persistAgentMailMessage(message, jillEmail, role);
    }

    const last = full.messages.at(-1);
    if (last) {
      const header = threadHeaderFromMessage(last);
      const subject = full.subject ?? header.subject;
      const isPipeline = isPipelineIntroSubject(subject);
      const existing = getThreadRow(String(full.threadId));
      const matched = isPipeline ? findPipelineByIntroSubject(subject) : undefined;
      const logicalId =
        existing?.logical_thread_id ??
        matched?.logical_thread_id ??
        (isPipeline && role === "jill" ? pipelineLogicalId(String(full.threadId)) : null);

      upsertThread({
        threadId: String(full.threadId),
        inboxId,
        subject,
        preview: full.preview ?? header.preview,
        fromDisplay: full.senders[0] ?? header.fromDisplay,
        timeDisplay: header.timeDisplay,
        messageCount: full.messageCount,
        threadKind: isPipeline ? "pipeline" : role === "jill" ? "inbound" : undefined,
        logicalThreadId: logicalId,
      });

      if (isPipeline && logicalId) {
        upsertThreadInboxLink({
          logical_thread_id: logicalId,
          inbox_id: inboxId,
          thread_id: String(full.threadId),
          role,
        });
      }
    }

    if (role === "jill" && !isIntroSent(String(full.threadId)) && full.messageCount === 1) {
      const first = full.messages[0];
      if (first && !isJillAddress(first.from ?? "", jillEmail)) {
        await maybeHandleFirstCandidateInbound(String(full.threadId), inboxId, String(first.messageId));
      }
    }

    synced += 1;
  }

  return synced;
}

export async function syncInboxFromAgentMail(): Promise<{ threadCount: number; synced: number }> {
  const roles = await resolveAllRoleInboxes();
  let synced = 0;
  let threadCount = 0;

  for (const { inboxId, email, role } of roles) {
    try {
      const count = await syncSingleInbox(inboxId, email, role);
      synced += count;
      threadCount += count;
    } catch (error) {
      console.error(`Sync failed for ${role} (${email}):`, error);
    }
  }

  for (const logicalId of listPipelineLogicalIds()) {
    for (const role of ["hm", "eng"] as const) {
      try {
        await ensurePipelineRoleLink(logicalId, role);
      } catch (error) {
        console.warn(`Could not link ${role} for pipeline ${logicalId}:`, error);
      }
    }
  }

  broadcastInboxChanged("sync_complete");
  return { threadCount, synced };
}

export async function ingestWebhookPayload(payload: unknown, inboxRole?: RoleInbox) {
  const event = normalizeWebhookEvent(payload as RawMessageReceivedEvent);
  if (!markEventProcessed(event.event_id)) return;
  await handleMessageReceivedEvent(event, inboxRole);
}

export { persistAgentMailMessage } from "@/lib/inbox/persist-message";
