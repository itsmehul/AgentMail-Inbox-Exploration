import { createAgentMailClient } from "@/lib/agentmail/client";
import {
  getEngEmail,
  getHmEmail,
  getJillInboxEmail,
  resolveInboxIdByEmail,
  type RoleInbox,
} from "@/lib/agentmail/config";
import {
  getInboxLinksForLogical,
  getLatestMessageForThread,
  getThreadRow,
  getThreadRowByLogicalId,
  upsertThread,
  upsertThreadInboxLink,
  type ThreadInboxLink,
} from "@/lib/db/inbox-repository";
import { persistAgentMailMessage } from "@/lib/inbox/persist-message";
import { isPipelineIntroSubject, subjectsMatchPipeline } from "@/lib/inbox/subject-match";
import { threadHeaderFromMessage } from "@/lib/inbox/thread-mapper";

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

  const client = createAgentMailClient();
  const candidateEmail = pipeline.candidate_email?.toLowerCase();

  const listed = await client.inboxes.threads.list(inboxId, { limit: 50 });
  for (const item of listed.threads) {
    const full = await client.inboxes.threads.get(inboxId, item.threadId);
    const subject = full.subject ?? "";

    if (subjectsMatchPipeline(introSubject, subject)) {
      return syncRoleThread(logicalThreadId, role, inboxId, String(full.threadId), introSubject);
    }

    if (candidateEmail && isPipelineIntroSubject(subject)) {
      const participants = new Set<string>();
      for (const message of full.messages) {
        if (message.from) participants.add(message.from.toLowerCase());
        for (const addr of message.to ?? []) participants.add(String(addr).toLowerCase());
        for (const addr of message.cc ?? []) participants.add(String(addr).toLowerCase());
      }
      const hasCandidate = [...participants].some((addr) => addr.includes(candidateEmail));
      if (hasCandidate) {
        return syncRoleThread(logicalThreadId, role, inboxId, String(full.threadId), introSubject);
      }
    }
  }

  return undefined;
}
