"use client";

import { create } from "zustand";
import { AGENTS } from "@/lib/mock/workflow";
import type { AgentId } from "@/lib/types";

interface AgentState {
  currentAgent: AgentId;
  agentMenuOpen: boolean;
  setAgentMenuOpen: (open: boolean) => void;
  switchAgent: (id: AgentId) => void;
  getAgent: () => (typeof AGENTS)[AgentId];
}

export const useAgentStore = create<AgentState>((set, get) => ({
  currentAgent: "jill",
  agentMenuOpen: false,
  setAgentMenuOpen: (open) => set({ agentMenuOpen: open }),
  switchAgent: (id) => {
    if (id === "jack") return;
    set({ currentAgent: id, agentMenuOpen: false });
  },
  getAgent: () => AGENTS[get().currentAgent],
}));
