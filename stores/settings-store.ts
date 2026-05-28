"use client";

import { create } from "zustand";
import type { InboxOption } from "@/lib/types";

export type AgentMailConnection = "unknown" | "not_configured" | "connected" | "error";

interface SettingsState {
  selectedInbox: string;
  selectedInboxId: string | null;
  inboxes: InboxOption[];
  agentMailConnection: AgentMailConnection;
  agentMailError: string | null;
  agentMailInboxCount: number | null;
  saveVisible: boolean;
  reconcilerInterval: string;
  cacheTtl: string;
  guardianModel: string;
  setAgentMailStatus: (status: AgentMailConnection, error?: string | null, inboxCount?: number | null) => void;
  setInboxes: (inboxes: InboxOption[]) => void;
  setSelectedInbox: (addr: string) => void;
  addInbox: (inbox: InboxOption) => void;
  getSelectedInboxId: () => string | null;
  showSaved: () => void;
  cycleReconciler: () => void;
  cycleCacheTtl: () => void;
  cycleGuardianModel: () => void;
  getAgentMailStatusLabel: () => string;
}

const RECONCILER_OPTIONS = [
  "Every 30 seconds",
  "Every 60 seconds",
  "Every 2 minutes",
  "Every 5 minutes",
  "Every 15 minutes",
];

const CACHE_TTL_OPTIONS = [
  "1 hour (active) · 24 hours (closed)",
  "24 hours (active) · 7 days (closed)",
  "7 days (active) · 30 days (closed)",
  "No expiry",
];

const GUARDIAN_MODELS = ["Claude Haiku 4.5", "Claude Sonnet 4", "Claude Opus 4.7", "GPT-5"];

let saveTimer: ReturnType<typeof setTimeout> | null = null;

const MOCK_INBOXES: InboxOption[] = [
  {
    inboxId: "mock_jill_hm",
    addr: "jill-hm@diy.ai",
    label: "jill-hm@diy.ai",
    meta: "Demo · mock data until AgentMail is connected",
    active: true,
  },
  {
    inboxId: "mock_jill_test",
    addr: "jill-test@diy.ai",
    label: "jill-test@diy.ai",
    meta: "Demo · mock data",
  },
];

export const useSettingsStore = create<SettingsState>((set, get) => ({
  selectedInbox: MOCK_INBOXES[0].addr,
  selectedInboxId: MOCK_INBOXES[0].inboxId,
  inboxes: MOCK_INBOXES,
  agentMailConnection: "unknown",
  agentMailError: null,
  agentMailInboxCount: null,
  saveVisible: false,
  reconcilerInterval: "Every 60 seconds",
  cacheTtl: "24 hours (active) · 7 days (closed)",
  guardianModel: "Claude Haiku 4.5",
  setAgentMailStatus: (agentMailConnection, agentMailError = null, agentMailInboxCount = null) => {
    set({ agentMailConnection, agentMailError, agentMailInboxCount });
  },
  setInboxes: (inboxes) => {
    const current = get().selectedInbox;
    const match = inboxes.find((i) => i.addr === current) ?? inboxes[0];
    set({
      inboxes,
      selectedInbox: match?.addr ?? current,
      selectedInboxId: match?.inboxId ?? null,
    });
  },
  setSelectedInbox: (addr) => {
    const inbox = get().inboxes.find((i) => i.addr === addr);
    set({ selectedInbox: addr, selectedInboxId: inbox?.inboxId ?? null });
    get().showSaved();
  },
  addInbox: (inbox) => {
    set((state) => ({
      inboxes: [...state.inboxes.filter((i) => i.inboxId !== inbox.inboxId), inbox],
      selectedInbox: inbox.addr,
      selectedInboxId: inbox.inboxId,
    }));
    get().showSaved();
  },
  getSelectedInboxId: () => get().selectedInboxId,
  showSaved: () => {
    set({ saveVisible: true });
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => set({ saveVisible: false }), 1600);
  },
  cycleReconciler: () => {
    const cur = get().reconcilerInterval;
    const idx = RECONCILER_OPTIONS.indexOf(cur);
    set({ reconcilerInterval: RECONCILER_OPTIONS[(idx + 1) % RECONCILER_OPTIONS.length] });
    get().showSaved();
  },
  cycleCacheTtl: () => {
    const cur = get().cacheTtl;
    const idx = CACHE_TTL_OPTIONS.indexOf(cur);
    set({ cacheTtl: CACHE_TTL_OPTIONS[(idx + 1) % CACHE_TTL_OPTIONS.length] });
    get().showSaved();
  },
  cycleGuardianModel: () => {
    const cur = get().guardianModel;
    const idx = GUARDIAN_MODELS.indexOf(cur);
    set({ guardianModel: GUARDIAN_MODELS[(idx + 1) % GUARDIAN_MODELS.length] });
    get().showSaved();
  },
  getAgentMailStatusLabel: () => {
    const { agentMailConnection, selectedInbox, agentMailError } = get();
    if (agentMailConnection === "not_configured") {
      return "Not configured · set AGENTMAIL_API_KEY in .env.local";
    }
    if (agentMailConnection === "error") {
      return `Connection error · ${agentMailError ?? "check API key"}`;
    }
    if (agentMailConnection === "connected") {
      return `Connected · ${selectedInbox}`;
    }
    return "Checking connection…";
  },
}));
