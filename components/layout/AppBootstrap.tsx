"use client";

import { useEffect } from "react";
import { useAgentMailSync } from "@/components/settings/useAgentMailSync";
import { runInboxBootstrap } from "@/lib/inbox/app-bootstrap";
import { useSettingsStore } from "@/stores/settings-store";

export function AppBootstrap() {
  const { syncStatus, refreshInboxes } = useAgentMailSync();

  useEffect(() => {
    void (async () => {
      await syncStatus();
      if (useSettingsStore.getState().agentMailConnection !== "connected") return;
      await refreshInboxes();
      await runInboxBootstrap();
    })();
  }, [refreshInboxes, syncStatus]);

  return null;
}
