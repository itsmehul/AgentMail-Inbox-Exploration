import type { Folder } from "@/lib/types";
import { isBlockedThread } from "@/lib/inbox/blocked-threads";
import type { Thread } from "@/lib/types";

export const FOLDER_DEFS: Omit<Folder, "count">[] = [
  { key: "all", label: "All threads", section: "main" },
  { key: "approval", label: "Awaiting your approval", badge: true, section: "main" },
  { key: "blocked", label: "Blocked", badge: true, badgeColor: "var(--rose)", section: "main" },
  { key: "awaiting_hm", label: "Awaiting HM", section: "main" },
  { key: "awaiting_candidate", label: "Awaiting candidate", badge: true, section: "main" },
  { key: "handed_off", label: "Handed off to HM", section: "main" },
  { key: "archived", label: "Archived", section: "main" },
  { key: "stage_intro", label: "Intro", section: "stage", stage: "intro" },
  { key: "stage_takehome", label: "Take-home", section: "stage", stage: "takehome" },
  { key: "stage_codereview", label: "Code review", section: "stage", stage: "codereview" },
  { key: "stage_pmreview", label: "PM review", section: "stage", stage: "pmreview" },
];

function threadsForFolderKey(key: string, threads: Thread[]): Thread[] {
  const def = FOLDER_DEFS.find((f) => f.key === key);
  if (!def || key === "all") return threads;
  if (key === "blocked") return threads.filter(isBlockedThread);
  if (def.section === "stage") return threads.filter((t) => t.stages.includes(def.stage!));
  return threads.filter((t) => t.folder === key);
}

export function computeFolders(threads: Thread[]): Folder[] {
  return FOLDER_DEFS.map((def) => ({
    ...def,
    count: threadsForFolderKey(def.key, threads).length,
  }));
}

export const FOLDER_KEYS = new Set(FOLDER_DEFS.map((f) => f.key));
