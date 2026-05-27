"use client";

import { useAgentStore } from "@/stores/agent-store";

export function Topbar() {
  const agent = useAgentStore((s) => s.getAgent());

  return (
    <div className="topbar">
      <div className="topbar-left">
        <span className="logo">Z</span>
        <span>Zenlabs</span>
      </div>

      <div className="topbar-crumb">
        <div className="ic">
          <svg className="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 3v18" />
          </svg>
        </div>
        <span id="topbar-agent-name">{agent.topbar}</span>
        <span className="sep">/</span>
        <span>Main</span>
        <span className="branch-pill">Live 100%</span>
        <svg
          className="ic-svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ color: "var(--ink-faint)" }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      <div className="topbar-right">
        <span className="badge public">Public</span>
        <span className="badge draft">Draft</span>
        <button type="button" className="btn-soft">
          <span style={{ color: "var(--ink-muted)", fontFamily: "var(--mono)" }}>{`{ }`}</span> Variables
        </button>
        <button type="button" className="btn-soft">
          Preview
        </button>
        <button type="button" className="btn-primary">
          Publish <span className="caret">▾</span>
        </button>
        <button type="button" className="btn-icon ghost">
          <svg className="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
        <button type="button" className="btn-icon ghost">
          <svg className="ic-svg" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="12" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="19" cy="12" r="2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
