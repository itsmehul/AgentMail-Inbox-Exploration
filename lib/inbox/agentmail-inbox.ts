import type { AgentMail } from "agentmail";
import { createAgentMailClient } from "@/lib/agentmail/client";
import {
  getJillInboxEmail,
  isJillOnlyRecipient,
  isStaffAddress,
  resolveAllRoleInboxes,
  type RoleInbox,
} from "@/lib/agentmail/config";
import {
  findPipelineByIntroSubject,
  getInboxLinksForLogical,
  getLogicalIdForAgentMailThread,
  getPendingApprovalDraft,
  getThreadRow,
  getThreadRowByLogicalId,
  type DbThreadRow,
} from "@/lib/db/inbox-repository";
import { approvalMessageFromDraft } from "@/lib/inbox/approval-drafts";
import { pipelineLogicalId, resolveLogicalThreadForMessage } from "@/lib/inbox/pipeline-link";
import { isPipelineIntroSubject, normalizeEmailSubject } from "@/lib/inbox/subject-match";
import {
  agentMailMessageToUpsert,
  threadHeaderFromMessage,
} from "@/lib/inbox/thread-mapper";
import type { BlockReason, Prospect, Thread, ThreadMessage } from "@/lib/types";

const THREAD_LIST_LIMIT = 50;

type ParsedMessage = {
  messageId: string;
  timestampIso: string;
  message: ThreadMessage;
};

type FetchedThread = {
  threadId: string;
  inboxId: string;
  role: RoleInbox;
  subject: string;
  preview: string;
  fromDisplay: string;
  timeDisplay: string;
  messageCount: number;
  messages: ParsedMessage[];
  rawMessages: AgentMail.Message[];
};

function parseAgentMailMessage(message: AgentMail.Message, jillEmail: string): ParsedMessage {
  const upsert = agentMailMessageToUpsert(message, jillEmail);
  const isInternal = isJillOnlyRecipient(upsert.toAddrs, jillEmail) && isStaffAddress(upsert.fromAddr);

  return {
    messageId: upsert.messageId,
    timestampIso: upsert.timestampIso,
    message: {
      from: upsert.fromAddr,
      time: upsert.timeDisplay,
      body: upsert.body,
      agent: upsert.isAgent,
      subjectLine: upsert.subject,
      to: upsert.toAddrs,
      cc: upsert.ccAddrs,
      internal: isInternal,
    },
  };
}

function mergeParsedMessages(parts: FetchedThread[]): ThreadMessage[] {
  const seen = new Set<string>();
  const merged: ParsedMessage[] = [];

  for (const part of parts) {
    for (const parsed of part.messages) {
      if (seen.has(parsed.messageId)) continue;
      seen.add(parsed.messageId);
      merged.push(parsed);
    }
  }

  merged.sort((a, b) => a.timestampIso.localeCompare(b.timestampIso));
  return merged.map((entry) => entry.message);
}

function metadataFromDbRow(row: DbThreadRow | undefined) {
  const prospect = row?.prospect_json ? (JSON.parse(row.prospect_json) as Prospect) : undefined;
  return {
    folder: row?.folder ?? "all",
    stages: row ? (JSON.parse(row.stages_json) as string[]) : ["intro"],
    goal: row?.goal || (prospect ? `${prospect.name} · ${prospect.role}` : "inbound"),
    tags: row ? (JSON.parse(row.tags_json) as string[]) : [],
    blockReason: (row?.block_reason as BlockReason | null) ?? undefined,
    status: row?.status ?? "received",
    lastAction: row?.last_action ?? "Inbound",
    candidateEmail: row?.candidate_email ?? undefined,
    prospect,
  };
}

function buildJillIntroSubjectMap(fetched: FetchedThread[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const part of fetched) {
    if (part.role !== "jill" || !isPipelineIntroSubject(part.subject)) continue;
    map.set(normalizeEmailSubject(part.subject).toLowerCase(), pipelineLogicalId(part.threadId));
  }
  return map;
}

function classifyThread(
  part: FetchedThread,
  jillIntroBySubject: Map<string, string>
): { kind: "pipeline" | "inbound"; logicalId: string | null } {
  const dbLink = getLogicalIdForAgentMailThread(part.threadId);
  if (dbLink) {
    const row = getThreadRow(part.threadId);
    if (row?.thread_kind === "inbound") {
      return { kind: "inbound", logicalId: null };
    }
    return { kind: "pipeline", logicalId: dbLink };
  }

  if (isPipelineIntroSubject(part.subject)) {
    if (part.role === "jill") {
      return { kind: "pipeline", logicalId: pipelineLogicalId(part.threadId) };
    }

    const normalized = normalizeEmailSubject(part.subject).toLowerCase();
    const jillLogical = jillIntroBySubject.get(normalized);
    if (jillLogical) {
      return { kind: "pipeline", logicalId: jillLogical };
    }

    const dbMatch = findPipelineByIntroSubject(part.subject);
    if (dbMatch?.logical_thread_id) {
      return { kind: "pipeline", logicalId: dbMatch.logical_thread_id };
    }

    return { kind: "pipeline", logicalId: null };
  }

  const last = part.rawMessages.at(-1);
  if (last) {
    const upsert = agentMailMessageToUpsert(last, getJillInboxEmail());
    const resolved = resolveLogicalThreadForMessage({
      threadId: part.threadId,
      inboxId: part.inboxId,
      subject: upsert.subject,
      fromAddr: upsert.fromAddr,
      toAddrs: upsert.toAddrs,
      ccAddrs: upsert.ccAddrs,
      role: part.role,
    });
    if (resolved.logicalThreadId) {
      return { kind: "pipeline", logicalId: resolved.logicalThreadId };
    }
  }

  if (part.role === "jill") {
    return { kind: "inbound", logicalId: null };
  }

  return { kind: "pipeline", logicalId: null };
}

function buildPipelineThread(logicalId: string, parts: FetchedThread[]): Thread {
  const dbRow = getThreadRowByLogicalId(logicalId) ?? getThreadRow(logicalId);
  const meta = metadataFromDbRow(dbRow);
  const primary =
    parts.find((part) => part.role === "jill" && isPipelineIntroSubject(part.subject)) ??
    parts.find((part) => part.role === "jill") ??
    parts[0];

  const messages = mergeParsedMessages(parts);
  const draft = getPendingApprovalDraft(logicalId);
  if (draft) {
    messages.push(approvalMessageFromDraft(draft));
  }

  const dbLinks = getInboxLinksForLogical(logicalId);
  const linkMap = new Map(dbLinks.map((link) => [link.role, link]));
  for (const part of parts) {
    linkMap.set(part.role, {
      logical_thread_id: logicalId,
      inbox_id: part.inboxId,
      thread_id: part.threadId,
      role: part.role,
    });
  }

  return {
    id: logicalId,
    folder: draft ? "approval" : meta.folder,
    stages: meta.stages,
    goal: meta.goal,
    from: primary.fromDisplay,
    time: primary.timeDisplay,
    subject: primary.subject,
    preview: dbRow?.preview ?? primary.preview,
    tags: meta.tags,
    userTags: [],
    blockReason: meta.blockReason,
    meta: {
      msgs: messages.length,
      status: draft ? "awaiting approval" : meta.status,
      lastAction: draft?.subagent ?? meta.lastAction,
    },
    prospect: meta.prospect,
    candidateEmail: meta.candidateEmail,
    messages,
    threadKind: "pipeline",
    logicalThreadId: logicalId,
    inboxLinks: [...linkMap.values()].map((link) => ({
      role: link.role as "jill" | "hm" | "eng",
      inboxId: link.inbox_id,
      threadId: link.thread_id,
    })),
  };
}

function buildInboundThread(part: FetchedThread): Thread {
  const dbRow = getThreadRow(part.threadId);
  const meta = metadataFromDbRow(dbRow);

  return {
    id: part.threadId,
    folder: meta.folder,
    stages: meta.stages,
    goal: meta.goal,
    from: part.fromDisplay,
    time: part.timeDisplay,
    subject: part.subject,
    preview: part.preview,
    tags: meta.tags,
    userTags: [],
    blockReason: meta.blockReason,
    meta: {
      msgs: part.messages.length,
      status: meta.status,
      lastAction: meta.lastAction,
    },
    prospect: meta.prospect,
    candidateEmail: meta.candidateEmail,
    messages: part.messages.map((entry) => entry.message),
    threadKind: "inbound",
    logicalThreadId: dbRow?.logical_thread_id ?? undefined,
  };
}

async function fetchAllRoleThreads(): Promise<FetchedThread[]> {
  const roles = await resolveAllRoleInboxes();
  const client = createAgentMailClient();
  const jillEmail = getJillInboxEmail();
  const fetched: FetchedThread[] = [];

  for (const { inboxId, role } of roles) {
    const listed = await client.inboxes.threads.list(inboxId, { limit: THREAD_LIST_LIMIT });

    for (const item of listed.threads) {
      const full = await client.inboxes.threads.get(inboxId, item.threadId);
      const last = full.messages.at(-1);
      const header = last
        ? threadHeaderFromMessage(last)
        : {
            fromDisplay: full.senders?.[0] ?? "Unknown",
            subject: full.subject ?? "(no subject)",
            preview: full.preview ?? "",
            timeDisplay: "",
          };

      fetched.push({
        threadId: String(full.threadId),
        inboxId,
        role,
        subject: full.subject ?? header.subject,
        preview: full.preview ?? header.preview,
        fromDisplay: full.senders?.[0] ?? header.fromDisplay,
        timeDisplay: header.timeDisplay,
        messageCount: full.messageCount ?? full.messages.length,
        messages: full.messages.map((message) => parseAgentMailMessage(message, jillEmail)),
        rawMessages: full.messages,
      });
    }
  }

  return fetched;
}

/** Unified inbox: all role inboxes merged by pipeline, with AgentMail as the message source of truth. */
export async function listUnifiedInboxFromAgentMail(): Promise<Thread[]> {
  const fetched = await fetchAllRoleThreads();
  const jillIntroBySubject = buildJillIntroSubjectMap(fetched);

  const pipelineGroups = new Map<string, FetchedThread[]>();
  const inboundThreads: Thread[] = [];
  const seenInbound = new Set<string>();

  for (const part of fetched) {
    const { kind, logicalId } = classifyThread(part, jillIntroBySubject);

    if (kind === "inbound") {
      if (seenInbound.has(part.threadId)) continue;
      seenInbound.add(part.threadId);
      inboundThreads.push(buildInboundThread(part));
      continue;
    }

    if (!logicalId) continue;

    const group = pipelineGroups.get(logicalId) ?? [];
    group.push(part);
    pipelineGroups.set(logicalId, group);
  }

  const pipelineThreads = [...pipelineGroups.entries()].map(([logicalId, parts]) =>
    buildPipelineThread(logicalId, parts)
  );

  const combined = [...pipelineThreads, ...inboundThreads];
  combined.sort((a, b) => b.time.localeCompare(a.time));
  return combined;
}
