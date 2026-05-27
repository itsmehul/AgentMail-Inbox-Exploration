"use client";

import { useEffect, useRef, useState } from "react";
import { ORG_USERS } from "@/lib/mock/org-users";
import { useInboxStore } from "@/stores/inbox-store";

function filterLabel(selectedIds: string[]): string {
  if (selectedIds.length === 0) return "Team members";
  const names = ORG_USERS.filter((u) => selectedIds.includes(u.id)).map((u) => u.name.split(" ")[0]);
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]}, ${names[1]}`;
  return `${names[0]}, ${names[1]} +${names.length - 2}`;
}

export function OrgUserMultiSelect() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedOrgUserIds = useInboxStore((s) => s.selectedOrgUserIds);
  const toggleOrgUser = useInboxStore((s) => s.toggleOrgUser);
  const clearOrgUserFilter = useInboxStore((s) => s.clearOrgUserFilter);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const hasSelection = selectedOrgUserIds.length > 0;

  return (
    <div className="inbox-user-filter" ref={rootRef}>
      <button
        type="button"
        className={`inbox-user-filter-trigger ${hasSelection ? "has-selection" : ""}`}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <span>{filterLabel(selectedOrgUserIds)}</span>
        {hasSelection && (
          <span className="inbox-user-filter-count">{selectedOrgUserIds.length}</span>
        )}
        <svg className="inbox-user-filter-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="inbox-user-filter-menu" role="listbox" aria-multiselectable onClick={(e) => e.stopPropagation()}>
          <div className="inbox-user-filter-menu-head">
            <span>Filter by team member</span>
            {hasSelection && (
              <button type="button" className="inbox-user-filter-clear" onClick={() => clearOrgUserFilter()}>
                Clear
              </button>
            )}
          </div>
          {ORG_USERS.map((user) => {
            const checked = selectedOrgUserIds.includes(user.id);
            return (
              <label key={user.id} className={`inbox-user-filter-option ${checked ? "checked" : ""}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleOrgUser(user.id)}
                />
                <span className="inbox-user-filter-avatar" style={{ background: user.avatar }}>
                  {user.initials}
                </span>
                <span className="inbox-user-filter-meta">
                  <span className="inbox-user-filter-name">{user.name}</span>
                  <span className="inbox-user-filter-role">{user.role}</span>
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
