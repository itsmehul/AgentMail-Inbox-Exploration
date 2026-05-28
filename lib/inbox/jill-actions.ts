import type { AgentMail } from "agentmail";
import { createAgentMailClient } from "@/lib/agentmail/client";
import {
  getEngEmail,
  getHmEmail,
  getJillInboxEmail,
  isStaffAddress,
  isJillOnlyRecipient,
  type RoleInbox,
} from "@/lib/agentmail/config";
import {
  blockedRecipientFromError,
  ensureSendAllowed,
  isBlockedRecipientError,
  unblockSendRecipient,
} from "@/lib/agentmail/recipient-lists";
import {
  getLatestMessageForLogicalThread,
  getThreadRowByLogicalId,
  hasPendingApprovalDraft,
  markThreadHandedOff,
  promotePipelineStage,
  setThreadBlockReason,
  type DbThreadRow,
} from "@/lib/db/inbox-repository";
import {
  assertNoPendingApproval,
  PENDING_APPROVAL_ERROR,
  stageCandidateApprovalDraft,
} from "@/lib/inbox/approval-drafts";
import { buildHandoffBody, HANDOFF_INACTIVE_REPLY } from "@/lib/inbox/handoff-template";
import { JILL_COMMAND_HINTS, parseJillCommand, type JillCommandAction } from "@/lib/inbox/jill-commands";
import { getInboxLinkForRole } from "@/lib/inbox/pipeline-link";
import { ensurePipelineRoleLink } from "@/lib/inbox/role-thread-link";
import { STAGE_ORDER, type PipelineStage } from "@/lib/inbox/thread-stages";
import type { Prospect } from "@/lib/types";
import { broadcastInboxChanged } from "@/lib/inbox/sse-hub";
import { cleanEmailBody } from "@/lib/inbox/email-body-clean";
import { persistAgentMailMessage } from "@/lib/inbox/persist-message";

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

function currentPipelineStage(row: DbThreadRow | undefined): PipelineStage {
  if (!row) return "intro";
  const stages = JSON.parse(row.stages_json) as string[];
  const last = stages.at(-1);
  if (last && STAGE_ORDER.includes(last as PipelineStage)) return last as PipelineStage;
  return "intro";
}

function isHandedOff(row: DbThreadRow | undefined): boolean {
  return row?.folder === "handed_off";
}

async function replyJillToHmOnly(
  logicalThreadId: string,
  text: string
): Promise<{ ok: boolean; error?: string }> {
  const client = createAgentMailClient();
  const jillEmail = getJillInboxEmail();
  const hmEmail = getHmEmail();
  const jillLink =
    (await ensurePipelineRoleLink(logicalThreadId, "jill")) ?? getInboxLinkForRole(logicalThreadId, "jill");
  if (!jillLink) return { ok: false, error: "Jill thread link not found" };

  const latest = getLatestMessageForLogicalThread(logicalThreadId, "jill");
  if (!latest) return { ok: false, error: "No messages to reply to" };

  await ensureSendAllowed(client, jillLink.inbox_id, hmEmail);

  const sent = await sendWithAllowlistRetry(client, jillLink.inbox_id, () =>
    client.inboxes.messages.reply(jillLink.inbox_id, latest.message_id, {
      to: [hmEmail],
      text,
    })
  );

  if (sent.messageId) {
    const full = await client.inboxes.messages.get(jillLink.inbox_id, sent.messageId);
    persistAgentMailMessage(full, jillEmail, "jill");
  }

  broadcastInboxChanged("handoff_inactive");
  return { ok: true };
}

export async function executeJillCommand(
  logicalThreadId: string,
  action: JillCommandAction,
  whispererRole: "hm" | "eng"
): Promise<{ ok: boolean; error?: string }> {
  if (action.type === "ambiguous") {
    setThreadBlockReason(logicalThreadId, "unclear_intent");
    broadcastInboxChanged("jill_blocked");
    return { ok: false, error: JILL_COMMAND_HINTS };
  }

  if (action.type === "promote") {
    if (action.stage === "takehome") {
      return stageCandidateApprovalDraft(logicalThreadId, whispererRole, "takehome");
    }
    if (action.stage === "codereview") {
      return stageCandidateApprovalDraft(logicalThreadId, whispererRole, "codereview");
    }
    promotePipelineStage(logicalThreadId, action.stage);
    broadcastInboxChanged("stage_promoted");
    return { ok: true };
  }

  if (action.type === "handoff") {
    return executeHandoff(logicalThreadId);
  }

  return { ok: false, error: "Unknown action" };
}

async function executeHandoff(logicalThreadId: string): Promise<{ ok: boolean; error?: string }> {
  const pipeline = getThreadRowByLogicalId(logicalThreadId);
  if (isHandedOff(pipeline)) {
    return replyJillToHmOnly(logicalThreadId, HANDOFF_INACTIVE_REPLY);
  }

  const prospect = prospectFromPipeline(pipeline);
  if (!prospect) return { ok: false, error: "Candidate details not found on pipeline thread" };

  const stages = pipeline?.stages_json ? (JSON.parse(pipeline.stages_json) as string[]) : [];
  const text = buildHandoffBody(prospect, stages);
  const result = await replyJillToHmOnly(logicalThreadId, text);
  if (!result.ok) return result;

  markThreadHandedOff(logicalThreadId);
  broadcastInboxChanged("handoff");
  return { ok: true };
}

function prospectFromPipeline(row: DbThreadRow | undefined): Prospect | null {
  if (!row?.prospect_json) return null;
  try {
    return JSON.parse(row.prospect_json) as Prospect;
  } catch {
    return null;
  }
}

export async function handleJillWhisper(
  message: AgentMail.Message,
  logicalThreadId: string,
  role: RoleInbox
): Promise<void> {
  if (role !== "hm" && role !== "eng") return;
  if (!isStaffAddress(message.from ?? "")) return;

  const body = cleanEmailBody(message.text ?? message.extractedText ?? message.preview ?? "");
  const pipeline = getThreadRowByLogicalId(logicalThreadId);

  if (isHandedOff(pipeline)) {
    if (role === "hm") {
      await replyJillToHmOnly(logicalThreadId, HANDOFF_INACTIVE_REPLY);
    }
    return;
  }

  const stage = currentPipelineStage(pipeline);
  const action = parseJillCommand(body, stage);

  if (action.type === "handoff" && role !== "hm") {
    return;
  }

  if (hasPendingApprovalDraft(logicalThreadId)) {
    return;
  }

  await executeJillCommand(logicalThreadId, action, role);
}

export async function retryJillCommandFromInstructions(
  logicalThreadId: string,
  instructions: string
): Promise<{ ok: boolean; error?: string }> {
  if (hasPendingApprovalDraft(logicalThreadId)) {
    return { ok: false, error: PENDING_APPROVAL_ERROR };
  }

  const pipeline = getThreadRowByLogicalId(logicalThreadId);
  if (isHandedOff(pipeline)) {
    return replyJillToHmOnly(logicalThreadId, HANDOFF_INACTIVE_REPLY);
  }
  const stage = currentPipelineStage(pipeline);
  const action = parseJillCommand(instructions, stage);
  if (action.type === "handoff") {
    return executeHandoff(logicalThreadId);
  }
  const result = await executeJillCommand(logicalThreadId, action, "hm");
  if (result.ok) {
    setThreadBlockReason(logicalThreadId, null);
  }
  return result;
}

export function isWhisperMessage(message: AgentMail.Message, jillEmail = getJillInboxEmail()): boolean {
  return isJillOnlyRecipient((message.to ?? []).map(String), jillEmail);
}

export async function sendRoleReply(input: {
  role: "hm" | "eng";
  logicalThreadId: string;
  text: string;
  mode: "reply" | "jill";
  to?: string[];
  cc?: string[];
}): Promise<{ messageId?: string; threadId?: string }> {
  const client = createAgentMailClient();
  const jillEmail = getJillInboxEmail();
  const roleEmail = input.role === "hm" ? getHmEmail() : getEngEmail();
  const link = await ensurePipelineRoleLink(input.logicalThreadId, input.role);
  if (!link) throw new Error(`No ${input.role} thread linked for this pipeline`);

  const latest = getLatestMessageForLogicalThread(input.logicalThreadId, input.role);
  if (!latest) throw new Error("No messages to reply to in this thread");

  const pipeline = getThreadRowByLogicalId(input.logicalThreadId);
  const candidateEmail = pipeline?.candidate_email;

  if (input.mode === "jill") {
    assertNoPendingApproval(input.logicalThreadId);

    const to = input.to?.length ? input.to : [jillEmail];
    for (const addr of to) {
      await ensureSendAllowed(client, link.inbox_id, addr);
    }
    const sent = await client.inboxes.messages.reply(link.inbox_id, latest.message_id, {
      to: to.length === 1 ? to[0] : to,
      text: input.text,
    });
    if (sent.messageId) {
      const full = await client.inboxes.messages.get(link.inbox_id, sent.messageId);
      persistAgentMailMessage(full, jillEmail, input.role);
      if (isJillOnlyRecipient(full.to ?? [], jillEmail) && isStaffAddress(full.from ?? "")) {
        await handleJillWhisper(full, input.logicalThreadId, input.role);
      }
    }
    broadcastInboxChanged("message_sent");
    return { messageId: sent.messageId, threadId: sent.threadId };
  }

  const to = input.to?.length ? input.to : candidateEmail ? [candidateEmail] : [];
  if (!to.length) throw new Error("At least one To recipient is required");

  const cc =
    input.cc ?? (isHandedOff(pipeline) ? [] : jillEmail ? [jillEmail] : []);
  for (const addr of [...to, ...cc]) {
    await ensureSendAllowed(client, link.inbox_id, addr);
  }

  const sent = await sendWithAllowlistRetry(client, link.inbox_id, () =>
    client.inboxes.messages.reply(link.inbox_id, latest.message_id, {
      to: to.length === 1 ? to[0] : to,
      cc: cc.length ? (cc.length === 1 ? cc[0] : cc) : undefined,
      text: input.text,
    })
  );

  if (sent.messageId) {
    const full = await client.inboxes.messages.get(link.inbox_id, sent.messageId);
    persistAgentMailMessage(full, jillEmail, input.role);
  }

  broadcastInboxChanged("message_sent");
  return { messageId: sent.messageId, threadId: sent.threadId };
}

export async function resolveBlockedPipeline(logicalThreadId: string, instructions: string) {
  return retryJillCommandFromInstructions(logicalThreadId, instructions);
}
