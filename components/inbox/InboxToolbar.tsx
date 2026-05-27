"use client";

import { useInboxStore } from "@/stores/inbox-store";
import { OrgUserMultiSelect } from "./OrgUserMultiSelect";
import { SearchModeSelect } from "./SearchModeSelect";

export function InboxToolbar() {
  const searchQuery = useInboxStore((s) => s.searchQuery);
  const searchMode = useInboxStore((s) => s.searchMode);
  const setSearchQuery = useInboxStore((s) => s.setSearchQuery);

  return (
    <div className="inbox-toolbar">
      <div className="inbox-search">
        <span className="inbox-search-icon" aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20L16 16" />
          </svg>
        </span>
        <SearchModeSelect />
        <input
          type="search"
          className="inbox-search-input"
          placeholder={
            searchMode === "agent"
              ? "Ask the agent to find, summarize, or act on emails…"
              : "Search emails by sender, subject, preview, or tag…"
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label={searchMode === "agent" ? "Ask the inbox agent" : "Search emails"}
        />
        <OrgUserMultiSelect />
      </div>
    </div>
  );
}
