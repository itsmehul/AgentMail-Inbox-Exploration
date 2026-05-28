import { pipelineLogicalId } from "@/lib/inbox/pipeline-link";
import type { Thread } from "@/lib/types";

function normalizeEmail(email: string | undefined): string | undefined {
  return email?.toLowerCase();
}

export function findMergedThread(threads: Thread[], threadId: string): Thread | undefined {
  if (!threadId) return undefined;

  const direct = threads.find((t) => t.id === threadId);
  if (direct?.threadKind === "pipeline") return direct;

  const pipedId = threadId.startsWith("pipe_") ? threadId : pipelineLogicalId(threadId);
  const piped = threads.find((t) => t.id === pipedId && t.threadKind === "pipeline");
  if (piped) return piped;

  for (const t of threads) {
    if (t.threadKind !== "pipeline") continue;
    if (t.inboxLinks?.some((l) => l.threadId === threadId)) return t;
  }

  if (direct?.threadKind === "inbound") {
    if (direct.logicalThreadId) {
      const linked = threads.find((t) => t.id === direct.logicalThreadId);
      if (linked) return linked;
    }

    const email = normalizeEmail(direct.candidateEmail ?? direct.prospect?.email);
    if (email) {
      const pipeline = threads.find(
        (t) => t.threadKind === "pipeline" && normalizeEmail(t.candidateEmail) === email
      );
      if (pipeline) return pipeline;
    }
  }

  return undefined;
}

export function resolveMergedThreadId(threadId: string, threads: Thread[]): string {
  return findMergedThread(threads, threadId)?.id ?? threadId;
}

export function findThreadByAnyId(threads: Thread[], threadId: string): Thread | undefined {
  return findMergedThread(threads, threadId) ?? threads.find((t) => t.id === threadId);
}

/** Drop inbound threads that already have a merged pipeline thread for the same candidate. */
export function preferMergedThreadList(threads: Thread[]): Thread[] {
  const pipelineEmails = new Set(
    threads
      .filter((t) => t.threadKind === "pipeline" && t.candidateEmail)
      .map((t) => normalizeEmail(t.candidateEmail)!)
  );

  return threads.filter((t) => {
    if (t.threadKind !== "inbound") return true;

    if (t.logicalThreadId && threads.some((p) => p.id === t.logicalThreadId)) return false;

    const email = normalizeEmail(t.candidateEmail ?? t.prospect?.email);
    if (email && pipelineEmails.has(email)) return false;

    return true;
  });
}
