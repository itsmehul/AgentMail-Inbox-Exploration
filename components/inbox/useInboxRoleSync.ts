"use client";

import { filterInboxThreads, pickActiveThread, useInboxStore } from "@/stores/inbox-store";
import { useRoleStore } from "@/stores/role-store";
import { useEffect } from "react";

export function useInboxRoleSync() {
  const activeRole = useRoleStore((s) => s.activeRole);
  const threads = useInboxStore((s) => s.threads);
  const activeFolder = useInboxStore((s) => s.activeFolder);
  const searchQuery = useInboxStore((s) => s.searchQuery);
  const searchMode = useInboxStore((s) => s.searchMode);
  const selectedOrgUserIds = useInboxStore((s) => s.selectedOrgUserIds);
  const activeThread = useInboxStore((s) => s.activeThread);
  const setThread = useInboxStore((s) => s.setThread);

  useEffect(() => {
    const filtered = filterInboxThreads(
      threads,
      activeFolder,
      searchQuery,
      selectedOrgUserIds,
      searchMode,
      activeRole
    );
    const next = pickActiveThread(activeThread, filtered);
    if (next !== activeThread) setThread(next);
  }, [
    activeRole,
    threads,
    activeFolder,
    searchQuery,
    searchMode,
    selectedOrgUserIds,
    activeThread,
    setThread,
  ]);
}
