"use client";

import { FOLDERS } from "@/lib/mock/inbox";
import type { Folder } from "@/lib/types";
import { useInboxStore } from "@/stores/inbox-store";
import Link from "next/link";
import { InboxToolbar } from "./InboxToolbar";
import { ThreadDetail } from "./ThreadDetail";
import { ThreadList } from "./ThreadList";
import { useInboxUrlSync } from "./useInboxUrlSync";

export function InboxPage() {
  useInboxUrlSync();
  const activeFolder = useInboxStore((s) => s.activeFolder);
  const setFolder = useInboxStore((s) => s.setFolder);

  const main = FOLDERS.filter((f) => f.section === "main");
  const stages = FOLDERS.filter((f) => f.section === "stage");
  const chats = FOLDERS.filter((f) => f.section === "chat");

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
            Every thread jill-diy is part of, plus drafts awaiting your approval.
          </div>
        </div>

        <InboxToolbar />

        <div className="inbox-shell">
          <div className="inbox-sidebar" id="inbox-folders">
            <h4 style={{ marginTop: 6 }}>Folders</h4>
            {main.map(renderFolder)}
            <h4 style={{ marginTop: 14 }}>By stage</h4>
            {stages.map(renderFolder)}
            {chats.map(renderFolder)}
          </div>

          <ThreadList />
          <ThreadDetail />
        </div>

        <div className="cache-note">
          <b>5 subagents currently need your approval</b> before sending — drafts from Intro-Setter, TakeHome-Sender, CodeReview-Scheduler, PMReview-Scheduler, and Handoff all land here first. Approve to send via AgentMail; edit to tweak before sending; discard to drop. Manage which subagents need approval in{" "}
          <Link href="/settings" style={{ color: "var(--zen)", textDecoration: "underline" }}>
            Settings → Approval before sending
          </Link>
          .
        </div>
      </div>
    </main>
  );
}
