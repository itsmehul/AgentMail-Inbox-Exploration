"use client";

import { useEffect, useRef } from "react";
import { fetchInboxThreads, syncInboxThreads } from "@/lib/inbox/fetch-inbox";
import { useInboxStore } from "@/stores/inbox-store";

export function useInboxLiveSync() {
  const setThreads = useInboxStore((s) => s.setThreads);
  const setLoading = useInboxStore((s) => s.setLoading);
  const setError = useInboxStore((s) => s.setError);
  const loadedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function load(initial = false) {
      try {
        if (initial) setLoading(true);
        const result = initial ? await syncInboxThreads() : { threads: await fetchInboxThreads() };
        if (cancelled) return;
        setThreads(result.threads);
        setError(null);
      } catch (error) {
        if (cancelled) return;
        setError(error instanceof Error ? error.message : "Failed to load inbox");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (!loadedRef.current) {
      loadedRef.current = true;
      void load(true);
    }

    const source = new EventSource("/api/inbox/events");
    source.addEventListener("inbox", () => {
      void load(false);
    });
    source.onerror = () => {
      /* browser reconnects automatically */
    };

    return () => {
      cancelled = true;
      source.close();
    };
  }, [setError, setLoading, setThreads]);
}
