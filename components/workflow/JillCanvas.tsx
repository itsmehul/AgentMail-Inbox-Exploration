"use client";

import Link from "next/link";
import { EdgeGroup, EdgePill, WorkflowNode } from "./WorkflowNode";

const SubagentIcon = () => (
  <span className="node-icon">
    <svg className="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="3" />
      <path d="M5 20c0-3 3-5 7-5s7 2 7 5" />
    </svg>
  </span>
);

export function JillCanvas() {
  return (
    <div className="canvas-inner agent-canvas" data-agent="jill">
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 24,
          right: 24,
          maxWidth: 540,
          margin: "0 auto",
          padding: "10px 14px",
          background: "#fefce8",
          border: "1px solid #fde047",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontSize: 12,
          color: "#713f12",
          zIndex: 5,
        }}
      >
        <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#ca8a04", display: "grid", placeItems: "center", flexShrink: 0 }}>
          <svg style={{ width: 13, height: 13, color: "white" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12l5 5L20 7" />
          </svg>
        </div>
        <div style={{ flex: 1, lineHeight: 1.4 }}>
          <b style={{ color: "#422006" }}>5 of 6 subagents need your approval</b> before sending. Status-Reporter sends directly (read-only summaries to you).
        </div>
        <Link href="/settings" style={{ color: "#a16207", textDecoration: "underline", fontWeight: 500, whiteSpace: "nowrap" }}>
          Manage →
        </Link>
      </div>

      <svg className="edges-svg" viewBox="0 0 1000 1100" preserveAspectRatio="none">
        <EdgeGroup d="M 500 90 L 500 170" />
        <EdgeGroup edgeKey="jill_route_intro" fromNode="Orchestrator" toNode="Intro-Setter" d="M 410 320 Q 200 380 130 500" />
        <EdgeGroup edgeKey="jill_route_takehome" fromNode="Orchestrator" toNode="TakeHome-Sender" d="M 470 320 Q 410 400 400 500" />
        <EdgeGroup edgeKey="jill_route_codereview" fromNode="Orchestrator" toNode="CodeReview-Scheduler" d="M 530 320 Q 600 400 670 500" />
        <EdgeGroup edgeKey="jill_route_pmreview" fromNode="Orchestrator" toNode="PMReview-Scheduler" d="M 590 320 Q 800 400 880 500" />
        <EdgeGroup edgeKey="jill_route_status" fromNode="Orchestrator" toNode="Status-Reporter" d="M 430 320 Q 180 550 130 800" />
        <EdgeGroup edgeKey="jill_route_handoff" fromNode="Orchestrator" toNode="Handoff" d="M 570 320 Q 820 550 880 800" />
      </svg>

      <EdgePill edgeKey="jill_webhook" fromNode="Start" toNode="Orchestrator" style={{ top: 122, left: 418 }} label="New email received" onEdge />
      <EdgePill edgeKey="jill_route_intro" fromNode="Orchestrator" toNode="Intro-Setter" style={{ top: 475, left: 140 }} label="Intro candidates" onEdge />
      <EdgePill edgeKey="jill_route_takehome" fromNode="Orchestrator" toNode="TakeHome-Sender" style={{ top: 475, left: 325 }} label="Send take-home" onEdge />
      <EdgePill edgeKey="jill_route_codereview" fromNode="Orchestrator" toNode="CodeReview-Scheduler" style={{ top: 475, left: 540 }} label="Schedule code review" onEdge />
      <EdgePill edgeKey="jill_route_pmreview" fromNode="Orchestrator" toNode="PMReview-Scheduler" style={{ top: 475, left: 745 }} label="Schedule PM review" onEdge />
      <EdgePill edgeKey="jill_route_status" fromNode="Orchestrator" toNode="Status-Reporter" style={{ top: 745, left: 110 }} label="Where are we with X?" onEdge />
      <EdgePill edgeKey="jill_route_handoff" fromNode="Orchestrator" toNode="Handoff" style={{ top: 745, left: 760 }} label="HM takes over" onEdge />

      <WorkflowNode nodeKey="start" style={{ top: 40, left: 455 }} pill>
        <div className="node-head">
          <svg className="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 22V4l14 8-14 10z" />
          </svg>{" "}
          Start
        </div>
      </WorkflowNode>

      <WorkflowNode nodeKey="jill_orchestrator" style={{ top: 180, left: 380 }} selected>
        <div className="node-head">
          <SubagentIcon />
          Orchestrator
        </div>
        <div className="node-desc">
          Reads the email thread + HM&apos;s latest reply. No external state — the thread IS the state. Picks one stage subagent.
        </div>
      </WorkflowNode>

      <WorkflowNode nodeKey="jill_intro" style={{ top: 510, left: 10 }} needsApproval>
        <div className="node-head">
          <span className="node-icon">
            <svg className="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 11.5a8.4 8.4 0 01-9 8.4 8.4 8.4 0 01-3.6-.8L3 21l1.9-5a8.5 8.5 0 1116.1-4.5z" />
            </svg>
          </span>
          Intro-Setter
        </div>
        <div className="node-desc">HM picked candidates from the shortlist. Open a fresh thread per candidate with HM + candidate + jill-diy on the To/Cc.</div>
        <div className="node-badges">
          <span className="node-badge">guarded</span>
          <span className="node-badge approval">needs approval</span>
        </div>
      </WorkflowNode>

      <WorkflowNode nodeKey="jill_takehome" style={{ top: 510, left: 280 }} needsApproval>
        <div className="node-head">
          <span className="node-icon">
            <svg className="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
            </svg>
          </span>
          TakeHome-Sender
        </div>
        <div className="node-desc">HM said &quot;send Foo take-home to X&quot;. Pulls take-home from KB, attaches it, includes HM&apos;s WhatsApp for queries.</div>
        <div className="node-badges">
          <span className="node-badge">guarded</span>
          <span className="node-badge approval">needs approval</span>
          <span className="node-badge kb">3 KB</span>
        </div>
      </WorkflowNode>

      <WorkflowNode nodeKey="jill_codereview" style={{ top: 510, left: 550 }} needsApproval>
        <div className="node-head">
          <span className="node-icon">
            <svg className="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
            </svg>
          </span>
          CodeReview-Scheduler
        </div>
        <div className="node-desc">HM said &quot;have Devon code-review X&apos;s submission&quot;. Loop in Devon, share GitHub link, propose times.</div>
        <div className="node-badges">
          <span className="node-badge">guarded</span>
          <span className="node-badge approval">needs approval</span>
        </div>
      </WorkflowNode>

      <WorkflowNode nodeKey="jill_pmreview" style={{ top: 510, left: 820 }} needsApproval>
        <div className="node-head">
          <span className="node-icon">
            <svg className="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </span>
          PMReview-Scheduler
        </div>
        <div className="node-desc">HM said &quot;loop in Mira for PM round with X&quot;. Coordinate the PM round, share context from previous rounds.</div>
        <div className="node-badges">
          <span className="node-badge">guarded</span>
          <span className="node-badge approval">needs approval</span>
        </div>
      </WorkflowNode>

      <WorkflowNode nodeKey="jill_status" style={{ top: 790, left: 10 }}>
        <div className="node-head">
          <span className="node-icon">
            <svg className="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
          </span>
          Status-Reporter
        </div>
        <div className="node-desc">HM asked &quot;where are we with Priya?&quot; or &quot;what&apos;s pending?&quot;. Reads cached threads, summarizes faithfully.</div>
        <div className="node-badges">
          <span className="node-badge">guarded</span>
          <span className="node-badge">auto-send</span>
        </div>
      </WorkflowNode>

      <WorkflowNode nodeKey="jill_handoff" style={{ top: 790, left: 820 }} needsApproval>
        <div className="node-head">
          <span className="node-icon">
            <svg className="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 17l5-5-5-5M21 12H9M4 5v14" />
            </svg>
          </span>
          Handoff
        </div>
        <div className="node-desc">HM said &quot;I&apos;ll take it from here&quot;. jill-diy posts a brief recap, removes itself from the To/Cc, archives the thread.</div>
        <div className="node-badges">
          <span className="node-badge">guarded</span>
          <span className="node-badge approval">needs approval</span>
        </div>
      </WorkflowNode>
    </div>
  );
}
