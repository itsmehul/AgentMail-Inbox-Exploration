import { getNextStage, STAGE_ORDER, type PipelineStage } from "@/lib/inbox/thread-stages";
import type { PipelineStageId } from "@/lib/types";

export type JillCommandAction =
  | { type: "promote"; stage: PipelineStageId }
  | { type: "handoff" }
  | { type: "ambiguous" };

function inferPromoteStage(text: string, currentStage: PipelineStage): PipelineStageId | null {
  const lower = text.toLowerCase();
  if (/take[- ]?home|takehome/.test(lower)) return "takehome";
  if (/code\s*review|codereview/.test(lower)) return "codereview";
  if (/pm\s*review|pmreview/.test(lower)) return "pmreview";
  if (/intro/.test(lower)) return "intro";
  if (/promote|next\s+stage|advance|move\s+to/.test(lower)) {
    return getNextStage(currentStage) ?? currentStage;
  }
  return null;
}

export function parseJillCommand(text: string, currentStage: PipelineStage = "intro"): JillCommandAction {
  const lower = text.trim().toLowerCase();
  if (!lower) return { type: "ambiguous" };

  if (
    /hand\s*off(?:\s+to\s+hm)?|take\s+it\s+from\s+here|thanks\s+jill.*taking|taking\s+(this\s+)?over|remove\s+jill(?:\s+from)?|step\s+out/.test(
      lower
    )
  ) {
    return { type: "handoff" };
  }

  const stage = inferPromoteStage(lower, currentStage);
  if (stage && STAGE_ORDER.includes(stage)) {
    return { type: "promote", stage };
  }

  return { type: "ambiguous" };
}

export const JILL_COMMAND_HINTS =
  'Try: "promote to take-home", "handoff to HM", "move to code review".';
