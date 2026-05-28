import type { Thread } from "@/lib/types";

export async function syncInboxThreads(): Promise<{ threads: Thread[]; threadCount: number; synced: number }> {
  const res = await fetch("/api/inbox/sync", { method: "POST" });
  const data = (await res.json()) as {
    threads?: Thread[];
    threadCount?: number;
    synced?: number;
    error?: string;
  };
  if (!res.ok) throw new Error(data.error ?? "Failed to sync inbox");
  return {
    threads: data.threads ?? [],
    threadCount: data.threadCount ?? 0,
    synced: data.synced ?? 0,
  };
}

export async function fetchInboxThreads(): Promise<Thread[]> {
  const res = await fetch("/api/inbox/threads");
  const data = (await res.json()) as { threads?: Thread[]; error?: string };
  if (!res.ok) throw new Error(data.error ?? "Failed to load threads");
  return data.threads ?? [];
}
