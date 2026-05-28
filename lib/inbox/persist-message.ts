import type { AgentMail } from "agentmail";
import {
  getJillInboxEmail,
  isJillAddress,
  isJillOnlyRecipient,
  isStaffAddress,
  type RoleInbox,
} from "@/lib/agentmail/config";
import { upsertMessage, upsertThread, upsertThreadInboxLink } from "@/lib/db/inbox-repository";
import { extractProspect } from "@/lib/inbox/prospect-extract";
import { resolveLogicalThreadForMessage } from "@/lib/inbox/pipeline-link";
import { agentMailMessageToUpsert, threadHeaderFromMessage } from "@/lib/inbox/thread-mapper";

export function persistAgentMailMessage(
  message: AgentMail.Message,
  jillEmail = getJillInboxEmail(),
  inboxRole: RoleInbox = "jill"
) {
  const upsert = agentMailMessageToUpsert(message, jillEmail);
  const header = threadHeaderFromMessage(message);
  const isInternal = isJillOnlyRecipient(upsert.toAddrs, jillEmail) && isStaffAddress(upsert.fromAddr);

  let prospect = null;
  const fromStaff = isStaffAddress(message.from ?? "");
  if (!isJillAddress(message.from ?? "", jillEmail) && !fromStaff) {
    prospect = extractProspect(message.from ?? "", message.subject ?? "", upsert.body);
  }

  const resolved = resolveLogicalThreadForMessage({
    threadId: upsert.threadId,
    inboxId: upsert.inboxId,
    subject: upsert.subject,
    fromAddr: upsert.fromAddr,
    toAddrs: upsert.toAddrs,
    ccAddrs: upsert.ccAddrs,
    role: inboxRole,
  });

  if (resolved.logicalThreadId) {
    upsertThreadInboxLink({
      logical_thread_id: resolved.logicalThreadId,
      inbox_id: upsert.inboxId,
      thread_id: upsert.threadId,
      role: inboxRole,
    });
  }

  upsertThread({
    threadId: upsert.threadId,
    inboxId: upsert.inboxId,
    subject: header.subject,
    preview: header.preview,
    fromDisplay: header.fromDisplay,
    timeDisplay: header.timeDisplay,
    ...(prospect ? { prospect, candidateEmail: prospect.email } : {}),
    logicalThreadId: resolved.logicalThreadId,
    threadKind: resolved.threadKind ?? undefined,
  });

  upsertMessage({
    ...upsert,
    isInternal,
    logicalThreadId: resolved.logicalThreadId,
  });

  return { ...upsert, isInternal, logicalThreadId: resolved.logicalThreadId, role: inboxRole };
}
