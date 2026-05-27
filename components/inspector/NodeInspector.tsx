"use client";

import Link from "next/link";
import {
  EDGES_OUT_BY_NODE,
  KB_BY_NODE,
  NODES,
  TOOL_DESCRIPTIONS,
  TOOLS_BY_NODE,
} from "@/lib/mock/workflow";
import type { InspectorTab } from "@/lib/types";
import { useWorkflowStore } from "@/stores/workflow-store";

function Tip({ text }: { text: string }) {
  return (
    <span className="tip">
      ?<span className="tip-bubble">{text}</span>
    </span>
  );
}

function InspectorTabs({ active, onChange }: { active: InspectorTab; onChange: (t: InspectorTab) => void }) {
  const tabs: { id: InspectorTab; label: string }[] = [
    { id: "general", label: "General" },
    { id: "kb", label: "Knowledge Base" },
    { id: "tools", label: "Tools" },
    { id: "tests", label: "Tests" },
    { id: "edges", label: "Edges" },
  ];
  return (
    <div className="insp-tabs">
      {tabs.map((t) => (
        <div
          key={t.id}
          className={`insp-tab ${active === t.id ? "active" : ""}`}
          onClick={() => onChange(t.id)}
          onKeyDown={(e) => e.key === "Enter" && onChange(t.id)}
          role="tab"
          tabIndex={0}
        >
          {t.label}
        </div>
      ))}
    </div>
  );
}

function KBTab({ subagent }: { subagent: string }) {
  const items = KB_BY_NODE[subagent as keyof typeof KB_BY_NODE] ?? [];
  const isTakeHome = subagent === "jill_takehome";
  return (
    <>
      <div className="insp-section">
        <div className="insp-row">
          <span className="insp-label">
            Documents
            <Tip text="Files this subagent can reference or attach. Used for templates, rubrics, or HM-approved materials." />
          </span>
          <button type="button" className="btn-soft" style={{ fontSize: 11, padding: "4px 10px" }}>
            + Upload
          </button>
        </div>
        {items.length === 0 ? (
          <div
            style={{
              padding: 24,
              background: "var(--hover)",
              border: "1px dashed var(--border-strong)",
              borderRadius: 8,
              textAlign: "center",
              color: "var(--ink-muted)",
              fontSize: 12,
            }}
          >
            No documents yet. Upload a PDF, Markdown, or text file.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {items.map((it) => (
              <div
                key={it.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  background: "white",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                }}
              >
                <svg className="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--ink-muted)" }}>
                  <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" />
                  <path d="M13 2v7h7" />
                </svg>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500 }}>{it.name}</div>
                  <div style={{ fontSize: 10.5, color: "var(--ink-muted)", fontFamily: "var(--mono)" }}>
                    {it.size} · updated {it.updated}
                  </div>
                </div>
                {"tag" in it && it.tag ? (
                  <span
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 9,
                      padding: "2px 6px",
                      borderRadius: 4,
                      background: "#ecfdf5",
                      color: "#047857",
                      border: "1px solid #bbf7d0",
                    }}
                  >
                    {it.tag}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
      {isTakeHome && (
        <div className="insp-section" style={{ background: "#fefce8", border: "1px solid #fde047", padding: 12, borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: "#713f12", lineHeight: 1.55 }}>
            <b style={{ color: "#422006" }}>Tip:</b> Tag each take-home with{" "}
            <code style={{ fontFamily: "var(--mono)", background: "white", padding: "1px 4px", borderRadius: 3 }}>HM-approved</code> once the HM has reviewed it.
          </div>
        </div>
      )}
    </>
  );
}

function ToolsTab({ subagent }: { subagent: string }) {
  const tools = TOOLS_BY_NODE[subagent as keyof typeof TOOLS_BY_NODE] ?? [];
  return (
    <div className="insp-section">
      <div className="insp-row">
        <span className="insp-label">
          Available tools
          <Tip text="Functions this subagent can call. The LLM picks one based on the description." />
        </span>
        <button type="button" className="btn-soft" style={{ fontSize: 11, padding: "4px 10px" }}>
          + Add tool
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {tools.map((t) => (
          <div key={t} style={{ padding: "10px 12px", background: "white", border: "1px solid var(--border)", borderRadius: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "var(--zen)" }}>
                <svg className="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14.7 6.3a4 4 0 105.6 5.6L21 11l-8 8-4 1 1-4 8-8 .7.3z" />
                </svg>
              </span>
              <span style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 600 }}>{t}</span>
              <span className="toggle" style={{ marginLeft: "auto" }}>
                <input type="checkbox" defaultChecked readOnly />
                <span className="track" />
                <span className="knob" />
              </span>
            </div>
            {TOOL_DESCRIPTIONS[t as keyof typeof TOOL_DESCRIPTIONS] ? (
              <div style={{ fontSize: 11, color: "var(--ink-muted)", marginTop: 6, lineHeight: 1.5 }}>
                {TOOL_DESCRIPTIONS[t as keyof typeof TOOL_DESCRIPTIONS]}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function TestsTab() {
  const tests = [
    { name: "Happy path — typical request", meta: "Last run: 2 hours ago · Passed", color: "#16a34a" },
    { name: "Ambiguous intent — should route elsewhere", meta: "Last run: yesterday · Passed", color: "#16a34a" },
    { name: "PII redaction — Guardian must block", meta: "Last run: 4 days ago · Needs review", color: "#d97706" },
  ];
  return (
    <div className="insp-section">
      <div className="insp-row">
        <span className="insp-label">
          Saved tests
          <Tip text="Replay sample emails through this subagent to check the reply quality before deploying." />
        </span>
        <button type="button" className="btn-soft" style={{ fontSize: 11, padding: "4px 10px" }}>
          + New test
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {tests.map((t) => (
          <div
            key={t.name}
            style={{
              padding: "10px 12px",
              background: "white",
              border: "1px solid var(--border)",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: t.color }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 500 }}>{t.name}</div>
              <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>{t.meta}</div>
            </div>
            <button type="button" className="btn-soft" style={{ fontSize: 11, padding: "4px 10px" }}>
              Run
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function EdgesTab({ subagent, selectEdge }: { subagent: string; selectEdge: (key: string, from: string, to: string) => void }) {
  const out = EDGES_OUT_BY_NODE[subagent as keyof typeof EDGES_OUT_BY_NODE];
  if (!out) {
    return (
      <div className="insp-section">
        <div style={{ padding: 20, background: "var(--hover)", borderRadius: 8, fontSize: 12, color: "var(--ink-muted)", lineHeight: 1.55 }}>
          This subagent&apos;s reply ends the turn — the email is sent and the workflow waits for the next inbound message. No outbound edges to configure.
        </div>
      </div>
    );
  }
  return (
    <div className="insp-section">
      <div className="insp-row">
        <span className="insp-label">
          Outbound edges
          <Tip text="Where this node can route to. Click an edge to edit its condition." />
        </span>
        <button type="button" className="btn-soft" style={{ fontSize: 11, padding: "4px 10px" }}>
          + Add edge
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {out.map((e) => (
          <div
            key={e.key}
            onClick={() => selectEdge(e.key, "Orchestrator", e.to)}
            onKeyDown={(ev) => ev.key === "Enter" && selectEdge(e.key, "Orchestrator", e.to)}
            role="button"
            tabIndex={0}
            style={{
              padding: "10px 12px",
              background: "white",
              border: "1px solid var(--border)",
              borderRadius: 8,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 500 }}>{e.label}</div>
              <div style={{ fontSize: 11, color: "var(--ink-muted)", fontFamily: "var(--mono)" }}>→ {e.to}</div>
            </div>
            <span
              style={{
                fontFamily: "var(--mono)",
                fontSize: 9,
                padding: "2px 6px",
                borderRadius: 4,
                background: "var(--zen-bg)",
                color: "var(--zen)",
                border: "1px solid #ddd6fe",
              }}
            >
              LLM Condition
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function NodeInspector({ nodeKey }: { nodeKey: string }) {
  const n = NODES[nodeKey as keyof typeof NODES];
  const inspectorTab = useWorkflowStore((s) => s.inspectorTab);
  const setInspectorTab = useWorkflowStore((s) => s.setInspectorTab);
  const selectEdge = useWorkflowStore((s) => s.selectEdge);

  if (!n || !("type" in n)) return null;

  const head = (
    <div className="insp-head">
      <div className="title">
        <span className="node-icon" style={{ width: 22, height: 22 }}>
          <svg className="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="8" r="3" />
            <path d="M5 20c0-3 3-5 7-5s7 2 7 5" />
          </svg>
        </span>
        {n.name}
      </div>
      <div className="icons">
        <button type="button" className="btn-icon ghost" title="Docs">
          <svg className="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
          </svg>
        </button>
      </div>
    </div>
  );

  if (n.type === "simple") {
    return (
      <>
        {head}
        <div style={{ fontSize: 12, color: "var(--ink-muted)", marginBottom: 18 }}>{n.subtitle}</div>
        <div className="insp-section">
          <div className="insp-label">
            About this node
            <Tip text="A system node. No configuration needed — it just marks the entry or exit of the workflow." />
          </div>
          <div style={{ fontSize: 12.5, lineHeight: 1.6, color: "var(--ink)", padding: 12, background: "var(--hover)", borderRadius: 8 }}>
            {n.desc}
          </div>
        </div>
      </>
    );
  }

  if (n.type !== "subagent") return null;

  const generalBody = (
    <>
      <div className="insp-section">
        <div className="insp-row">
          <span className="insp-label">
            Prompt
            <Tip text="The instructions this agent follows. Write in plain English — no special syntax." />
          </span>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--ink-muted)" }}>
            Override prompt
            <span className="toggle">
              <input type="checkbox" />
              <span className="track" />
              <span className="knob" />
            </span>
          </label>
        </div>
        <textarea className="textarea lg" defaultValue={n.prompt} readOnly />
        <div className="vars-hint">
          Type <code>{`{{`}</code> to add variables
        </div>
      </div>

      <div className="insp-section">
        <div className="insp-row">
          <span className="insp-label">
            LLM
            <Tip text="The model that runs this agent. Sonnet for reasoning, Haiku for fast checks." />
          </span>
          <span className="insp-meta">
            <a>Using default</a>
          </span>
        </div>
        <div className="select-box">
          <span>{n.llm}</span>
        </div>
      </div>

      {"voice" in n && n.voice ? (
        <div className="insp-section">
          <div className="insp-row">
            <span className="insp-label">
              Voice
              <Tip text="Used only when this agent speaks. Email-only agents can ignore this." />
            </span>
            <span className="insp-meta">
              <a>Using default</a>
            </span>
          </div>
          <div className="select-box">
            <span className="avatar-sm" />
            <span>{n.voice}</span>
          </div>
        </div>
      ) : null}

      <div className="insp-section">
        <div className="insp-row">
          <span className="insp-label">
            Eagerness
            <Tip text="How proactive the agent is. Cautious = ask before acting. High = take initiative." />
          </span>
          <span className="insp-meta">
            <a>Using default</a>
          </span>
        </div>
        <div className="select-box">
          <span>{n.eagerness}</span>
        </div>
      </div>

      <div className="insp-section" style={{ background: "var(--zen-bg)", border: "1px solid #ddd6fe", padding: 14, borderRadius: 8 }}>
        <div className="insp-row">
          <span className="insp-label" style={{ color: "var(--zen)" }}>
            Outbound delivery
            <Tip text="Every reply from this subagent is automatically checked by Guardian and sent via AgentMail." />
          </span>
          <Link href="/settings" style={{ fontSize: 11, color: "var(--zen)", textDecoration: "underline" }}>
            Edit defaults
          </Link>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <div style={{ flex: 1, padding: "8px 10px", background: "white", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }}>
            <div style={{ fontWeight: 500, marginBottom: 2 }}>Guardian</div>
            <div style={{ color: "var(--ink-muted)", fontSize: 11 }}>PII · claims · tone · using defaults</div>
          </div>
          <div style={{ flex: 1, padding: "8px 10px", background: "white", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }}>
            <div style={{ fontWeight: 500, marginBottom: 2 }}>Send</div>
            <div style={{ color: "var(--ink-muted)", fontSize: 11 }}>
              {"highStakes" in n && n.highStakes ? "Human approval required" : "Auto-send on Guardian pass"}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {head}
      <div style={{ fontSize: 12, color: "var(--ink-muted)", marginBottom: 14 }}>{n.subtitle}</div>
      <InspectorTabs active={inspectorTab} onChange={setInspectorTab} />
      {inspectorTab === "general" && generalBody}
      {inspectorTab === "kb" && <KBTab subagent={nodeKey} />}
      {inspectorTab === "tools" && <ToolsTab subagent={nodeKey} />}
      {inspectorTab === "tests" && <TestsTab />}
      {inspectorTab === "edges" && <EdgesTab subagent={nodeKey} selectEdge={selectEdge} />}
    </>
  );
}
