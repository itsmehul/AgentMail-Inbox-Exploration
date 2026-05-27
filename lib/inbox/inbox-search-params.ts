import { isBlockedThread } from "@/lib/inbox/blocked-threads";
import { FOLDERS, INBOX_THREADS } from "@/lib/mock/inbox";
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

const DEFAULT_FOLDER = "approval";
const DEFAULT_THREAD = "thr_single_01";
const VALID_MODES: SearchMode[] = ["query", "agent"];
const FOLDER_KEYS = new Set(FOLDERS.map((f) => f.key));
const THREAD_IDS = new Set(INBOX_THREADS.map((t) => t.id));

function pickActiveThread(current: string, filtered: Thread[]): string {
  if (filtered.some((t) => t.id === current)) return current;
  return filtered[0]?.id ?? current;
}

export function defaultFolderForThread(thread: Thread): string {
  if (isBlockedThread(thread)) return "blocked";
  if (FOLDER_KEYS.has(thread.folder)) return thread.folder;
  return "all";
}

export function parseInboxSearchParams(params: URLSearchParams): InboxUrlState | null {
  const thread = params.get(INBOX_PARAM.thread);
  if (!thread || !THREAD_IDS.has(thread)) return null;

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

export function resolveInboxUrlState(partial: InboxUrlState): InboxUrlState {
  const threadRow = INBOX_THREADS.find((t) => t.id === partial.thread);
  let folder = partial.folder;

  if (threadRow) {
    const filteredWithFolder = filterInboxThreads(
      INBOX_THREADS,
      folder,
      partial.searchQuery,
      partial.selectedOrgUserIds,
      partial.searchMode
    );
    if (!filteredWithFolder.some((t) => t.id === partial.thread)) {
      folder = defaultFolderForThread(threadRow);
    }
  }

  const filtered = filterInboxThreads(
    INBOX_THREADS,
    folder,
    partial.searchQuery,
    partial.selectedOrgUserIds,
    partial.searchMode
  );

  return {
    ...partial,
    folder,
    thread: pickActiveThread(partial.thread, filtered),
  };
}

export function inboxStateToUrlParams(state: InboxUrlState): URLSearchParams {
  const params = new URLSearchParams();
  params.set(INBOX_PARAM.thread, state.thread);
  if (state.folder !== DEFAULT_FOLDER) params.set(INBOX_PARAM.folder, state.folder);
  const q = state.searchQuery.trim();
  if (q) params.set(INBOX_PARAM.q, q);
  if (state.searchMode !== "query") params.set(INBOX_PARAM.mode, state.searchMode);
  if (state.selectedOrgUserIds.length) {
    params.set(INBOX_PARAM.users, state.selectedOrgUserIds.join(","));
  }
  return params;
}

export function inboxStateFromStore(state: {
  activeFolder: string;
  activeThread: string;
  searchQuery: string;
  searchMode: SearchMode;
  selectedOrgUserIds: string[];
}): InboxUrlState {
  return resolveInboxUrlState({
    folder: state.activeFolder,
    thread: state.activeThread,
    searchQuery: state.searchQuery,
    searchMode: state.searchMode,
    selectedOrgUserIds: state.selectedOrgUserIds,
  });
}

export function serializeInboxUrlState(state: InboxUrlState): string {
  return inboxStateToUrlParams(state).toString();
}

export function inboxUrlStatesEqual(a: InboxUrlState, b: InboxUrlState): boolean {
  return serializeInboxUrlState(a) === serializeInboxUrlState(b);
}

export function defaultInboxUrlState(): InboxUrlState {
  return resolveInboxUrlState({
    folder: DEFAULT_FOLDER,
    thread: DEFAULT_THREAD,
    searchQuery: "",
    searchMode: "query",
    selectedOrgUserIds: [],
  });
}
