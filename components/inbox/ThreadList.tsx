"use client";

import type { ThreadListTab } from "@/stores/inbox-store";
import { useFilteredThreads, useInboxStore } from "@/stores/inbox-store";

const LIST_TABS: { value: ThreadListTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "follow_up", label: "Follow up" },
  { value: "blocked", label: "Blocked" },
];

export function ThreadList() {
  const activeThread = useInboxStore((s) => s.activeThread);
  const setThread = useInboxStore((s) => s.setThread);
  const searchQuery = useInboxStore((s) => s.searchQuery);
  const selectedOrgUserIds = useInboxStore((s) => s.selectedOrgUserIds);
  const threadListTab = useInboxStore((s) => s.threadListTab);
  const setThreadListTab = useInboxStore((s) => s.setThreadListTab);
  const threads = useFilteredThreads();

  const hasFilters =
    searchQuery.trim() !== "" || selectedOrgUserIds.length > 0 || threadListTab !== "all";

  return (
    <div className="thread-list-column">
      <div className="thread-list-filters" role="tablist" aria-label="Thread list filter">
        {LIST_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={threadListTab === tab.value}
            className={`thread-list-filter-btn ${threadListTab === tab.value ? "active" : ""}`}
            onClick={() => setThreadListTab(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {threads.length === 0 ? (
        <div className="thread-list" id="thread-list-content">
          <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--ink-muted)", fontSize: 13 }}>
            {hasFilters ? "No threads match your search or filter." : "No threads in this folder."}
          </div>
        </div>
      ) : (
        <div className="thread-list" id="thread-list-content">
          {threads.map((t) => {
            const isApproval = t.folder === "approval";
            return (
              <div
                key={t.id}
                className={`thread-item ${t.id === activeThread ? "active" : ""}`}
                onClick={() => setThread(t.id)}
                onKeyDown={(e) => e.key === "Enter" && setThread(t.id)}
                role="button"
                tabIndex={0}
              >
                <div className="thread-from">
                  <span className="name">{t.from}</span>
                  <span className="time">{t.time}</span>
                </div>
                <div className="thread-subject">{t.subject}</div>
                <div className="thread-preview">{t.preview}</div>
                <div className="thread-tags">
                  {(t.tags ?? []).map((lbl) => (
                    <span key={lbl} className="thread-tag subagent">
                      {lbl}
                    </span>
                  ))}
                  {(t.userTags ?? []).map((lbl) => (
                    <span
                      key={lbl}
                      className="thread-tag user-tag"
                      style={{ background: "#eef2ff", color: "#4338ca", borderColor: "#c7d2fe" }}
                    >
                      {lbl}
                    </span>
                  ))}
                  {isApproval && (
                    <span
                      className="thread-tag warn"
                      style={{ background: "#fef3c7", color: "#92400e", borderColor: "#fde68a" }}
                    >
                      awaiting approval
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
