"use client";

import { create } from "zustand";
import type { ApprovalSubagent, InboxOption } from "@/lib/types";

const DEFAULT_APPROVALS: ApprovalSubagent[] = [
  { id: "Intro-Setter", name: "Intro-Setter", description: "opens new threads with candidates", requiresApproval: true },
  { id: "TakeHome-Sender", name: "TakeHome-Sender", description: "attaches take-home material", requiresApproval: true },
  { id: "CodeReview-Scheduler", name: "CodeReview-Scheduler", description: "loops in colleagues for code review", requiresApproval: true },
  { id: "PMReview-Scheduler", name: "PMReview-Scheduler", description: "loops in PMs for product round", requiresApproval: true },
  { id: "Status-Reporter", name: "Status-Reporter", description: "read-only summaries — only ever replies to you", requiresApproval: false },
  { id: "Handoff", name: "Handoff", description: "brief recap, then exits the thread", requiresApproval: true },
];

interface SettingsState {
  selectedInbox: string;
  inboxes: InboxOption[];
  approvals: ApprovalSubagent[];
  saveVisible: boolean;
  reconcilerInterval: string;
  cacheTtl: string;
  guardianModel: string;
  setSelectedInbox: (addr: string) => void;
  addInbox: (addr: string, display: string) => void;
  toggleApproval: (id: string) => void;
  showSaved: () => void;
  cycleReconciler: () => void;
  cycleCacheTtl: () => void;
  cycleGuardianModel: () => void;
  getStagedStatusText: () => { text: string; color: string };
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

export const useSettingsStore = create<SettingsState>((set, get) => ({
  selectedInbox: "jill-hm@diy.ai",
  inboxes: [
    { addr: "jill-hm@diy.ai", label: "jill-hm@diy.ai", meta: "Active · 38 threads · created Jan 14", active: true },
    { addr: "jill-test@diy.ai", label: "jill-test@diy.ai", meta: "Sandbox · 4 threads · created Feb 2" },
  ],
  approvals: DEFAULT_APPROVALS,
  saveVisible: false,
  reconcilerInterval: "Every 60 seconds",
  cacheTtl: "24 hours (active) · 7 days (closed)",
  guardianModel: "Claude Haiku 4.5",
  setSelectedInbox: (addr) => {
    set({ selectedInbox: addr });
    get().showSaved();
  },
  addInbox: (addr, display) => {
    set((state) => ({
      inboxes: [
        ...state.inboxes,
        { addr, label: addr, meta: `Active · 0 threads · just now`, active: true },
      ],
      selectedInbox: addr,
    }));
    get().showSaved();
    void display;
  },
  toggleApproval: (id) => {
    set((state) => ({
      approvals: state.approvals.map((a) =>
        a.id === id ? { ...a, requiresApproval: !a.requiresApproval } : a
      ),
    }));
    get().showSaved();
  },
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
  getStagedStatusText: () => {
    const { approvals } = get();
    const onCount = approvals.filter((a) => a.requiresApproval).length;
    const total = approvals.length;
    if (onCount === 0) {
      return { text: "● All subagents send directly — no approval needed", color: "#16a34a" };
    }
    return {
      text: `● ${onCount} of ${total} subagents need your approval before sending`,
      color: "#a16207",
    };
  },
}));
