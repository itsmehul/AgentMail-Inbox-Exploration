"use client";

import { useCallback } from "react";
import {
  createAgentMailInbox,
  fetchAgentMailInboxes,
  fetchAgentMailStatus,
} from "@/lib/agentmail/fetch";
import { useSettingsStore } from "@/stores/settings-store";

export function useAgentMailSync() {
  const setAgentMailStatus = useSettingsStore((s) => s.setAgentMailStatus);
  const setInboxes = useSettingsStore((s) => s.setInboxes);

  const syncStatus = useCallback(async () => {
    try {
      const status = await fetchAgentMailStatus();
      if (!status.configured) {
        setAgentMailStatus("not_configured");
        return status;
      }
      if (!status.connected) {
        setAgentMailStatus("error", status.error ?? "Connection failed", status.inboxCount ?? null);
        return status;
      }
      setAgentMailStatus("connected", null, status.inboxCount ?? null);
      return status;
    } catch (error) {
      setAgentMailStatus("error", error instanceof Error ? error.message : "Status check failed");
      return null;
    }
  }, [setAgentMailStatus]);

  const refreshInboxes = useCallback(async () => {
    const status = await syncStatus();
    if (!status?.configured || !status.connected) return false;

    try {
      const inboxes = await fetchAgentMailInboxes();
      if (inboxes.length) setInboxes(inboxes);
      return true;
    } catch (error) {
      setAgentMailStatus("error", error instanceof Error ? error.message : "Failed to list inboxes");
      return false;
    }
  }, [setAgentMailStatus, setInboxes, syncStatus]);

  const testConnection = useCallback(async () => {
    const ok = await refreshInboxes();
    return ok;
  }, [refreshInboxes]);

  const provisionInbox = useCallback(
    async (payload: { username: string; domain: string; displayName?: string }) => {
      const inbox = await createAgentMailInbox(payload);
      setAgentMailStatus("connected");
      return inbox;
    },
    [setAgentMailStatus]
  );

  return { syncStatus, refreshInboxes, testConnection, provisionInbox };
}
