import type { AgentMail } from "agentmail";
import { isJillAddress, parseEmailAddress } from "@/lib/agentmail/config";
import {
  getInboxLinksForLogical,
  getPendingApprovalDraft,
  listInboundThreadRows,
  listMessagesForLogicalThread,
  listMessagesForThread,
  listPipelineLogicalIds,
  listThreadRows,
  type DbMessageRow,
  type DbThreadRow,
} from "@/lib/db/inbox-repository";
import { cleanEmailBody } from "@/lib/inbox/email-body-clean";
import { approvalMessageFromDraft } from "@/lib/inbox/approval-drafts";
import type { BlockReason, Prospect, Thread, ThreadMessage } from "@/lib/types";

function formatTime(iso: string | Date | undefined): string {
  if (!iso) return "";
  const date = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function messageFromRow(row: DbMessageRow): ThreadMessage {
  return {
    from: row.from_addr,
    time: row.time_display,
    body: cleanEmailBody(row.body),
    stage: row.stage as ThreadMessage["stage"],
    agent: row.is_agent === 1,
    subjectLine: row.subject,
    to: JSON.parse(row.to_addrs_json) as string[],
    cc: JSON.parse(row.cc_addrs_json) as string[],
    internal: row.is_internal === 1,
  };
}

function dedupeMessages(rows: DbMessageRow[]): DbMessageRow[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    if (seen.has(row.message_id)) return false;
    seen.add(row.message_id);
    return true;
  });
}

function threadBaseFromRow(row: DbThreadRow, messages: ThreadMessage[]): Thread {
  const prospect = row.prospect_json ? (JSON.parse(row.prospect_json) as Prospect) : undefined;
  const tags = JSON.parse(row.tags_json) as string[];
  const stages = JSON.parse(row.stages_json) as string[];

  return {
    id: row.logical_thread_id ?? row.thread_id,
    folder: row.folder,
    stages,
    goal: row.goal || (prospect ? `${prospect.name} · ${prospect.role}` : "inbound"),
    from: row.from_display,
    time: row.time_display,
    subject: row.subject,
    preview: cleanEmailBody(row.preview),
    tags,
    userTags: [],
    blockReason: (row.block_reason as BlockReason | null) ?? undefined,
    meta: {
      msgs: row.message_count || messages.length,
      status: row.status,
      lastAction: row.last_action,
    },
    prospect,
    candidateEmail: row.candidate_email ?? undefined,
    messages,
    threadKind: row.thread_kind as Thread["threadKind"],
    logicalThreadId: row.logical_thread_id ?? undefined,
    inboxLinks: row.logical_thread_id
      ? getInboxLinksForLogical(row.logical_thread_id).map((l) => ({
          role: l.role as "jill" | "hm" | "eng",
          inboxId: l.inbox_id,
          threadId: l.thread_id,
        }))
      : undefined,
  };
}

export function threadFromDb(row: DbThreadRow, messages: DbMessageRow[]): Thread {
  return threadBaseFromRow(row, messages.map(messageFromRow));
}

export function agentMailMessageToUpsert(
  message: AgentMail.Message,
  jillEmail: string
): {
  messageId: string;
  threadId: string;
  inboxId: string;
  fromAddr: string;
  toAddrs: string[];
  ccAddrs: string[];
  subject: string;
  body: string;
  preview: string;
  isAgent: boolean;
  timeDisplay: string;
  timestampIso: string;
} {
  const from = message.from ?? "";
  const body = cleanEmailBody(message.text ?? message.extractedText ?? message.preview ?? "");
  const timestamp = message.timestamp ?? message.createdAt;

  return {
    messageId: String(message.messageId),
    threadId: String(message.threadId),
    inboxId: String(message.inboxId),
    fromAddr: from,
    toAddrs: (message.to ?? []).map(String),
    ccAddrs: (message.cc ?? []).map(String),
    subject: message.subject ?? "",
    body,
    preview: cleanEmailBody(message.preview) || body.slice(0, 160),
    isAgent: isJillAddress(from, jillEmail),
    timeDisplay: formatTime(timestamp),
    timestampIso: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
  };
}

export function threadHeaderFromMessage(message: AgentMail.Message): {
  fromDisplay: string;
  subject: string;
  preview: string;
  timeDisplay: string;
} {
  const parsed = parseEmailAddress(message.from ?? "Unknown");
  return {
    fromDisplay: parsed.email ? `${parsed.name} <${parsed.email}>` : parsed.name,
    subject: message.subject ?? "(no subject)",
    preview: cleanEmailBody(message.preview ?? message.text?.slice(0, 160) ?? ""),
    timeDisplay: formatTime(message.timestamp ?? message.createdAt),
  };
}

export function listThreadsFromDb(): Thread[] {
  const inbound = listInboundThreadRows().map((row) => threadFromDb(row, listMessagesForThread(row.thread_id)));

  const pipelineIds = listPipelineLogicalIds();
  const pipelineThreads: Thread[] = [];

  for (const logicalId of pipelineIds) {
    const rows = listThreadRows().filter((r) => r.logical_thread_id === logicalId);
    const primary = rows.find((r) => r.thread_kind === "pipeline") ?? rows[0];
    if (!primary) continue;

    const merged = dedupeMessages(listMessagesForLogicalThread(logicalId));
    const messageList = merged.map(messageFromRow);
    const draft = getPendingApprovalDraft(logicalId);
    if (draft) {
      messageList.push(approvalMessageFromDraft(draft));
    }
    const thread = threadBaseFromRow(primary, messageList);
    thread.id = logicalId;
    thread.meta.msgs = messageList.length;
    pipelineThreads.push(thread);
  }

  const combined = [...pipelineThreads, ...inbound];
  combined.sort((a, b) => {
    const aTime = a.time;
    const bTime = b.time;
    return bTime.localeCompare(aTime);
  });

  return combined;
}
