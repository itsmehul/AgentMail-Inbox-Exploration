import type { AgentMail } from "agentmail";
import { createAgentMailClient } from "@/lib/agentmail/client";
import {
  getEngEmail,
  getHmEmail,
  getJillInboxEmail,
  parseEmailAddress,
  resolveInboxIdByEmail,
  type RoleInbox,
} from "@/lib/agentmail/config";
import {
  blockedRecipientFromError,
  ensureSendAllowed,
  isBlockedRecipientError,
  unblockSendRecipient,
} from "@/lib/agentmail/recipient-lists";
import {
  getInboxLinksForLogical,
  getLatestMessageForLogicalThread,
  getLatestMessageForThread,
  getThreadRow,
  getThreadRowByLogicalId,
  upsertThread,
  upsertThreadInboxLink,
  type DbThreadRow,
  type ThreadInboxLink,
} from "@/lib/db/inbox-repository";
import { buildRoleInboxBootstrapBody } from "@/lib/inbox/intro-template";
import { persistAgentMailMessage } from "@/lib/inbox/persist-message";
import { isPipelineIntroSubject, subjectsMatchPipeline } from "@/lib/inbox/subject-match";
import { threadHeaderFromMessage } from "@/lib/inbox/thread-mapper";

const THREAD_LIST_LIMIT = 100;

async function sendWithAllowlistRetry<T>(
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

function collectParticipantEmails(messages: AgentMail.Message[]): Set<string> {
  const participants = new Set<string>();
  for (const message of messages) {
    if (message.from) {
      const email = parseEmailAddress(String(message.from)).email;
      if (email) participants.add(email);
    }
    for (const addr of message.to ?? []) {
      const email = parseEmailAddress(String(addr)).email;
      if (email) participants.add(email);
    }
    for (const addr of message.cc ?? []) {
      const email = parseEmailAddress(String(addr)).email;
      if (email) participants.add(email);
    }
  }
  return participants;
}

function getJillThreadForPipeline(
  logicalThreadId: string,
  pipeline: DbThreadRow
): { inboxId: string; threadId: string } | undefined {
  const link = getInboxLinksForLogical(logicalThreadId).find((l) => l.role === "jill");
  if (link) return { inboxId: link.inbox_id, threadId: link.thread_id };
  return { inboxId: pipeline.inbox_id, threadId: pipeline.thread_id };
}

async function syncRoleThread(
  logicalThreadId: string,
  role: RoleInbox,
  inboxId: string,
  threadId: string,
  introSubject: string
): Promise<ThreadInboxLink> {
  const client = createAgentMailClient();
  const jillEmail = getJillInboxEmail();
  const full = await client.inboxes.threads.get(inboxId, threadId);

  for (const message of full.messages) {
    persistAgentMailMessage(message, jillEmail, role);
  }

  const last = full.messages.at(-1);
  const header = last ? threadHeaderFromMessage(last) : null;

  upsertThread({
    threadId: String(full.threadId),
    inboxId,
    subject: full.subject ?? introSubject,
    preview: full.preview ?? header?.preview ?? "",
    fromDisplay: full.senders[0] ?? header?.fromDisplay ?? "",
    timeDisplay: header?.timeDisplay ?? "",
    messageCount: full.messageCount,
    logicalThreadId,
    threadKind: "pipeline",
  });

  const link: ThreadInboxLink = {
    logical_thread_id: logicalThreadId,
    inbox_id: inboxId,
    thread_id: String(full.threadId),
    role,
  };
  upsertThreadInboxLink(link);
  return link;
}

async function findMatchingRoleThreadInInbox(
  client: ReturnType<typeof createAgentMailClient>,
  inboxId: string,
  introSubject: string,
  candidateEmail?: string
): Promise<string | undefined> {
  const listed = await client.inboxes.threads.list(inboxId, { limit: THREAD_LIST_LIMIT });
  for (const item of listed.threads) {
    const full = await client.inboxes.threads.get(inboxId, item.threadId);
    const subject = full.subject ?? "";

    if (subjectsMatchPipeline(introSubject, subject)) {
      return String(full.threadId);
    }

    if (candidateEmail && isPipelineIntroSubject(subject)) {
      const participants = collectParticipantEmails(full.messages);
      if (participants.has(candidateEmail)) {
        return String(full.threadId);
      }
    }
  }
  return undefined;
}

async function bootstrapPipelineRoleLink(
  logicalThreadId: string,
  role: "hm" | "eng",
  pipeline: DbThreadRow,
  introSubject: string,
  roleInboxId: string
): Promise<ThreadInboxLink | undefined> {
  const jillThread = getJillThreadForPipeline(logicalThreadId, pipeline);
  if (!jillThread) return undefined;

  const client = createAgentMailClient();
  const jillEmail = getJillInboxEmail();
  const roleEmail = role === "hm" ? getHmEmail() : getEngEmail();
  const latest =
    getLatestMessageForLogicalThread(logicalThreadId, "jill") ??
    getLatestMessageForThread(jillThread.threadId);
  if (!latest) return undefined;

  const candidateEmail = pipeline.candidate_email?.toLowerCase();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const matchedThreadId = await findMatchingRoleThreadInInbox(
      client,
      roleInboxId,
      introSubject,
      candidateEmail ?? undefined
    );
    if (matchedThreadId) {
      return syncRoleThread(logicalThreadId, role, roleInboxId, matchedThreadId, introSubject);
    }
  }

  const to = candidateEmail ? [roleEmail, candidateEmail] : [roleEmail];
  for (const addr of to) {
    await ensureSendAllowed(client, jillThread.inboxId, addr);
  }

  const text = buildRoleInboxBootstrapBody();

  try {
    const sent = await sendWithAllowlistRetry(client, jillThread.inboxId, () =>
      client.inboxes.messages.reply(jillThread.inboxId, latest.message_id, {
        to: to.length === 1 ? to[0] : to,
        text,
      })
    );

    if (sent.messageId) {
      const full = await client.inboxes.messages.get(jillThread.inboxId, sent.messageId);
      persistAgentMailMessage(full, jillEmail, "jill");
    }
  } catch (error) {
    console.warn(`Could not bootstrap ${role} thread for pipeline ${logicalThreadId}:`, error);
    return undefined;
  }

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const matchedThreadId = await findMatchingRoleThreadInInbox(
      client,
      roleInboxId,
      introSubject,
      candidateEmail ?? undefined
    );
    if (matchedThreadId) {
      return syncRoleThread(logicalThreadId, role, roleInboxId, matchedThreadId, introSubject);
    }
  }

  return undefined;
}

export async function ensurePipelineRoleLink(
  logicalThreadId: string,
  role: "jill" | "hm" | "eng"
): Promise<ThreadInboxLink | undefined> {
  const pipeline = getThreadRowByLogicalId(logicalThreadId);
  if (!pipeline?.subject) return undefined;

  const introSubject = pipeline.subject.trim();
  const roleEmail =
    role === "jill" ? getJillInboxEmail() : role === "hm" ? getHmEmail() : getEngEmail();
  const { inboxId } = await resolveInboxIdByEmail(roleEmail);

  const existing = getInboxLinksForLogical(logicalThreadId).find((l) => l.role === role);
  if (existing) {
    const row = getThreadRow(existing.thread_id);
    const hasMessages = Boolean(getLatestMessageForThread(existing.thread_id));
    if (row?.thread_kind === "pipeline" && hasMessages) {
      return existing;
    }
    if (row?.thread_kind === "pipeline" && subjectsMatchPipeline(introSubject, row.subject ?? "")) {
      return syncRoleThread(logicalThreadId, role, inboxId, existing.thread_id, introSubject);
    }
  }

  if (role === "jill") {
    const { inboxId: jillInboxId } = await resolveInboxIdByEmail(getJillInboxEmail());
    if (pipeline.inbox_id === jillInboxId) {
      return syncRoleThread(logicalThreadId, "jill", pipeline.inbox_id, pipeline.thread_id, introSubject);
    }
  }

  const client = createAgentMailClient();
  const candidateEmail = pipeline.candidate_email?.toLowerCase();
  const matchedThreadId = await findMatchingRoleThreadInInbox(
    client,
    inboxId,
    introSubject,
    candidateEmail ?? undefined
  );
  if (matchedThreadId) {
    return syncRoleThread(logicalThreadId, role, inboxId, matchedThreadId, introSubject);
  }

  if (role === "hm" || role === "eng") {
    return bootstrapPipelineRoleLink(logicalThreadId, role, pipeline, introSubject, inboxId);
  }

  return undefined;
}
