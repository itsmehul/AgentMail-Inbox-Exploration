import { getDb } from "@/lib/db/sqlite";
import { isPipelineIntroSubject, subjectsMatchPipeline } from "@/lib/inbox/subject-match";
import type { BlockReason, PipelineStageId, Prospect } from "@/lib/types";

export type DbThreadRow = {
  thread_id: string;
  inbox_id: string;
  subject: string;
  preview: string;
  from_display: string;
  time_display: string;
  folder: string;
  stages_json: string;
  goal: string;
  tags_json: string;
  prospect_json: string | null;
  intro_sent: number;
  message_count: number;
  status: string;
  last_action: string;
  updated_at: string;
  logical_thread_id: string | null;
  thread_kind: string;
  block_reason: string | null;
  candidate_email: string | null;
};

export type DbApprovalDraftRow = {
  draft_id: string;
  logical_thread_id: string;
  whisperer_role: string;
  to_addrs_json: string;
  cc_addrs_json: string;
  bcc_addrs_json: string;
  subject: string;
  body: string;
  subagent: string;
  target_stage: string;
  pipeline_stage: string;
  previous_status: string;
  previous_folder: string;
  created_at: string;
};

export type DbMessageRow = {
  message_id: string;
  thread_id: string;
  inbox_id: string;
  from_addr: string;
  to_addrs_json: string;
  cc_addrs_json: string;
  subject: string;
  body: string;
  preview: string;
  is_agent: number;
  stage: string;
  time_display: string;
  timestamp_iso: string;
  created_at: string;
  is_internal: number;
  logical_thread_id: string | null;
};

export type ThreadInboxLink = {
  logical_thread_id: string;
  inbox_id: string;
  thread_id: string;
  role: string;
};

export function isEventProcessed(eventId: string): boolean {
  const existing = getDb()
    .prepare("SELECT event_id FROM processed_events WHERE event_id = ?")
    .get(eventId);
  return Boolean(existing);
}

export function markEventProcessed(eventId: string): boolean {
  const db = getDb();
  if (isEventProcessed(eventId)) return false;
  db.prepare("INSERT INTO processed_events (event_id) VALUES (?)").run(eventId);
  return true;
}

export function unmarkEventProcessed(eventId: string) {
  getDb().prepare("DELETE FROM processed_events WHERE event_id = ?").run(eventId);
}

export function getThreadRow(threadId: string): DbThreadRow | undefined {
  return getDb().prepare("SELECT * FROM threads WHERE thread_id = ?").get(threadId) as DbThreadRow | undefined;
}

export function getThreadRowByLogicalId(logicalThreadId: string): DbThreadRow | undefined {
  return getDb()
    .prepare("SELECT * FROM threads WHERE logical_thread_id = ? AND thread_kind = 'pipeline' LIMIT 1")
    .get(logicalThreadId) as DbThreadRow | undefined;
}

export function isIntroSent(threadId: string): boolean {
  const row = getThreadRow(threadId);
  return Boolean(row?.intro_sent);
}

/** Atomically mark an inbound thread as intro-processed so webhook + sync cannot double-send. */
export function tryClaimIntroProcessing(threadId: string): boolean {
  const result = getDb()
    .prepare(
      `UPDATE threads SET intro_sent = 1, status = 'processing intro', last_action = 'Ack', updated_at = datetime('now')
       WHERE thread_id = ? AND intro_sent = 0`
    )
    .run(threadId);
  return result.changes > 0;
}

/** Undo a failed intro attempt so webhook retry or sync can run again. */
export function releaseIntroProcessingClaim(threadId: string) {
  getDb()
    .prepare(
      `UPDATE threads SET intro_sent = 0, status = 'received', last_action = 'Inbound email', updated_at = datetime('now')
       WHERE thread_id = ? AND status = 'processing intro'`
    )
    .run(threadId);
}

export function setIntroSent(threadId: string) {
  getDb()
    .prepare("UPDATE threads SET intro_sent = 1, status = ?, last_action = ?, updated_at = datetime('now') WHERE thread_id = ?")
    .run("ack sent", "Ack", threadId);
}

export function setThreadBlockReason(logicalThreadId: string, reason: BlockReason | null) {
  getDb()
    .prepare(
      `UPDATE threads SET block_reason = ?, folder = ?, updated_at = datetime('now')
       WHERE logical_thread_id = ? OR thread_id = ?`
    )
    .run(reason, reason ? "blocked" : "all", logicalThreadId, logicalThreadId);
}

export function upsertThreadInboxLink(link: ThreadInboxLink) {
  const db = getDb();
  const existing = db
    .prepare("SELECT thread_id FROM thread_inbox_links WHERE logical_thread_id = ? AND inbox_id = ?")
    .get(link.logical_thread_id, link.inbox_id) as { thread_id: string } | undefined;

  if (existing && existing.thread_id !== link.thread_id) {
    const existingThread = getThreadRow(existing.thread_id);
    const incomingThread = getThreadRow(link.thread_id);
    const existingIsPipeline = existingThread?.thread_kind === "pipeline";
    const incomingIsPipeline = incomingThread?.thread_kind === "pipeline";
    if (existingIsPipeline && !incomingIsPipeline) return;
  }

  db.prepare(
    `INSERT INTO thread_inbox_links (logical_thread_id, inbox_id, thread_id, role)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(logical_thread_id, inbox_id) DO UPDATE SET
       thread_id = excluded.thread_id,
       role = excluded.role`
  ).run(link.logical_thread_id, link.inbox_id, link.thread_id, link.role);
}

export function getInboxLinksForLogical(logicalThreadId: string): ThreadInboxLink[] {
  return getDb()
    .prepare("SELECT * FROM thread_inbox_links WHERE logical_thread_id = ?")
    .all(logicalThreadId) as ThreadInboxLink[];
}

export function getLogicalIdForAgentMailThread(threadId: string): string | undefined {
  const direct = getThreadRow(threadId);
  if (direct?.logical_thread_id) return direct.logical_thread_id;
  const link = getDb()
    .prepare("SELECT logical_thread_id FROM thread_inbox_links WHERE thread_id = ?")
    .get(threadId) as { logical_thread_id: string } | undefined;
  return link?.logical_thread_id;
}

export function findPipelineByCandidateEmail(candidateEmail: string): DbThreadRow | undefined {
  const normalized = candidateEmail.toLowerCase();
  return getDb()
    .prepare(
      `SELECT * FROM threads WHERE thread_kind = 'pipeline' AND candidate_email = ? ORDER BY updated_at DESC LIMIT 1`
    )
    .get(normalized) as DbThreadRow | undefined;
}

export function findPipelineByIntroSubject(subject: string): DbThreadRow | undefined {
  const trimmed = subject.trim();
  if (!isPipelineIntroSubject(trimmed)) return undefined;

  const exact = getDb()
    .prepare(
      `SELECT * FROM threads WHERE thread_kind = 'pipeline' AND subject = ? ORDER BY updated_at DESC LIMIT 1`
    )
    .get(trimmed) as DbThreadRow | undefined;
  if (exact) return exact;

  const candidates = getDb()
    .prepare(
      `SELECT * FROM threads
       WHERE thread_kind = 'pipeline'
         AND (lower(subject) LIKE 'intro:%' OR lower(subject) LIKE 're: intro:%')
       ORDER BY updated_at DESC`
    )
    .all() as DbThreadRow[];

  return candidates.find((row) => subjectsMatchPipeline(row.subject, trimmed));
}

export function markThreadHandedOff(logicalThreadId: string) {
  getDb()
    .prepare(
      `UPDATE threads SET folder = 'handed_off', status = 'handed off', last_action = 'Handoff',
       block_reason = NULL, updated_at = datetime('now')
       WHERE logical_thread_id = ? OR thread_id = ?`
    )
    .run(logicalThreadId, logicalThreadId);
}

export function promotePipelineStage(
  logicalThreadId: string,
  stage: PipelineStageId,
  meta?: { status?: string; lastAction?: string }
) {
  const db = getDb();
  const row = getThreadRowByLogicalId(logicalThreadId) ?? getThreadRow(logicalThreadId);
  if (!row) return;
  const stages = JSON.parse(row.stages_json) as string[];
  if (!stages.includes(stage)) stages.push(stage);
  db.prepare(
    `UPDATE threads SET stages_json = ?, status = ?, last_action = ?, block_reason = NULL, folder = 'all', updated_at = datetime('now')
     WHERE logical_thread_id = ? OR thread_id = ?`
  ).run(
    JSON.stringify(stages),
    meta?.status ?? `at ${stage}`,
    meta?.lastAction ?? "Stage-Promoter",
    logicalThreadId,
    logicalThreadId
  );
}

export function upsertThread(input: {
  threadId: string;
  inboxId: string;
  subject: string;
  preview: string;
  fromDisplay: string;
  timeDisplay: string;
  messageCount?: number;
  prospect?: Prospect | null;
  introSent?: boolean;
  status?: string;
  lastAction?: string;
  logicalThreadId?: string | null;
  threadKind?: "inbound" | "pipeline";
  blockReason?: BlockReason | null;
  candidateEmail?: string | null;
  folder?: string;
  stages?: string[];
}) {
  const db = getDb();
  const existing = getThreadRow(input.threadId);
  const prospectJson = input.prospect ? JSON.stringify(input.prospect) : existing?.prospect_json ?? null;
  const messageCount = input.messageCount ?? existing?.message_count ?? 0;
  const goal = input.prospect
    ? `${input.prospect.name} · ${input.prospect.role} @ ${input.prospect.company}`
    : existing?.goal ?? "";
  const tags = input.prospect
    ? JSON.stringify(["Intro", input.prospect.company])
    : existing?.tags_json ?? "[]";
  const logicalThreadId = input.logicalThreadId ?? existing?.logical_thread_id ?? null;
  const threadKind = input.threadKind ?? existing?.thread_kind ?? "inbound";
  const candidateEmail =
    input.candidateEmail ??
    input.prospect?.email?.toLowerCase() ??
    existing?.candidate_email ??
    null;
  const stagesJson = input.stages ? JSON.stringify(input.stages) : existing?.stages_json ?? '["intro"]';
  const pendingApproval =
    logicalThreadId && !input.folder && !input.blockReason && hasPendingApprovalDraft(logicalThreadId);
  const folder =
    input.folder ??
    (input.blockReason ? "blocked" : pendingApproval ? "approval" : existing?.folder ?? "all");

  db.prepare(
    `INSERT INTO threads (
      thread_id, inbox_id, subject, preview, from_display, time_display,
      goal, tags_json, prospect_json, intro_sent, message_count, status, last_action,
      logical_thread_id, thread_kind, block_reason, candidate_email, folder, stages_json, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(thread_id) DO UPDATE SET
      subject = excluded.subject,
      preview = excluded.preview,
      from_display = excluded.from_display,
      time_display = excluded.time_display,
      goal = CASE WHEN excluded.goal != '' THEN excluded.goal ELSE threads.goal END,
      tags_json = CASE WHEN excluded.tags_json != '[]' THEN excluded.tags_json ELSE threads.tags_json END,
      prospect_json = COALESCE(excluded.prospect_json, threads.prospect_json),
      message_count = excluded.message_count,
      status = COALESCE(excluded.status, threads.status),
      last_action = COALESCE(excluded.last_action, threads.last_action),
      intro_sent = MAX(threads.intro_sent, excluded.intro_sent),
      logical_thread_id = COALESCE(excluded.logical_thread_id, threads.logical_thread_id),
      thread_kind = COALESCE(excluded.thread_kind, threads.thread_kind),
      block_reason = COALESCE(excluded.block_reason, threads.block_reason),
      candidate_email = COALESCE(excluded.candidate_email, threads.candidate_email),
      folder = COALESCE(excluded.folder, threads.folder),
      stages_json = COALESCE(excluded.stages_json, threads.stages_json),
      updated_at = datetime('now')`
  ).run(
    input.threadId,
    input.inboxId,
    input.subject,
    input.preview,
    input.fromDisplay,
    input.timeDisplay,
    goal,
    tags,
    prospectJson,
    input.introSent ? 1 : existing?.intro_sent ?? 0,
    messageCount,
    input.status ?? existing?.status ?? "received",
    input.lastAction ?? existing?.last_action ?? "Inbound email",
    logicalThreadId,
    threadKind,
    input.blockReason ?? existing?.block_reason ?? null,
    candidateEmail,
    folder,
    stagesJson
  );
}

export function upsertMessage(input: {
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
  isInternal?: boolean;
  logicalThreadId?: string | null;
  stage?: string;
}) {
  getDb()
    .prepare(
      `INSERT INTO messages (
        message_id, thread_id, inbox_id, from_addr, to_addrs_json, cc_addrs_json,
        subject, body, preview, is_agent, time_display, timestamp_iso, is_internal, logical_thread_id, stage
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(message_id, thread_id) DO UPDATE SET
        from_addr = excluded.from_addr,
        to_addrs_json = excluded.to_addrs_json,
        cc_addrs_json = excluded.cc_addrs_json,
        subject = excluded.subject,
        body = excluded.body,
        preview = excluded.preview,
        is_agent = excluded.is_agent,
        time_display = excluded.time_display,
        timestamp_iso = excluded.timestamp_iso,
        is_internal = excluded.is_internal,
        logical_thread_id = COALESCE(excluded.logical_thread_id, messages.logical_thread_id),
        stage = COALESCE(excluded.stage, messages.stage)`
    )
    .run(
      input.messageId,
      input.threadId,
      input.inboxId,
      input.fromAddr,
      JSON.stringify(input.toAddrs),
      JSON.stringify(input.ccAddrs),
      input.subject,
      input.body,
      input.preview,
      input.isAgent ? 1 : 0,
      input.timeDisplay,
      input.timestampIso,
      input.isInternal ? 1 : 0,
      input.logicalThreadId ?? null,
      input.stage ?? "intro"
    );
}

export function listThreadRows(): DbThreadRow[] {
  return getDb()
    .prepare("SELECT * FROM threads ORDER BY updated_at DESC")
    .all() as DbThreadRow[];
}

export function listMessagesForThread(threadId: string): DbMessageRow[] {
  return getDb()
    .prepare("SELECT * FROM messages WHERE thread_id = ? ORDER BY timestamp_iso ASC")
    .all(threadId) as DbMessageRow[];
}

export function listMessagesForLogicalThread(logicalThreadId: string): DbMessageRow[] {
  const links = getInboxLinksForLogical(logicalThreadId);
  const threadIds = links.map((l) => l.thread_id);
  const primary = getThreadRowByLogicalId(logicalThreadId);
  if (primary && !threadIds.includes(primary.thread_id)) threadIds.push(primary.thread_id);

  if (!threadIds.length) {
    return getDb()
      .prepare("SELECT * FROM messages WHERE logical_thread_id = ? ORDER BY timestamp_iso ASC")
      .all(logicalThreadId) as DbMessageRow[];
  }

  const placeholders = threadIds.map(() => "?").join(",");
  return getDb()
    .prepare(
      `SELECT * FROM messages WHERE thread_id IN (${placeholders}) OR logical_thread_id = ?
       ORDER BY timestamp_iso ASC`
    )
    .all(...threadIds, logicalThreadId) as DbMessageRow[];
}

export function getFirstInboundMessage(threadId: string, jillEmail: string): DbMessageRow | undefined {
  return listMessagesForThread(threadId).find((row) => !row.from_addr.toLowerCase().includes(jillEmail));
}

export function getLatestMessageForThread(threadId: string): DbMessageRow | undefined {
  const rows = listMessagesForThread(threadId);
  return rows.at(-1);
}

export function getLatestMessageForLogicalThread(logicalThreadId: string, role?: string): DbMessageRow | undefined {
  const links = getInboxLinksForLogical(logicalThreadId);
  const link = role ? links.find((l) => l.role === role) : links.find((l) => l.role === "jill");
  if (!link) return listMessagesForLogicalThread(logicalThreadId).at(-1);
  return getLatestMessageForThread(link.thread_id);
}

export function listPipelineLogicalIds(): string[] {
  const rows = getDb()
    .prepare(
      `SELECT DISTINCT logical_thread_id FROM threads WHERE thread_kind = 'pipeline' AND logical_thread_id IS NOT NULL`
    )
    .all() as { logical_thread_id: string }[];
  return rows.map((r) => r.logical_thread_id);
}

export function listInboundThreadRows(): DbThreadRow[] {
  return getDb()
    .prepare(`SELECT * FROM threads WHERE thread_kind = 'inbound' ORDER BY updated_at DESC`)
    .all() as DbThreadRow[];
}

export function hasPendingApprovalDraft(logicalThreadId: string): boolean {
  const row = getDb()
    .prepare("SELECT draft_id FROM approval_drafts WHERE logical_thread_id = ?")
    .get(logicalThreadId) as { draft_id: string } | undefined;
  return Boolean(row);
}

export function getPendingApprovalDraft(logicalThreadId: string): DbApprovalDraftRow | undefined {
  return getDb()
    .prepare("SELECT * FROM approval_drafts WHERE logical_thread_id = ?")
    .get(logicalThreadId) as DbApprovalDraftRow | undefined;
}

export function createApprovalDraft(input: {
  logicalThreadId: string;
  whispererRole: "hm" | "eng";
  toAddrs: string[];
  ccAddrs: string[];
  bccAddrs: string[];
  subject: string;
  body: string;
  subagent: string;
  targetStage: string;
  pipelineStage: string;
  previousStatus: string;
  previousFolder: string;
  preview: string;
  lastAction: string;
}) {
  const db = getDb();
  const draftId = `draft_${input.logicalThreadId}_${Date.now()}`;

  db.prepare(
    `INSERT INTO approval_drafts (
      draft_id, logical_thread_id, whisperer_role, to_addrs_json, cc_addrs_json, bcc_addrs_json,
      subject, body, subagent, target_stage, pipeline_stage, previous_status, previous_folder
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    draftId,
    input.logicalThreadId,
    input.whispererRole,
    JSON.stringify(input.toAddrs),
    JSON.stringify(input.ccAddrs),
    JSON.stringify(input.bccAddrs),
    input.subject,
    input.body,
    input.subagent,
    input.targetStage,
    input.pipelineStage,
    input.previousStatus,
    input.previousFolder
  );

  db.prepare(
    `UPDATE threads SET folder = 'approval', status = 'awaiting approval', preview = ?, last_action = ?,
     updated_at = datetime('now')
     WHERE logical_thread_id = ? OR thread_id = ?`
  ).run(input.preview, input.lastAction, input.logicalThreadId, input.logicalThreadId);
}

export function clearApprovalDraft(logicalThreadId: string) {
  const db = getDb();
  const draft = getPendingApprovalDraft(logicalThreadId);
  if (!draft) return;

  db.prepare("DELETE FROM approval_drafts WHERE logical_thread_id = ?").run(logicalThreadId);

  db.prepare(
    `UPDATE threads SET folder = ?, status = ?, updated_at = datetime('now')
     WHERE logical_thread_id = ? OR thread_id = ?`
  ).run(draft.previous_folder || "all", draft.previous_status || "received", logicalThreadId, logicalThreadId);
}
