"use client";

import { create } from "zustand";
import { SCORING_RUBRICS } from "@/lib/mock/scoring-rubrics";
import type { PipelineStageId, StageScoringRubric } from "@/lib/types";

interface RubricState {
  rubrics: Record<PipelineStageId, StageScoringRubric>;
  applyScoreFeedback: (
    threadId: string,
    stage: PipelineStageId,
    previousScore: number,
    newScore: number,
    reasoning: string
  ) => void;
}

export const useRubricStore = create<RubricState>((set) => ({
  rubrics: SCORING_RUBRICS,
  applyScoreFeedback: (threadId, stage, previousScore, newScore, reasoning) =>
    set((state) => {
      const rubric = state.rubrics[stage];
      return {
        rubrics: {
          ...state.rubrics,
          [stage]: {
            ...rubric,
            refinements: [
              ...rubric.refinements,
              {
                id: `ref_${Date.now()}`,
                threadId,
                stage,
                previousScore,
                newScore,
                reasoning,
                addedAt: "just now",
              },
            ],
          },
        },
      };
    }),
}));

export function useStageRubric(stage: PipelineStageId): StageScoringRubric {
  return useRubricStore((s) => s.rubrics[stage]);
}
