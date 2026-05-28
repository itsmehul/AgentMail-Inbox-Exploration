import {
  findPipelineByCandidateEmail,
  findPipelineByIntroSubject,
  getInboxLinksForLogical,
  getLogicalIdForAgentMailThread,
  getThreadRow,
  upsertThreadInboxLink,
  type DbThreadRow,
} from "@/lib/db/inbox-repository";
import { parseEmailAddress, normalizeEmailList } from "@/lib/agentmail/config";
import { pipelineLogicalId } from "@/lib/inbox/pipeline-id";
import { isPipelineIntroSubject } from "@/lib/inbox/subject-match";

export { pipelineLogicalId };

export function resolveLogicalThreadForMessage(input: {
  threadId: string;
  inboxId: string;
  subject: string;
  fromAddr: string;
  toAddrs: string[];
  ccAddrs: string[];
  role: "jill" | "hm" | "eng";
}): { logicalThreadId: string | null; threadKind: "inbound" | "pipeline" | null } {
  const existing = getLogicalIdForAgentMailThread(input.threadId);
  if (existing) {
    const row = getThreadRow(input.threadId);
    return {
      logicalThreadId: existing,
      threadKind: (row?.thread_kind as "inbound" | "pipeline") ?? "pipeline",
    };
  }

  const introMatch = findPipelineByIntroSubject(input.subject);
  if (introMatch?.logical_thread_id) {
    upsertThreadInboxLink({
      logical_thread_id: introMatch.logical_thread_id,
      inbox_id: input.inboxId,
      thread_id: input.threadId,
      role: input.role,
    });
    return { logicalThreadId: introMatch.logical_thread_id, threadKind: "pipeline" };
  }

  const participants = [
    parseEmailAddress(input.fromAddr).email,
    ...normalizeEmailList(input.toAddrs),
    ...normalizeEmailList(input.ccAddrs),
  ].filter(Boolean);

  for (const email of participants) {
    const pipeline = findPipelineByCandidateEmail(email);
    if (pipeline?.logical_thread_id) {
      const isIntroThread = isPipelineIntroSubject(input.subject);
      if (isIntroThread || input.role !== "jill") {
        upsertThreadInboxLink({
          logical_thread_id: pipeline.logical_thread_id,
          inbox_id: input.inboxId,
          thread_id: input.threadId,
          role: input.role,
        });
      }
      return { logicalThreadId: pipeline.logical_thread_id, threadKind: "pipeline" };
    }
  }

  const row = getThreadRow(input.threadId);
  if (row?.logical_thread_id) {
    return { logicalThreadId: row.logical_thread_id, threadKind: row.thread_kind as "inbound" | "pipeline" };
  }

  return { logicalThreadId: null, threadKind: row?.thread_kind as "inbound" | "pipeline" | null };
}

export function registerPipelineThread(row: DbThreadRow, role: "jill" | "hm" | "eng") {
  if (!row.logical_thread_id) return;
  upsertThreadInboxLink({
    logical_thread_id: row.logical_thread_id,
    inbox_id: row.inbox_id,
    thread_id: row.thread_id,
    role,
  });
}

export function inboxRoleForEmail(
  email: string,
  roles: { role: "jill" | "hm" | "eng"; email: string }[]
): "jill" | "hm" | "eng" | null {
  const normalized = email.toLowerCase();
  return roles.find((r) => r.email === normalized)?.role ?? null;
}

export function getInboxLinkForRole(logicalThreadId: string, role: "jill" | "hm" | "eng") {
  return getInboxLinksForLogical(logicalThreadId).find((l) => l.role === role);
}
