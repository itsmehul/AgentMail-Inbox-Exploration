"use client";

import { useInboxStore } from "@/stores/inbox-store";
import { OrgUserMultiSelect } from "./OrgUserMultiSelect";

export function InboxToolbar() {
  const searchQuery = useInboxStore((s) => s.searchQuery);
  const setSearchQuery = useInboxStore((s) => s.setSearchQuery);

  return (
    <div className="inbox-toolbar">
      <label className="inbox-search">
        <span className="inbox-search-icon" aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20L16 16" />
          </svg>
        </span>
        <input
          type="search"
          className="input inbox-search-input"
          placeholder="Search emails by sender, subject, preview, or tag…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search emails"
        />
      </label>
      <OrgUserMultiSelect />
    </div>
  );
}
