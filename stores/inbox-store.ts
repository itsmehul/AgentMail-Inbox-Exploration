"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { threadInvolvesAnyOrgUsers } from "@/lib/inbox/thread-org-users";
import { FOLDERS, INBOX_THREADS } from "@/lib/mock/inbox";
import { ORG_USERS } from "@/lib/mock/org-users";
import type { PipelineStageId, StageScoreEntry, Thread } from "@/lib/types";

function threadsForFolder(key: string, threads: Thread[]): Thread[] {
  const f = FOLDERS.find((x) => x.key === key);
  if (!f || key === "all") return threads;
  if (f.section === "stage") return threads.filter((t) => t.stages.includes(f.stage!));
  return threads.filter((t) => t.folder === key);
}

export type ThreadListTab = "all" | "follow_up" | "blocked";

function matchesSearch(thread: Thread, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    thread.from,
    thread.subject,
    thread.preview,
    thread.meta?.status,
    thread.meta?.lastAction,
    ...(thread.tags ?? []),
    ...(thread.userTags ?? []),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function matchesListTab(thread: Thread, tab: ThreadListTab): boolean {
  switch (tab) {
    case "all":
      return true;
    case "follow_up":
      return (
        thread.folder === "awaiting_candidate" ||
        (thread.userTags ?? []).some((t) => t.toLowerCase().includes("follow"))
      );
    case "blocked":
      return (
        thread.folder === "approval" ||
        thread.folder === "awaiting_hm" ||
        thread.meta.status.toLowerCase().includes("awaiting hm") ||
        thread.meta.status.toLowerCase().includes("awaiting approval")
      );
    default:
      return true;
  }
}

export function filterInboxThreads(
  threads: Thread[],
  folder: string,
  searchQuery: string,
  selectedOrgUserIds: string[],
  listTab: ThreadListTab = "all"
): Thread[] {
  return threadsForFolder(folder, threads)
    .filter((t) => matchesSearch(t, searchQuery))
    .filter((t) => threadInvolvesAnyOrgUsers(t, selectedOrgUserIds, ORG_USERS))
    .filter((t) => matchesListTab(t, listTab));
}

function pickActiveThread(current: string, filtered: Thread[]): string {
  if (filtered.some((t) => t.id === current)) return current;
  return filtered[0]?.id ?? current;
}

interface InboxState {
  threads: Thread[];
  activeFolder: string;
  activeThread: string;
  searchQuery: string;
  selectedOrgUserIds: string[];
  threadListTab: ThreadListTab;
  setFolder: (key: string) => void;
  setThread: (id: string) => void;
  setSearchQuery: (query: string) => void;
  toggleOrgUser: (userId: string) => void;
  clearOrgUserFilter: () => void;
  setThreadListTab: (tab: ThreadListTab) => void;
  addUserTag: (threadId: string, tag: string) => void;
  removeUserTag: (threadId: string, idx: number) => void;
  addAddr: (threadId: string, field: "to" | "cc" | "bcc", addr: string) => void;
  removeAddr: (threadId: string, field: "to" | "cc" | "bcc", idx: number) => void;
  approveDraft: (threadId: string) => void;
  addInternalComment: (threadId: string, stage: PipelineStageId, body: string) => void;
  updateStageScore: (threadId: string, stage: PipelineStageId, entry: StageScoreEntry) => void;
}

export const useInboxStore = create<InboxState>((set, get) => ({
  threads: INBOX_THREADS,
  activeFolder: "approval",
  activeThread: "thr_single_01",
  searchQuery: "",
  selectedOrgUserIds: [],
  threadListTab: "all",
  setFolder: (key) => {
    const { threads, searchQuery, selectedOrgUserIds, threadListTab, activeThread } = get();
    const filtered = filterInboxThreads(threads, key, searchQuery, selectedOrgUserIds, threadListTab);
    set({
      activeFolder: key,
      activeThread: pickActiveThread(activeThread, filtered),
    });
  },
  setThread: (id) => set({ activeThread: id }),
  setSearchQuery: (query) => {
    const { threads, activeFolder, selectedOrgUserIds, threadListTab, activeThread } = get();
    const filtered = filterInboxThreads(threads, activeFolder, query, selectedOrgUserIds, threadListTab);
    set({
      searchQuery: query,
      activeThread: pickActiveThread(activeThread, filtered),
    });
  },
  toggleOrgUser: (userId) => {
    const { threads, activeFolder, searchQuery, selectedOrgUserIds, threadListTab, activeThread } = get();
    const next = selectedOrgUserIds.includes(userId)
      ? selectedOrgUserIds.filter((id) => id !== userId)
      : [...selectedOrgUserIds, userId];
    const filtered = filterInboxThreads(threads, activeFolder, searchQuery, next, threadListTab);
    set({
      selectedOrgUserIds: next,
      activeThread: pickActiveThread(activeThread, filtered),
    });
  },
  clearOrgUserFilter: () => {
    const { threads, activeFolder, searchQuery, threadListTab, activeThread } = get();
    const filtered = filterInboxThreads(threads, activeFolder, searchQuery, [], threadListTab);
    set({
      selectedOrgUserIds: [],
      activeThread: pickActiveThread(activeThread, filtered),
    });
  },
  setThreadListTab: (tab) => {
    const { threads, activeFolder, searchQuery, selectedOrgUserIds, activeThread } = get();
    const filtered = filterInboxThreads(threads, activeFolder, searchQuery, selectedOrgUserIds, tab);
    set({
      threadListTab: tab,
      activeThread: pickActiveThread(activeThread, filtered),
    });
  },
  addUserTag: (threadId, tag) =>
    set((state) => ({
      threads: state.threads.map((t) =>
        t.id === threadId ? { ...t, userTags: [...(t.userTags ?? []), tag] } : t
      ),
    })),
  removeUserTag: (threadId, idx) =>
    set((state) => ({
      threads: state.threads.map((t) =>
        t.id === threadId
          ? { ...t, userTags: (t.userTags ?? []).filter((_, i) => i !== idx) }
          : t
      ),
    })),
  addAddr: (threadId, field, addr) =>
    set((state) => ({
      threads: state.threads.map((t) => {
        if (t.id !== threadId) return t;
        const messages = [...t.messages];
        const m = messages[messages.length - 1];
        if (!m?.approval) return t;
        const list = Array.isArray(m[field]) ? [...(m[field] as string[])] : m[field] ? [m[field] as string] : [];
        list.push(addr);
        messages[messages.length - 1] = { ...m, [field]: list };
        return { ...t, messages };
      }),
    })),
  removeAddr: (threadId, field, idx) =>
    set((state) => ({
      threads: state.threads.map((t) => {
        if (t.id !== threadId) return t;
        const messages = [...t.messages];
        const m = messages[messages.length - 1];
        if (!m?.approval) return t;
        const list = Array.isArray(m[field]) ? [...(m[field] as string[])] : [];
        list.splice(idx, 1);
        messages[messages.length - 1] = { ...m, [field]: list };
        return { ...t, messages };
      }),
    })),
  approveDraft: (threadId) => {
    void threadId;
  },
  addInternalComment: (threadId, stage, body) =>
    set((state) => ({
      threads: state.threads.map((t) =>
        t.id === threadId
          ? {
              ...t,
              internalComments: [
                ...(t.internalComments ?? []),
                {
                  id: `ic_${Date.now()}`,
                  author: "you",
                  initials: "R",
                  time: "just now",
                  stage,
                  body,
                },
              ],
            }
          : t
      ),
    })),
  updateStageScore: (threadId, stage, entry) =>
    set((state) => ({
      threads: state.threads.map((t) =>
        t.id === threadId
          ? {
              ...t,
              stageScores: {
                ...t.stageScores,
                [stage]: entry,
              },
            }
          : t
      ),
    })),
}));

export function useFilteredThreads(): Thread[] {
  const activeFolder = useInboxStore((s) => s.activeFolder);
  const threads = useInboxStore((s) => s.threads);
  const searchQuery = useInboxStore((s) => s.searchQuery);
  const selectedOrgUserIds = useInboxStore((s) => s.selectedOrgUserIds);
  const threadListTab = useInboxStore((s) => s.threadListTab);
  return useMemo(
    () => filterInboxThreads(threads, activeFolder, searchQuery, selectedOrgUserIds, threadListTab),
    [activeFolder, threads, searchQuery, selectedOrgUserIds, threadListTab]
  );
}
