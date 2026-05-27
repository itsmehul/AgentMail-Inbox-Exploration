"use client";

import { create } from "zustand";
import type { ApprovalSnapshot } from "@/lib/inbox/approval-changes";
import type { PipelineStageId } from "@/lib/types";

export interface ApprovalMemoryEntry {
  id: string;
  threadId: string;
  subagent: string;
  stage?: PipelineStageId;
  committedAt: string;
  snapshot: ApprovalSnapshot;
}

interface MemoryState {
  entries: ApprovalMemoryEntry[];
  commitApprovalEdit: (entry: {
    threadId: string;
    subagent: string;
    stage?: PipelineStageId;
    snapshot: ApprovalSnapshot;
  }) => void;
}

export const useMemoryStore = create<MemoryState>((set) => ({
  entries: [],
  commitApprovalEdit: (entry) =>
    set((state) => ({
      entries: [
        ...state.entries,
        {
          id: `mem_${Date.now()}`,
          committedAt: new Date().toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          }),
          ...entry,
        },
      ],
    })),
}));
