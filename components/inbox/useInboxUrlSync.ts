"use client";

import {
  defaultInboxUrlState,
  inboxStateFromStore,
  inboxUrlStatesEqual,
  parseInboxSearchParams,
  resolveInboxUrlState,
  serializeInboxUrlState,
  type InboxUrlState,
} from "@/lib/inbox/inbox-search-params";
import { useInboxStore } from "@/stores/inbox-store";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

function applyUrlStateToStore(state: InboxUrlState) {
  useInboxStore.setState({
    activeFolder: state.folder,
    activeThread: state.thread,
    searchQuery: state.searchQuery,
    searchMode: state.searchMode,
    selectedOrgUserIds: state.selectedOrgUserIds,
  });
}

export function useInboxUrlSync() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const skipUrlWrite = useRef(false);
  const hydrated = useRef(false);

  const activeFolder = useInboxStore((s) => s.activeFolder);
  const activeThread = useInboxStore((s) => s.activeThread);
  const searchQuery = useInboxStore((s) => s.searchQuery);
  const searchMode = useInboxStore((s) => s.searchMode);
  const selectedOrgUserIds = useInboxStore((s) => s.selectedOrgUserIds);

  useEffect(() => {
    const parsed = parseInboxSearchParams(searchParams);
    const storeState = inboxStateFromStore(useInboxStore.getState());

    if (parsed) {
      const resolved = resolveInboxUrlState(parsed);
      if (!inboxUrlStatesEqual(resolved, storeState)) {
        skipUrlWrite.current = true;
        applyUrlStateToStore(resolved);
      }
      hydrated.current = true;
      return;
    }

    if (!hydrated.current) {
      const initial = defaultInboxUrlState();
      if (!inboxUrlStatesEqual(initial, storeState)) {
        applyUrlStateToStore(initial);
      }
      skipUrlWrite.current = true;
      router.replace(`${pathname}?${serializeInboxUrlState(initial)}`, { scroll: false });
      hydrated.current = true;
    }
  }, [searchParams, pathname, router]);

  useEffect(() => {
    if (skipUrlWrite.current) {
      skipUrlWrite.current = false;
      return;
    }

    const next = inboxStateFromStore({
      activeFolder,
      activeThread,
      searchQuery,
      searchMode,
      selectedOrgUserIds,
    });
    const nextQuery = serializeInboxUrlState(next);
    const currentQuery = searchParams.toString();

    if (nextQuery !== currentQuery) {
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    }
  }, [
    activeFolder,
    activeThread,
    searchQuery,
    searchMode,
    selectedOrgUserIds,
    pathname,
    router,
    searchParams,
  ]);
}
