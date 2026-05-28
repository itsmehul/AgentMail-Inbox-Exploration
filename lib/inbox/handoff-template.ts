import { getHmDisplayName } from "@/lib/agentmail/config";
import { STAGE_LABELS, STAGE_ORDER, type PipelineStage } from "@/lib/inbox/thread-stages";
import type { Prospect } from "@/lib/types";

function stageBullets(stages: string[]): string {
  const completed = STAGE_ORDER.filter((stage) => stages.includes(stage));
  if (!completed.length) return "• No pipeline stages recorded yet";
  return completed.map((stage) => `• ${STAGE_LABELS[stage as PipelineStage]}: completed`).join("\n");
}

export function buildHandoffBody(prospect: Prospect, stages: string[]): string {
  const hmName = getHmDisplayName();

  return `Quick recap before stepping out — ${prospect.name} (${prospect.role}):

${stageBullets(stages)}

I'm stepping out of this thread. You can reach ${prospect.name} directly from here; I won't be Cc'd on future replies.

— jill-diy on behalf of ${hmName}`;
}

export const HANDOFF_INACTIVE_REPLY =
  "This thread was handed off; I'm no longer active here. Reply to the candidate on the main thread without me on Cc.";
