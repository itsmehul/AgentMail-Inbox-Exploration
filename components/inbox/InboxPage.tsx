"use client";

import { computeFolders } from "@/lib/inbox/folders";
import type { Folder } from "@/lib/types";
import { useInboxStore } from "@/stores/inbox-store";
import Link from "next/link";
import { InboxResetButton } from "./InboxResetButton";
import { InboxToolbar } from "./InboxToolbar";
import { RoleSwitcher } from "./RoleSwitcher";
import { ThreadDetail } from "./ThreadDetail";
import { ThreadList } from "./ThreadList";
import { useInboxLiveSync } from "./useInboxLiveSync";
import { useInboxUrlSync } from "./useInboxUrlSync";

export function InboxPage() {
  useInboxLiveSync();
  useInboxUrlSync();

  const threads = useInboxStore((s) => s.threads);
  const loading = useInboxStore((s) => s.loading);
  const error = useInboxStore((s) => s.error);
  const activeFolder = useInboxStore((s) => s.activeFolder);
  const setFolder = useInboxStore((s) => s.setFolder);

  const folders = computeFolders(threads);
  const main = folders.filter((f) => f.section === "main");
  const stages = folders.filter((f) => f.section === "stage");
  const chats = folders.filter((f) => f.section === "chat");

  const renderFolder = (f: Folder) => (
    <div
      key={f.key}
      className={`inbox-folder ${f.key === activeFolder ? "active" : ""}`}
      onClick={() => setFolder(f.key)}
      onKeyDown={(e) => e.key === "Enter" && setFolder(f.key)}
      role="button"
      tabIndex={0}
    >
      {f.label}
      {f.badge ? (
        <span className="badge-new" style={f.badgeColor ? { background: f.badgeColor } : undefined}>
          {f.count}
        </span>
      ) : (
        <span className="count">{f.count}</span>
      )}
    </div>
  );

  return (
    <main className="canvas-area page active" id="page-inbox" style={{ overflow: "auto" }}>
      <div className="inbox-wrap">
        <div style={{ marginBottom: 16 }}>
          <h1 className="settings-h1" style={{ margin: 0 }}>
            Inbox
          </h1>
          <div className="settings-sub" style={{ margin: "4px 0 0" }}>
            Unified inbox across Jill, HM, and Eng — live from AgentMail with pipeline threads merged by candidate.
          </div>
        </div>

        {error && (
          <div
            style={{
              marginBottom: 12,
              padding: "10px 14px",
              borderRadius: 8,
              background: "rgba(220,38,38,0.08)",
              color: "#b91c1c",
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        <InboxToolbar />

        <div className="inbox-shell">
          <div className="inbox-sidebar" id="inbox-folders">
            <h4 style={{ marginTop: 6 }}>Folders</h4>
            {main.map(renderFolder)}
            <h4 style={{ marginTop: 14 }}>By stage</h4>
            {stages.map(renderFolder)}
            {chats.map(renderFolder)}
          </div>

          {loading && threads.length === 0 ? (
            <div style={{ flex: 1, padding: 32, color: "var(--ink-muted)", fontSize: 13 }}>
              Loading unified inbox from AgentMail…
            </div>
          ) : (
            <>
              <ThreadList />
              <ThreadDetail />
            </>
          )}
        </div>

        <div className="cache-note">
          <b>Unified AgentMail inbox</b> — Jill, HM, and Eng threads are merged into one view; messages always
          come from AgentMail. Configure one webhook at <code>/api/agentmail/webhooks</code>. HM/Eng use the
          role switcher and compose bar.{" "}
          <Link href="/settings" style={{ color: "var(--zen)", textDecoration: "underline" }}>
            Settings
          </Link>
          .
        </div>
      </div>
      <InboxResetButton />
      <RoleSwitcher />
    </main>
  );
}
