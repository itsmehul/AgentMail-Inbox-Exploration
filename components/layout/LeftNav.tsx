"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useAgentStore } from "@/stores/agent-store";
import { useWorkflowStore } from "@/stores/workflow-store";

const NAV_ROUTES = [
  { href: "/agent", label: "Agent", section: "Configure" },
  { href: "/workflow", label: "Workflow", section: "Configure" },
  { href: "/settings", label: "Settings", section: "Configure" },
  { href: "/inbox", label: "Inbox", section: "Monitor" },
];

function NavIcon({ name }: { name: string }) {
  const icons: Record<string, React.ReactNode> = {
    Agent: (
      <svg className="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 22c0-4 4-7 8-7s8 3 8 7" />
      </svg>
    ),
    Workflow: (
      <svg className="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <path d="M14 17h7" />
      </svg>
    ),
    Settings: (
      <svg className="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19 12a7 7 0 01-.6 2.8l2 1.5-2 3.4-2.4-1a7 7 0 01-2.4 1.4L13 22h-2l-.6-2a7 7 0 01-2.4-1.3l-2.4 1-2-3.5 2-1.5A7 7 0 015 12c0-1 .2-1.9.5-2.8l-2-1.5 2-3.4 2.4 1A7 7 0 0110 4l.6-2H13l.6 2a7 7 0 012.4 1.3l2.4-1 2 3.5-2 1.5c.3.9.5 1.8.6 2.7z" />
      </svg>
    ),
    Inbox: (
      <svg className="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 12h-6l-2 3h-4l-2-3H2M5 7l3-3h8l3 3v13a2 2 0 01-2 2H7a2 2 0 01-2-2V7z" />
      </svg>
    ),
  };
  return icons[name] ?? null;
}

export function LeftNav() {
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const currentAgent = useAgentStore((s) => s.currentAgent);
  const agentMenuOpen = useAgentStore((s) => s.agentMenuOpen);
  const setAgentMenuOpen = useAgentStore((s) => s.setAgentMenuOpen);
  const switchAgent = useAgentStore((s) => s.switchAgent);
  const resetForAgent = useWorkflowStore((s) => s.resetForAgent);
  const agent = useAgentStore((s) => s.getAgent());

  useEffect(() => {
    const onClick = () => setAgentMenuOpen(false);
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [setAgentMenuOpen]);

  const handleSwitchAgent = (id: "jill" | "jack") => {
    switchAgent(id);
    resetForAgent();
  };

  return (
    <aside className="leftnav">
      <div className="org-switcher">
        <span className="dot-zen">Z</span>
        <span>ZenAgents</span>
        <svg className="ic-svg caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 9l4 4 4-4M8 15l4-4 4 4" />
        </svg>
      </div>

      <div className="back-link">
        <svg className="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Back to workspace
      </div>

      <div
        className="agent-card"
        style={{ cursor: "pointer", position: "relative" }}
        onClick={(e) => {
          e.stopPropagation();
          setAgentMenuOpen(!agentMenuOpen);
        }}
      >
        <span className="avatar" id="agent-avatar" style={{ background: agent.avatar }} />
        <span className="name" id="agent-name">
          {agent.label}
        </span>
        <svg
          className="ic-svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ marginLeft: "auto", color: "var(--ink-faint)" }}
        >
          <path d="M8 9l4 4 4-4M8 15l4-4 4 4" />
        </svg>
        {agentMenuOpen && (
          <div
            ref={menuRef}
            id="agent-menu"
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              right: 0,
              background: "var(--panel)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
              zIndex: 200,
              padding: 4,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="agent-menu-item"
              onClick={() => handleSwitchAgent("jill")}
              style={{
                padding: "8px 10px",
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              <span
                className="avatar"
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>jill-diy</div>
                <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>Hiring pipeline · email-only</div>
              </div>
              {currentAgent === "jill" && (
                <svg className="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: "var(--ink)" }}>
                  <path d="M5 12l5 5L20 7" />
                </svg>
              )}
            </div>
            <div
              style={{
                padding: "8px 10px",
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 13,
                opacity: 0.55,
                cursor: "not-allowed",
              }}
            >
              <span
                className="avatar"
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #fb923c, #ec4899)",
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>jack-diy</div>
                <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>Candidate sourcing · ~1 month out</div>
              </div>
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 9,
                  padding: "2px 6px",
                  borderRadius: 4,
                  background: "var(--hover)",
                  color: "var(--ink-muted)",
                  border: "1px solid var(--border)",
                }}
              >
                soon
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="nav-group">
        <div className="nav-title">Configure</div>
        {NAV_ROUTES.filter((r) => r.section === "Configure").map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={`nav-item ${pathname === route.href ? "active" : ""}`}
          >
            <NavIcon name={route.label} />
            {route.label}
          </Link>
        ))}
        {["Branches", "Knowledge Base", "Analysis", "Tools", "Widget"].map((label) => (
          <span key={label} className="nav-item" style={{ opacity: 0.45, cursor: "not-allowed" }}>
            {label}
          </span>
        ))}
      </div>

      <div className="nav-group">
        <div className="nav-title">Monitor</div>
        {NAV_ROUTES.filter((r) => r.section === "Monitor").map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={`nav-item ${pathname === route.href ? "active" : ""}`}
          >
            <NavIcon name={route.label} />
            {route.label}
          </Link>
        ))}
        {["Dashboards", "Conversations", "Tests", "Users"].map((label) => (
          <span key={label} className="nav-item" style={{ opacity: 0.45, cursor: "not-allowed" }}>
            {label}
          </span>
        ))}
      </div>

      <div className="nav-group">
        <div className="nav-title">Deploy</div>
        <span className="nav-item" style={{ opacity: 0.45, cursor: "not-allowed" }}>
          Outbound
        </span>
      </div>

      <span className="nav-item" style={{ marginTop: "auto", opacity: 0.45, cursor: "not-allowed" }}>
        Developers
      </span>
    </aside>
  );
}
