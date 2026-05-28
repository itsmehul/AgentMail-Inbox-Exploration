import { createAgentMailClient } from "@/lib/agentmail/client";
import {
  getEngDisplayName,
  getEngEmail,
  getJillInboxEmail,
  parseEmailAddress,
  type RoleInbox,
} from "@/lib/agentmail/config";
import {
  blockedRecipientFromError,
  ensureSendAllowed,
  isBlockedRecipientError,
  unblockSendRecipient,
} from "@/lib/agentmail/recipient-lists";
import {
  clearApprovalDraft,
  createApprovalDraft,
  getLatestMessageForLogicalThread,
  getPendingApprovalDraft,
  getThreadRowByLogicalId,
  hasPendingApprovalDraft,
  promotePipelineStage,
  type DbApprovalDraftRow,
} from "@/lib/db/inbox-repository";
import type { ApprovalSnapshot } from "@/lib/inbox/approval-changes";
import { buildTakehomeBody } from "@/lib/inbox/takehome-template";
import { getInboxLinkForRole } from "@/lib/inbox/pipeline-link";
import { persistAgentMailMessage } from "@/lib/inbox/persist-message";
import { ensurePipelineRoleLink } from "@/lib/inbox/role-thread-link";
import { broadcastInboxChanged } from "@/lib/inbox/sse-hub";
import type { PipelineStageId, Prospect, ThreadMessage } from "@/lib/types";

export const PENDING_APPROVAL_ERROR =
  "A draft is awaiting approval. Send or discard it before messaging Jill again.";

type CandidateDraftKind = "takehome" | "codereview";

const DRAFT_META: Record<
  CandidateDraftKind,
  { subagent: string; targetStage: PipelineStageId; status: string; lastAction: string; previewVerb: string }
> = {
  takehome: {
    subagent: "TakeHome-Sender",
    targetStage: "takehome",
    status: "take-home sent",
    lastAction: "TakeHome-Sender",
    previewVerb: "take-home reply",
  },
  codereview: {
    subagent: "CodeReview-Scheduler",
    targetStage: "codereview",
    status: "code review",
    lastAction: "CodeReview-Scheduler",
    previewVerb: "code review invite",
  },
};

function prospectFromPipeline(row: ReturnType<typeof getThreadRowByLogicalId>): Prospect | null {
  if (!row?.prospect_json) return null;
  try {
    return JSON.parse(row.prospect_json) as Prospect;
  } catch {
    return null;
  }
}

function formatCandidateAddr(prospect: Prospect | null, candidateEmail: string): string {
  if (prospect?.name) return `${prospect.name} <${candidateEmail}>`;
  return candidateEmail;
}

function buildCodereviewBody(): string {
  const engName = getEngDisplayName();
  return `Moving this thread to the code review stage.

${engName} — please review the candidate's take-home when ready.

— jill-diy`;
}

function draftBody(kind: CandidateDraftKind, prospect: Prospect | null): string {
  if (kind === "takehome") {
    if (!prospect) throw new Error("Candidate details not found on pipeline thread");
    return buildTakehomeBody(prospect);
  }
  return buildCodereviewBody();
}

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

export function assertNoPendingApproval(logicalThreadId: string): void {
  if (hasPendingApprovalDraft(logicalThreadId)) {
    throw new Error(PENDING_APPROVAL_ERROR);
  }
}

export async function stageCandidateApprovalDraft(
  logicalThreadId: string,
  whispererRole: "hm" | "eng",
  kind: CandidateDraftKind
): Promise<{ ok: boolean; error?: string }> {
  assertNoPendingApproval(logicalThreadId);

  const pipeline = getThreadRowByLogicalId(logicalThreadId);
  const candidateEmail = pipeline?.candidate_email;
  if (!candidateEmail) return { ok: false, error: "No candidate email on pipeline thread" };

  const prospect = prospectFromPipeline(pipeline);
  if (kind === "takehome" && !prospect) {
    return { ok: false, error: "Candidate details not found on pipeline thread" };
  }

  const jillEmail = getJillInboxEmail();
  const ccAddrs = kind === "codereview" ? [jillEmail, getEngEmail()] : [jillEmail];
  const meta = DRAFT_META[kind];
  const body = draftBody(kind, prospect);
  const candidateName = prospect?.name ?? parseEmailAddress(candidateEmail).name;

  createApprovalDraft({
    logicalThreadId,
    whispererRole,
    toAddrs: [formatCandidateAddr(prospect, candidateEmail)],
    ccAddrs,
    bccAddrs: [],
    subject: pipeline?.subject ?? "Reply",
    body,
    subagent: meta.subagent,
    targetStage: meta.targetStage,
    pipelineStage: kind === "takehome" ? "takehome" : "codereview",
    previousStatus: pipeline?.status ?? "received",
    previousFolder: pipeline?.folder ?? "all",
    preview: `jill-diy drafted a ${meta.previewVerb} for ${candidateName} — awaiting your approval.`,
    lastAction: meta.subagent,
  });

  broadcastInboxChanged("approval_drafted");
  return { ok: true };
}

export async function sendApprovedDraft(
  logicalThreadId: string,
  snapshot: ApprovalSnapshot
): Promise<{ ok: boolean; error?: string }> {
  const draft = getPendingApprovalDraft(logicalThreadId);
  if (!draft) return { ok: false, error: "No pending approval draft for this thread" };

  const meta = Object.values(DRAFT_META).find((m) => m.targetStage === draft.target_stage);
  if (!meta) return { ok: false, error: "Unknown draft type" };

  const whispererRole = draft.whisperer_role as "hm" | "eng";
  const client = createAgentMailClient();
  const jillEmail = getJillInboxEmail();

  const link =
    (await ensurePipelineRoleLink(logicalThreadId, whispererRole)) ??
    getInboxLinkForRole(logicalThreadId, whispererRole);
  if (!link) return { ok: false, error: `No ${whispererRole} thread linked for this pipeline` };

  const latest = getLatestMessageForLogicalThread(logicalThreadId, whispererRole);
  if (!latest) return { ok: false, error: "No messages to reply to in this thread" };

  const to = snapshot.to.length ? snapshot.to : JSON.parse(draft.to_addrs_json) as string[];
  const cc = snapshot.cc.length ? snapshot.cc : JSON.parse(draft.cc_addrs_json) as string[];
  const bcc = snapshot.bcc.length ? snapshot.bcc : JSON.parse(draft.bcc_addrs_json) as string[];

  for (const addr of [...to, ...cc, ...bcc]) {
    await ensureSendAllowed(client, link.inbox_id, parseEmailAddress(addr).email || addr);
  }

  const sent = await sendWithAllowlistRetry(client, link.inbox_id, () =>
    client.inboxes.messages.reply(link.inbox_id, latest.message_id, {
      to: to.length === 1 ? to[0] : to,
      cc: cc.length ? (cc.length === 1 ? cc[0] : cc) : undefined,
      bcc: bcc.length ? (bcc.length === 1 ? bcc[0] : bcc) : undefined,
      text: snapshot.body,
    })
  );

  if (sent.messageId) {
    const full = await client.inboxes.messages.get(link.inbox_id, sent.messageId);
    persistAgentMailMessage(full, jillEmail, whispererRole);
  }

  clearApprovalDraft(logicalThreadId);
  promotePipelineStage(logicalThreadId, draft.target_stage as PipelineStageId, {
    status: meta.status,
    lastAction: meta.lastAction,
  });

  broadcastInboxChanged("approval_sent");
  return { ok: true };
}

export function discardApprovalDraft(logicalThreadId: string): { ok: boolean; error?: string } {
  const draft = getPendingApprovalDraft(logicalThreadId);
  if (!draft) return { ok: false, error: "No pending approval draft for this thread" };

  clearApprovalDraft(logicalThreadId);
  broadcastInboxChanged("approval_discarded");
  return { ok: true };
}

function formatDraftWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "drafted recently";
  const seconds = Math.max(1, Math.round((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return `drafted ${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  return `drafted ${minutes}m ago`;
}

export function approvalMessageFromDraft(draft: DbApprovalDraftRow): ThreadMessage {
  return {
    approval: true,
    stage: draft.pipeline_stage as ThreadMessage["stage"],
    sub: draft.subagent,
    when: formatDraftWhen(draft.created_at),
    to: JSON.parse(draft.to_addrs_json) as string[],
    cc: JSON.parse(draft.cc_addrs_json) as string[],
    bcc: JSON.parse(draft.bcc_addrs_json) as string[],
    subjectLine: draft.subject,
    body: draft.body,
    draftId: draft.draft_id,
    whispererRole: draft.whisperer_role as RoleInbox,
  };
}
