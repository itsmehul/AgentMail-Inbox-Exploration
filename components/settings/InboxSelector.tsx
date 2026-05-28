"use client";

import { useEffect, useState } from "react";
import { useAgentMailSync } from "@/components/settings/useAgentMailSync";
import { useSettingsStore } from "@/stores/settings-store";
import { useUiStore } from "@/stores/ui-store";

export function InboxSelector() {
  const selectedInbox = useSettingsStore((s) => s.selectedInbox);
  const inboxes = useSettingsStore((s) => s.inboxes);
  const setSelectedInbox = useSettingsStore((s) => s.setSelectedInbox);
  const inboxDropdownOpen = useUiStore((s) => s.inboxDropdownOpen);
  const setInboxDropdownOpen = useUiStore((s) => s.setInboxDropdownOpen);
  const openCreateInbox = useUiStore((s) => s.openCreateInbox);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const { refreshInboxes } = useAgentMailSync();

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setRefreshing(true);
    setRefreshError(null);
    try {
      const ok = await refreshInboxes();
      if (!ok) setRefreshError("Could not refresh — check AgentMail connection");
    } catch (error) {
      setRefreshError(error instanceof Error ? error.message : "Refresh failed");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const onClick = () => setInboxDropdownOpen(false);
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [setInboxDropdownOpen]);

  return (
    <div className="field">
      <label>
        Inbox address
        <span className="tip">
          ?<span className="tip-bubble">The agent&apos;s email identity, provisioned in your AgentMail account. HM Cc&apos;s this address on candidate threads to bring jill-diy in.</span>
        </span>
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <div
            className="select-box"
            id="inbox-select"
            onClick={(e) => {
              e.stopPropagation();
              setInboxDropdownOpen(!inboxDropdownOpen);
            }}
            onKeyDown={(e) => e.key === "Enter" && setInboxDropdownOpen(!inboxDropdownOpen)}
            role="button"
            tabIndex={0}
          >
            <svg className="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 12h-6l-2 3h-4l-2-3H2M5 7l3-3h8l3 3v13a2 2 0 01-2 2H7a2 2 0 01-2-2V7z" />
            </svg>
            <span id="inbox-selected-label">{selectedInbox}</span>
          </div>
          {inboxDropdownOpen && (
            <div
              id="inbox-dropdown"
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0,
                right: 0,
                background: "var(--panel)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
                zIndex: 50,
                padding: 4,
                maxHeight: 240,
                overflowY: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {inboxes.map((inbox) => (
                <div
                  key={inbox.addr}
                  className="inbox-option"
                  data-addr={inbox.addr}
                  data-selected={inbox.addr === selectedInbox ? "true" : undefined}
                  onClick={() => setSelectedInbox(inbox.addr)}
                  onKeyDown={(e) => e.key === "Enter" && setSelectedInbox(inbox.addr)}
                  role="button"
                  tabIndex={0}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 6 }}>
                    <svg className="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 12h-6l-2 3h-4l-2-3H2M5 7l3-3h8l3 3v13a2 2 0 01-2 2H7a2 2 0 01-2-2V7z" />
                    </svg>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{inbox.label}</div>
                      <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>{inbox.meta}</div>
                    </div>
                    {inbox.addr === selectedInbox && (
                      <svg className="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: "var(--ink)" }}>
                        <path d="M5 12l5 5L20 7" />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
              <div style={{ borderTop: "1px solid var(--border)", margin: "4px 0" }} />
              <div
                onClick={openCreateInbox}
                onKeyDown={(e) => e.key === "Enter" && openCreateInbox()}
                role="button"
                tabIndex={0}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 6, cursor: "pointer", color: "var(--zen)", fontSize: 13, fontWeight: 500 }}
              >
                <svg className="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Create new inbox
              </div>
              <div
                onClick={(e) => void handleRefresh(e)}
                role="button"
                tabIndex={0}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 6, cursor: "pointer", color: "var(--ink-muted)", fontSize: 12 }}
              >
                {refreshing ? (
                  <svg className="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 0.8s linear infinite" }}>
                    <path d="M21 12a9 9 0 11-3.6-6.7L21 8M21 3v5h-5" />
                  </svg>
                ) : (
                  <svg className="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 11-3.6-6.7L21 8M21 3v5h-5" />
                  </svg>
                )}
                {refreshing ? "Refreshing…" : "Refresh from AgentMail"}
              </div>
            </div>
          )}
        </div>
        <button type="button" className="btn-soft" onClick={openCreateInbox} style={{ whiteSpace: "nowrap" }}>
          <svg className="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New inbox
        </button>
      </div>
      <div className="helper-text">
        Inboxes are provisioned in AgentMail. Pick an existing one or create a new inbox below.
        {refreshError ? <span style={{ display: "block", color: "#dc2626", marginTop: 4 }}>{refreshError}</span> : null}
      </div>
    </div>
  );
}
