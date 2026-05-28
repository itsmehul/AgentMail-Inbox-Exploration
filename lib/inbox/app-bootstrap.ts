import { syncInboxThreads } from "@/lib/inbox/fetch-inbox";

let bootstrapPromise: Promise<boolean> | null = null;

export function runInboxBootstrap(): Promise<boolean> {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      try {
        await syncInboxThreads();
        return true;
      } catch {
        return false;
      }
    })();
  }
  return bootstrapPromise;
}
