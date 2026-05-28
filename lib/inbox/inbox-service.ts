import { createAgentMailClient } from "@/lib/agentmail/client";
import {
  getEngEmail,
  getHmEmail,
  getJillInboxEmail,
  isJillAddress,
  parseEmailAddress,
  resolveAllRoleInboxes,
  resolveInboxApiId,
  roleForInboxKey,
  roleForRecipientEmails,
  type RoleInbox,
} from "@/lib/agentmail/config";
import { fetchInboxMessage, isAgentMailNotFound } from "@/lib/agentmail/message-fetch";
import {
  blockedRecipientFromError,
  ensureSendAllowed,
  isBlockedRecipientError,
  unblockSendRecipient,
} from "@/lib/agentmail/recipient-lists";
import {
  isProcessableWebhookEvent,
  normalizeWebhookEvent,
  type RawWebhookPayload,
} from "@/lib/agentmail/webhook-normalize";
import {
  findPipelineByCandidateEmail,
  findPipelineByIntroSubject,
  getFirstInboundMessage,
  getThreadRow,
  isEventProcessed,
  isIntroSent,
  listPipelineLogicalIds,
  markEventProcessed,
  releaseIntroProcessingClaim,
  setIntroSent,
  tryClaimIntroProcessing,
  upsertThread,
  upsertThreadInboxLink,
} from "@/lib/db/inbox-repository";
import { buildAckBody, buildIntroSubject } from "@/lib/inbox/ack-template";
import { cleanEmailBody } from "@/lib/inbox/email-body-clean";
import { buildIntroBody } from "@/lib/inbox/intro-template";
import { handleJillWhisper, isWhisperMessage } from "@/lib/inbox/jill-actions";
import { persistAgentMailMessage } from "@/lib/inbox/persist-message";
import { pipelineLogicalId } from "@/lib/inbox/pipeline-link";
import { extractProspect } from "@/lib/inbox/prospect-extract";
import { ensurePipelineRoleLink } from "@/lib/inbox/role-thread-link";
import { broadcastInboxChanged } from "@/lib/inbox/sse-hub";
import { isPipelineIntroSubject } from "@/lib/inbox/subject-match";
import { threadHeaderFromMessage } from "@/lib/inbox/thread-mapper";
import type { AgentMail } from "agentmail";

function resolveInboxRole(
  roles: Awaited<ReturnType<typeof resolveAllRoleInboxes>>,
  message: AgentMail.Message,
  deliveryRecipients?: string[]
): RoleInbox {
  if (deliveryRecipients?.length) {
    const fromRecipients = roleForRecipientEmails(deliveryRecipients, roles);
    if (fromRecipients) return fromRecipients;
  }
  const fromInbox = roleForInboxKey(String(message.inboxId), roles);
  if (fromInbox) return fromInbox;
  return "jill";
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendAckReply(
  client: ReturnType<typeof createAgentMailClient>,
  inboxId: string,
  triggerMessageId: string,
  senderEmail: string,
  ackText: string,
  subjectFallback?: string
) {
  await ensureSendAllowed(client, inboxId, senderEmail);

  const reply = () =>
    client.inboxes.messages.reply(inboxId, triggerMessageId, {
      to: [senderEmail],
      text: ackText,
    });

  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      return await sendWithRecipientRetry(client, inboxId, reply);
    } catch (error) {
      if (!isAgentMailNotFound(error) || attempt >= 3) {
        if (isAgentMailNotFound(error) && subjectFallback) {
          console.warn(`Reply to message ${triggerMessageId} failed with 404 even after retries. Falling back to sending a new message.`);
          const sendNew = () =>
            client.inboxes.messages.send(inboxId, {
              to: [senderEmail],
              subject: subjectFallback.startsWith("Re:") ? subjectFallback : `Re: ${subjectFallback}`,
              text: ackText,
            });
          return await sendWithRecipientRetry(client, inboxId, sendNew);
        }
        throw error;
      }
      await sleep(300 * (attempt + 1));
    }
  }

  throw new Error("Unreachable");
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
  console.log(`[maybeHandleFirstCandidateInbound] Starting for threadId: "${threadId}", inboxId: "${inboxId}"`);
  if (isIntroSent(threadId)) {
    console.log(`[maybeHandleFirstCandidateInbound] Intro already sent for threadId "${threadId}". Skipping.`);
    return false;
  }

  const jillEmail = getJillInboxEmail();
  const hmEmail = getHmEmail();
  const inbound = getFirstInboundMessage(threadId, jillEmail);
  if (!inbound) {
    console.log(`[maybeHandleFirstCandidateInbound] No inbound message found in database for threadId "${threadId}"`);
    return false;
  }

  console.log(`[maybeHandleFirstCandidateInbound] Found inbound message: from: "${inbound.from_addr}", subject: "${inbound.subject}"`);

  const prospect = extractProspect(inbound.from_addr, inbound.subject, cleanEmailBody(inbound.body));
  console.log(`[maybeHandleFirstCandidateInbound] Extracted prospect info: name: "${prospect.name}", email: "${prospect.email}"`);

  const sender = parseEmailAddress(inbound.from_addr);
  if (!sender.email) {
    console.warn(`[maybeHandleFirstCandidateInbound] Could not parse a valid sender email address from "${inbound.from_addr}"`);
    return false;
  }

  if (findPipelineByCandidateEmail(sender.email)) {
    console.log(`[maybeHandleFirstCandidateInbound] A pipeline already exists for candidate "${sender.email}". Setting intro sent and skipping.`);
    setIntroSent(threadId);
    return false;
  }

  console.log(`[maybeHandleFirstCandidateInbound] Attempting to claim intro processing for threadId "${threadId}"...`);
  if (!tryClaimIntroProcessing(threadId)) {
    console.log(`[maybeHandleFirstCandidateInbound] Failed to claim intro processing claim (already processing). Skipping.`);
    return false;
  }
  console.log(`[maybeHandleFirstCandidateInbound] Claimed successfully!`);

  const client = createAgentMailClient();
  const ackText = buildAckBody(prospect);
  const introText = buildIntroBody(prospect);
  const introSubject = buildIntroSubject(prospect);
  const resolvedTriggerId = inbound.message_id || triggerMessageId;

  try {
    console.log(`[maybeHandleFirstCandidateInbound] Sending Ack reply to messageId "${resolvedTriggerId}"...`);
    const ackSent = await sendAckReply(
      client,
      inboxId,
      resolvedTriggerId,
      sender.email,
      ackText,
      inbound.subject
    );
    console.log(`[maybeHandleFirstCandidateInbound] Ack reply sent. Result messageId: "${ackSent.messageId}"`);

    if (ackSent.messageId) {
      console.log(`[maybeHandleFirstCandidateInbound] Fetching full Ack message details from AgentMail...`);
      const ackFull = await fetchInboxMessage(client, inboxId, String(ackSent.messageId), { retries: 5 });
      if (ackFull) {
        console.log(`[maybeHandleFirstCandidateInbound] Persisting Ack message to local DB.`);
        persistAgentMailMessage(ackFull, jillEmail, "jill");
      } else {
        console.warn(`[maybeHandleFirstCandidateInbound] Failed to fetch full Ack message details from AgentMail.`);
      }
    }

    console.log(`[maybeHandleFirstCandidateInbound] Sending new Intro email to candidate "${sender.email}" and HM "${hmEmail}"...`);
    const introSent = await sendNewIntroEmail(
      client,
      inboxId,
      sender.email,
      hmEmail,
      introSubject,
      introText
    );
    console.log(`[maybeHandleFirstCandidateInbound] Intro email sent. Result messageId: "${introSent.messageId}", threadId: "${introSent.threadId}"`);

    if (introSent.messageId) {
      console.log(`[maybeHandleFirstCandidateInbound] Fetching full Intro message details from AgentMail...`);
      const introFull = await fetchInboxMessage(client, inboxId, String(introSent.messageId), { retries: 5 });
      if (!introFull) {
        console.warn(`[maybeHandleFirstCandidateInbound] Failed to fetch full Intro message details. Setting intro sent on inbound thread and returning.`);
        setIntroSent(threadId);
        return true;
      }
      console.log(`[maybeHandleFirstCandidateInbound] Persisting Intro message to local DB.`);
      persistAgentMailMessage(introFull, jillEmail, "jill");

      const logicalThreadId = pipelineLogicalId(String(introSent.threadId));
      console.log(`[maybeHandleFirstCandidateInbound] Setting intro sent and updating thread database states for logicalThreadId "${logicalThreadId}"...`);
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

      console.log(`[maybeHandleFirstCandidateInbound] Creating Thread-Inbox link for role "jill"`);
      upsertThreadInboxLink({
        logical_thread_id: logicalThreadId,
        inbox_id: inboxId,
        thread_id: String(introSent.threadId),
        role: "jill",
      });
    } else {
      console.warn(`[maybeHandleFirstCandidateInbound] introSent did not return a valid messageId. Setting intro sent anyways to avoid double send.`);
      setIntroSent(threadId);
    }

    console.log(`[maybeHandleFirstCandidateInbound] Successfully finished intro flow for threadId "${threadId}".`);
    return true;
  } catch (error) {
    console.error(`[maybeHandleFirstCandidateInbound] Error in intro flow for threadId "${threadId}". Releasing processing claim...`, error);
    releaseIntroProcessingClaim(threadId);
    throw error;
  }
}

export async function handleMessageReceivedEvent(event: {
  event_type: string;
  message: AgentMail.Message;
  thread?: { messageCount?: number };
  deliveryRecipients?: string[];
}) {
  console.log(`[handleMessageReceivedEvent] Starting. event_type: "${event.event_type}", message_id: "${event.message.messageId}"`);

  if (!isProcessableWebhookEvent(event.event_type)) {
    console.log(`[handleMessageReceivedEvent] event_type "${event.event_type}" is not processable. Skipping.`);
    return;
  }

  const message = event.message;
  const jillEmail = getJillInboxEmail();
  const roles = await resolveAllRoleInboxes();
  const role = resolveInboxRole(roles, message, event.deliveryRecipients);
  const isInboundReceived = event.event_type === "message.received";

  console.log(`[handleMessageReceivedEvent] Resolved role for message: "${role}" (sender: "${message.from}", recipients: ${JSON.stringify(message.to)})`);

  const persisted = persistAgentMailMessage(message, jillEmail, role);
  console.log(`[handleMessageReceivedEvent] Persisted message to DB. logicalThreadId: "${persisted.logicalThreadId}"`);

  const threadId = String(message.threadId);
  const inboxId = String(message.inboxId);
  const messageCount = event.thread?.messageCount ?? 1;

  console.log(`[handleMessageReceivedEvent] Thread stats: threadId: "${threadId}", inboxId: "${inboxId}", messageCount: ${messageCount}`);

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
    console.log(`[handleMessageReceivedEvent] Non-Jill role thread. Linking logicalThreadId "${persisted.logicalThreadId}" with inboxId "${inboxId}" for role "${role}"`);
    upsertThreadInboxLink({
      logical_thread_id: persisted.logicalThreadId,
      inbox_id: inboxId,
      thread_id: threadId,
      role,
    });
  }

  if (isJillAddress(message.from ?? "", jillEmail)) {
    console.log(`[handleMessageReceivedEvent] Message was sent by Jill herself ("${message.from}"). Broadcasting change and stopping flow.`);
    broadcastInboxChanged("message_received");
    return;
  }

  if (isWhisperMessage(message, jillEmail) && persisted.logicalThreadId && (role === "hm" || role === "eng")) {
    console.log(`[handleMessageReceivedEvent] Whisper message detected. Handling whisper from role "${role}" for logicalThreadId "${persisted.logicalThreadId}"...`);
    await handleJillWhisper(message, persisted.logicalThreadId, role);
    broadcastInboxChanged("jill_whisper");
    return;
  }

  const alreadySent = isIntroSent(threadId);
  console.log(`[handleMessageReceivedEvent] Flow checks: isInboundReceived=${isInboundReceived}, role="${role}", messageCount=${messageCount}, isIntroSent=${alreadySent}`);

  if (
    isInboundReceived &&
    role === "jill" &&
    messageCount === 1 &&
    !alreadySent
  ) {
    try {
      console.log(`[handleMessageReceivedEvent] Match found! Initiating intro flow via maybeHandleFirstCandidateInbound for threadId "${threadId}"...`);
      const handled = await maybeHandleFirstCandidateInbound(threadId, inboxId, String(message.messageId));
      console.log(`[handleMessageReceivedEvent] intro flow result for threadId "${threadId}": ${handled}`);
    } catch (error) {
      console.error(`[handleMessageReceivedEvent] Intro flow failed for thread "${threadId}":`, error);
    }
  } else {
    console.log(`[handleMessageReceivedEvent] Intro flow conditions not met: isInboundReceived=${isInboundReceived} (must be true), role="${role}" (must be "jill"), messageCount=${messageCount} (must be 1), isIntroSent=${alreadySent} (must be false). Skipping intro flow.`);
  }

  console.log(`[handleMessageReceivedEvent] Broadcasting event for layout sync (${isInboundReceived ? "message_received" : "message_delivered"}).`);
  broadcastInboxChanged(isInboundReceived ? "message_received" : "message_delivered");
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
    try {
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
          try {
            await maybeHandleFirstCandidateInbound(
              String(full.threadId),
              inboxId,
              String(first.messageId)
            );
          } catch (error) {
            console.warn(
              `Intro flow skipped for thread ${full.threadId} during sync:`,
              error
            );
          }
        }
      }

      synced += 1;
    } catch (error) {
      console.warn(`Skipping thread ${item.threadId} during sync for ${role}:`, error);
    }
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
    for (const role of ["jill", "hm", "eng"] as const) {
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

export async function ingestWebhookPayload(payload: unknown) {
  const raw = payload as RawWebhookPayload;
  const eventType = raw.event_type ?? "message.received";
  const eventId = raw.event_id ?? `evt_${Date.now()}`;

  console.log(`[ingestWebhookPayload] Processing payload. eventType: "${eventType}", eventId: "${eventId}"`);

  if (isEventProcessed(eventId)) {
    console.log(`[ingestWebhookPayload] Skipped. Event ID "${eventId}" already marked as processed.`);
    return;
  }

  if (!isProcessableWebhookEvent(eventType)) {
    console.log(`[ingestWebhookPayload] Ignored unprocessable eventType "${eventType}". Marking as processed.`);
    markEventProcessed(eventId);
    return;
  }

  const event = normalizeWebhookEvent(raw);
  if (isEventProcessed(event.event_id)) {
    console.log(`[ingestWebhookPayload] Skipped. Normalized Event ID "${event.event_id}" already marked as processed.`);
    return;
  }

  let message = event.message;
  const inboxApiId = await resolveInboxApiId(String(message.inboxId));
  message = { ...message, inboxId: inboxApiId };

  console.log(`[ingestWebhookPayload] Normalized event: sender: "${message.from}", threadId: "${message.threadId}", messageId: "${message.messageId}", needsFetch: ${event.needsFetch}`);

  if (event.needsFetch && message.messageId) {
    console.log(`[ingestWebhookPayload] Fetching full message body from AgentMail for messageId "${message.messageId}" in inbox "${inboxApiId}"...`);
    const client = createAgentMailClient();
    const fetched = await fetchInboxMessage(client, inboxApiId, String(message.messageId), {
      fallback: message,
    });
    if (fetched) {
      console.log(`[ingestWebhookPayload] Successfully fetched full message body from AgentMail.`);
      message = fetched;
    } else if (!message.text?.trim() && !message.preview?.trim() && !message.html?.trim()) {
      console.warn(`[ingestWebhookPayload] Fetch returned nothing and fallback message is empty. Skipping processing.`);
      markEventProcessed(event.event_id);
      return;
    } else {
      console.log(`[ingestWebhookPayload] Fetch returned nothing, but fallback message has content. Proceeding.`);
    }
  }

  console.log(`[ingestWebhookPayload] Handing off to handleMessageReceivedEvent...`);
  await handleMessageReceivedEvent({
    event_type: event.event_type,
    message,
    thread: event.thread,
    deliveryRecipients: event.deliveryRecipients,
  });

  console.log(`[ingestWebhookPayload] Successfully processed. Marking event_id "${event.event_id}" as processed.`);
  markEventProcessed(event.event_id);
}

export { persistAgentMailMessage } from "@/lib/inbox/persist-message";
