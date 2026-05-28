"use client";

import { useState } from "react";
import { useInboxStore } from "@/stores/inbox-store";

export function InboxResetButton() {
  const setThreads = useInboxStore((s) => s.setThreads);
  const setError = useInboxStore((s) => s.setError);
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    const ok = window.confirm(
      "Reset inbox?\n\nThis permanently deletes all threads from Jill, HM, and Eng AgentMail inboxes and clears the local SQLite cache. This cannot be undone."
    );
    if (!ok) return;

    setResetting(true);
    setError(null);
    try {
      const res = await fetch("/api/inbox/reset", { method: "POST" });
      const data = (await res.json()) as {
        threads?: unknown[];
        agentMailDeleted?: number;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Failed to reset inbox");
      setThreads([]);
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to reset inbox");
    } finally {
      setResetting(false);
    }
  };

  return (
    <button
      type="button"
      className="inbox-reset-btn"
      onClick={() => void handleReset()}
      disabled={resetting}
      aria-label="Reset inbox"
      title="Delete all AgentMail threads and clear local cache"
    >
      {resetting ? "Resetting…" : "Reset inbox"}
    </button>
  );
}
