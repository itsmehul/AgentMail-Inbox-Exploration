"use client";

import { create } from "zustand";
import { AGENTS } from "@/lib/mock/workflow";
import type { InspectorTab } from "@/lib/types";
import { useAgentStore } from "./agent-store";

export type Selection =
  | { kind: "node"; key: string }
  | { kind: "edge"; key: string; fromNode: string; toNode: string }
  | null;

interface WorkflowState {
  selection: Selection;
  inspectorTab: InspectorTab;
  selectNode: (key: string) => void;
  selectEdge: (key: string, fromNode: string, toNode: string) => void;
  setInspectorTab: (tab: InspectorTab) => void;
  resetForAgent: () => void;
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
  selection: { kind: "node", key: "jill_orchestrator" },
  inspectorTab: "general",
  selectNode: (key) => set({ selection: { kind: "node", key }, inspectorTab: "general" }),
  selectEdge: (key, fromNode, toNode) =>
    set({ selection: { kind: "edge", key, fromNode, toNode }, inspectorTab: "general" }),
  setInspectorTab: (tab) => set({ inspectorTab: tab }),
  resetForAgent: () => {
    const agent = useAgentStore.getState().currentAgent;
    const defaultNode = AGENTS[agent].defaultNode;
    set({ selection: { kind: "node", key: defaultNode }, inspectorTab: "general" });
  },
}));
