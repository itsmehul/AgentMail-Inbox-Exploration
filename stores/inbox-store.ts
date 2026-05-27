"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { applyBlockedResolution, isBlockedThread } from "@/lib/inbox/blocked-threads";
import { getNextStage, STAGE_LABELS, type PipelineStage } from "@/lib/inbox/thread-stages";
import { threadInvolvesAnyOrgUsers } from "@/lib/inbox/thread-org-users";
import { FOLDERS, INBOX_THREADS } from "@/lib/mock/inbox";
import { ORG_USERS } from "@/lib/mock/org-users";
import type { BlockResolutionPayload, PipelineStageId, StageScoreEntry, Thread } from "@/lib/types";

function threadsForFolder(key: string, threads: Thread[]): Thread[] {
  const f = FOLDERS.find((x) => x.key === key);
  if (!f || key === "all") return threads;
  if (key === "blocked") return threads.filter(isBlockedThread);
  if (f.section === "stage") return threads.filter((t) => t.stages.includes(f.stage!));
  return threads.filter((t) => t.folder === key);
}

export type SearchMode = "query" | "agent";

function matchesSearch(thread: Thread, query: string, searchMode: SearchMode): boolean {
  if (searchMode === "agent") return true;
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

export function filterInboxThreads(
  threads: Thread[],
  folder: string,
  searchQuery: string,
  selectedOrgUserIds: string[],
  searchMode: SearchMode = "query"
): Thread[] {
  return threadsForFolder(folder, threads)
    .filter((t) => matchesSearch(t, searchQuery, searchMode))
    .filter((t) => threadInvolvesAnyOrgUsers(t, selectedOrgUserIds, ORG_USERS));
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
  searchMode: SearchMode;
  selectedOrgUserIds: string[];
  setFolder: (key: string) => void;
  setThread: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setSearchMode: (mode: SearchMode) => void;
  toggleOrgUser: (userId: string) => void;
  clearOrgUserFilter: () => void;
  addUserTag: (threadId: string, tag: string) => void;
  removeUserTag: (threadId: string, idx: number) => void;
  addAddr: (threadId: string, field: "to" | "cc" | "bcc", addr: string) => void;
  removeAddr: (threadId: string, field: "to" | "cc" | "bcc", idx: number) => void;
  approveDraft: (threadId: string) => void;
  addInternalComment: (threadId: string, stage: PipelineStageId, body: string) => void;
  updateStageScore: (threadId: string, stage: PipelineStageId, entry: StageScoreEntry) => void;
  resolveBlockedThread: (threadId: string, payload: BlockResolutionPayload) => void;
  promoteThreadStage: (threadId: string, fromStage: PipelineStageId) => void;
}

export const useInboxStore = create<InboxState>((set, get) => ({
  threads: INBOX_THREADS,
  activeFolder: "approval",
  activeThread: "thr_single_01",
  searchQuery: "",
  searchMode: "query",
  selectedOrgUserIds: [],
  setFolder: (key) => {
    const { threads, searchQuery, searchMode, selectedOrgUserIds, activeThread } = get();
    const filtered = filterInboxThreads(threads, key, searchQuery, selectedOrgUserIds, searchMode);
    set({
      activeFolder: key,
      activeThread: pickActiveThread(activeThread, filtered),
    });
  },
  setThread: (id) => set({ activeThread: id }),
  setSearchQuery: (query) => {
    const { threads, activeFolder, searchMode, selectedOrgUserIds, activeThread } = get();
    const filtered = filterInboxThreads(threads, activeFolder, query, selectedOrgUserIds, searchMode);
    set({
      searchQuery: query,
      activeThread: pickActiveThread(activeThread, filtered),
    });
  },
  setSearchMode: (mode) => {
    const { threads, activeFolder, searchQuery, selectedOrgUserIds, activeThread } = get();
    const filtered = filterInboxThreads(threads, activeFolder, searchQuery, selectedOrgUserIds, mode);
    set({
      searchMode: mode,
      activeThread: pickActiveThread(activeThread, filtered),
    });
  },
  toggleOrgUser: (userId) => {
    const { threads, activeFolder, searchQuery, searchMode, selectedOrgUserIds, activeThread } = get();
    const next = selectedOrgUserIds.includes(userId)
      ? selectedOrgUserIds.filter((id) => id !== userId)
      : [...selectedOrgUserIds, userId];
    const filtered = filterInboxThreads(threads, activeFolder, searchQuery, next, searchMode);
    set({
      selectedOrgUserIds: next,
      activeThread: pickActiveThread(activeThread, filtered),
    });
  },
  clearOrgUserFilter: () => {
    const { threads, activeFolder, searchQuery, searchMode, activeThread } = get();
    const filtered = filterInboxThreads(threads, activeFolder, searchQuery, [], searchMode);
    set({
      selectedOrgUserIds: [],
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
  resolveBlockedThread: (threadId, payload) =>
    set((state) => {
      const { activeFolder, searchQuery, searchMode, selectedOrgUserIds, activeThread } = state;
      const threads = state.threads.map((t) =>
        t.id === threadId && t.blockReason ? applyBlockedResolution(t, payload) : t
      );
      const filtered = filterInboxThreads(threads, activeFolder, searchQuery, selectedOrgUserIds, searchMode);
      return {
        threads,
        activeThread: pickActiveThread(activeThread, filtered),
      };
    }),
  promoteThreadStage: (threadId, fromStage) =>
    set((state) => ({
      threads: state.threads.map((t) => {
        if (t.id !== threadId) return t;
        const next = getNextStage(fromStage as PipelineStage);
        if (!next || t.stages.includes(next)) return t;
        return {
          ...t,
          stages: [...t.stages, next],
          meta: {
            ...t.meta,
            status: `Promoted to ${STAGE_LABELS[next]}`,
          },
        };
      }),
    })),
}));

export function useFilteredThreads(): Thread[] {
  const activeFolder = useInboxStore((s) => s.activeFolder);
  const threads = useInboxStore((s) => s.threads);
  const searchQuery = useInboxStore((s) => s.searchQuery);
  const searchMode = useInboxStore((s) => s.searchMode);
  const selectedOrgUserIds = useInboxStore((s) => s.selectedOrgUserIds);
  return useMemo(
    () => filterInboxThreads(threads, activeFolder, searchQuery, selectedOrgUserIds, searchMode),
    [activeFolder, threads, searchQuery, searchMode, selectedOrgUserIds]
  );
}
