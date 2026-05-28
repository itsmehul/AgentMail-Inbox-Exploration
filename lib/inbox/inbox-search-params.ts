import { isBlockedThread } from "@/lib/inbox/blocked-threads";
import { FOLDER_KEYS } from "@/lib/inbox/folders";
import { findThreadByAnyId, resolveMergedThreadId } from "@/lib/inbox/resolve-merged-thread";
import type { Thread } from "@/lib/types";
import type { SearchMode } from "@/stores/inbox-store";
import { filterInboxThreads } from "@/stores/inbox-store";

export const INBOX_PARAM = {
  thread: "thread",
  folder: "folder",
  q: "q",
  mode: "mode",
  users: "users",
} as const;

export interface InboxUrlState {
  folder: string;
  thread: string;
  searchQuery: string;
  searchMode: SearchMode;
  selectedOrgUserIds: string[];
}

const DEFAULT_FOLDER = "all";
const VALID_MODES: SearchMode[] = ["query"];

function pickActiveThread(current: string, filtered: Thread[], allThreads: Thread[]): string {
  const canonical = resolveMergedThreadId(current, allThreads);
  if (canonical && filtered.some((t) => t.id === canonical)) return canonical;
  return filtered[0]?.id ?? canonical ?? current;
}

export function defaultFolderForThread(thread: Thread): string {
  if (isBlockedThread(thread)) return "blocked";
  if (FOLDER_KEYS.has(thread.folder)) return thread.folder;
  return "all";
}

export function parseInboxSearchParams(params: URLSearchParams): InboxUrlState | null {
  const thread = params.get(INBOX_PARAM.thread);
  if (!thread) return null;

  const folderRaw = params.get(INBOX_PARAM.folder);
  const folder = folderRaw && FOLDER_KEYS.has(folderRaw) ? folderRaw : DEFAULT_FOLDER;

  const modeRaw = params.get(INBOX_PARAM.mode);
  const searchMode: SearchMode = VALID_MODES.includes(modeRaw as SearchMode)
    ? (modeRaw as SearchMode)
    : "query";

  const usersRaw = params.get(INBOX_PARAM.users);
  const selectedOrgUserIds = usersRaw
    ? usersRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return {
    folder,
    thread,
    searchQuery: params.get(INBOX_PARAM.q) ?? "",
    searchMode,
    selectedOrgUserIds,
  };
}

export function resolveInboxUrlState(partial: InboxUrlState, threads: Thread[]): InboxUrlState {
  const canonicalThread = resolveMergedThreadId(partial.thread, threads);
  const threadRow = findThreadByAnyId(threads, partial.thread);
  let folder = partial.folder;

  if (threadRow) {
    const filteredWithFolder = filterInboxThreads(
      threads,
      folder,
      partial.searchQuery,
      partial.selectedOrgUserIds,
      partial.searchMode
    );
    if (!filteredWithFolder.some((t) => t.id === canonicalThread)) {
      folder = defaultFolderForThread(threadRow);
    }
  }

  const filtered = filterInboxThreads(
    threads,
    folder,
    partial.searchQuery,
    partial.selectedOrgUserIds,
    partial.searchMode
  );

  return {
    ...partial,
    folder,
    thread: pickActiveThread(canonicalThread, filtered, threads),
  };
}

export function inboxStateToUrlParams(state: InboxUrlState): URLSearchParams {
  const params = new URLSearchParams();
  if (state.thread) params.set(INBOX_PARAM.thread, state.thread);
  if (state.folder !== DEFAULT_FOLDER) params.set(INBOX_PARAM.folder, state.folder);
  const q = state.searchQuery.trim();
  if (q) params.set(INBOX_PARAM.q, q);
  if (state.searchMode !== "query") params.set(INBOX_PARAM.mode, state.searchMode);
  if (state.selectedOrgUserIds.length) {
    params.set(INBOX_PARAM.users, state.selectedOrgUserIds.join(","));
  }
  return params;
}

export function inboxStateFromStore(
  state: {
    activeFolder: string;
    activeThread: string;
    searchQuery: string;
    searchMode: SearchMode;
    selectedOrgUserIds: string[];
  },
  threads: Thread[]
): InboxUrlState {
  return resolveInboxUrlState(
    {
      folder: state.activeFolder,
      thread: state.activeThread,
      searchQuery: state.searchQuery,
      searchMode: state.searchMode,
      selectedOrgUserIds: state.selectedOrgUserIds,
    },
    threads
  );
}

export function serializeInboxUrlState(state: InboxUrlState): string {
  return inboxStateToUrlParams(state).toString();
}

export function inboxUrlStatesEqual(a: InboxUrlState, b: InboxUrlState): boolean {
  return serializeInboxUrlState(a) === serializeInboxUrlState(b);
}

export function defaultInboxUrlState(threads: Thread[]): InboxUrlState {
  const first = threads[0];
  return resolveInboxUrlState(
    {
      folder: DEFAULT_FOLDER,
      thread: first?.id ?? "",
      searchQuery: "",
      searchMode: "query",
      selectedOrgUserIds: [],
    },
    threads
  );
}
