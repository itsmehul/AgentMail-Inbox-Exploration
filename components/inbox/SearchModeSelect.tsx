"use client";

import { useEffect, useRef, useState } from "react";
import { useInboxStore, type SearchMode } from "@/stores/inbox-store";

const MODES: { value: SearchMode; label: string; description: string }[] = [
  { value: "query", label: "Query", description: "Filter threads by keyword" },
  { value: "agent", label: "Agent", description: "Ask the agent about your inbox" },
];

export function SearchModeSelect() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchMode = useInboxStore((s) => s.searchMode);
  const setSearchMode = useInboxStore((s) => s.setSearchMode);
  const active = MODES.find((m) => m.value === searchMode) ?? MODES[0];

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  return (
    <div className="inbox-search-mode" ref={rootRef}>
      <button
        type="button"
        className="inbox-search-mode-trigger"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Search mode: ${active.label}`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <span>{active.label}</span>
        <svg className="inbox-search-mode-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="inbox-search-mode-menu" role="listbox" onClick={(e) => e.stopPropagation()}>
          {MODES.map((mode) => {
            const selected = searchMode === mode.value;
            return (
              <button
                key={mode.value}
                type="button"
                role="option"
                aria-selected={selected}
                className={`inbox-search-mode-option ${selected ? "selected" : ""}`}
                onClick={() => {
                  setSearchMode(mode.value);
                  setOpen(false);
                }}
              >
                <span className="inbox-search-mode-option-label">{mode.label}</span>
                <span className="inbox-search-mode-option-desc">{mode.description}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
