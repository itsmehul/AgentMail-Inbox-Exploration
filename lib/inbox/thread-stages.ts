import type { StageScores, ThreadMessage } from "@/lib/types";

export type PipelineStage = "intro" | "takehome" | "codereview" | "pmreview";

export const STAGE_ORDER: PipelineStage[] = ["intro", "takehome", "codereview", "pmreview"];

export const STAGE_LABELS: Record<PipelineStage, string> = {
  intro: "Intro",
  takehome: "Take-home",
  codereview: "Code review",
  pmreview: "PM review",
};

export interface IndexedMessage {
  message: ThreadMessage;
  index: number;
}

export interface StageGroup {
  stage: PipelineStage;
  items: IndexedMessage[];
}

export function formatStageScore(score: number): string {
  return Number.isInteger(score) ? String(score) : score.toFixed(1);
}

export function getStageScoreValue(entry: StageScores[keyof StageScores] | undefined): number | null {
  if (entry == null) return null;
  return entry.score;
}

export function averageStageScore(scores: StageScores | undefined): number | null {
  if (!scores) return null;
  const values = Object.values(scores)
    .map((entry) => entry?.score)
    .filter((value): value is number => typeof value === "number");
  if (!values.length) return null;
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.round(avg * 10) / 10;
}

export function groupMessagesByStage(messages: ThreadMessage[]): StageGroup[] {
  const buckets = new Map<PipelineStage, IndexedMessage[]>();

  messages.forEach((message, index) => {
    const stage = message.stage ?? "intro";
    const items = buckets.get(stage) ?? [];
    items.push({ message, index });
    buckets.set(stage, items);
  });

  return STAGE_ORDER.filter((stage) => buckets.has(stage)).map((stage) => ({
    stage,
    items: buckets.get(stage)!,
  }));
}
