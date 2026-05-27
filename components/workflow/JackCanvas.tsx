"use client";

import { EdgeGroup, EdgePill, WorkflowNode } from "./WorkflowNode";

const SubagentIcon = () => (
  <span className="node-icon">
    <svg className="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="3" />
      <path d="M5 20c0-3 3-5 7-5s7 2 7 5" />
    </svg>
  </span>
);

export function JackCanvas() {
  return (
    <div className="canvas-inner agent-canvas" data-agent="jack">
      <svg className="edges-svg" viewBox="0 0 1000 1200" preserveAspectRatio="none">
        <EdgeGroup d="M 500 90 L 500 170" />
        <EdgeGroup edgeKey="route_intake" fromNode="Orchestrator" toNode="Jack-Intake" d="M 425 320 Q 200 400 130 500" />
        <EdgeGroup edgeKey="route_status" fromNode="Orchestrator" toNode="Jack-Updater" d="M 455 320 Q 320 400 310 500" />
        <EdgeGroup edgeKey="route_coach" fromNode="Orchestrator" toNode="Jack-Coach" d="M 500 320 L 500 500" />
        <EdgeGroup edgeKey="route_schedule" fromNode="Orchestrator" toNode="Jack-Scheduler" d="M 545 320 Q 680 400 690 500" />
        <EdgeGroup edgeKey="route_negotiate" fromNode="Orchestrator" toNode="Jack-Negotiator" d="M 575 320 Q 800 400 870 500" />
        <EdgeGroup d="M 130 650 Q 280 740 480 870" />
        <EdgeGroup d="M 310 650 Q 380 740 490 870" />
        <EdgeGroup d="M 500 650 L 500 870" />
        <EdgeGroup d="M 690 650 Q 620 740 510 870" />
        <EdgeGroup d="M 870 650 Q 700 740 520 870" />
      </svg>

      <EdgePill edgeKey="webhook" fromNode="Start" toNode="Orchestrator" style={{ top: 122, left: 430 }} label="New email received" />
      <EdgePill edgeKey="route_intake" fromNode="Orchestrator" toNode="Jack-Intake" style={{ top: 402, left: 60 }} label="New candidate or resume" />
      <EdgePill edgeKey="route_status" fromNode="Orchestrator" toNode="Jack-Updater" style={{ top: 402, left: 240 }} label="Asking about status" />
      <EdgePill edgeKey="route_coach" fromNode="Orchestrator" toNode="Jack-Coach" style={{ top: 402, left: 430 }} label="Interview prep" />
      <EdgePill edgeKey="route_schedule" fromNode="Orchestrator" toNode="Jack-Scheduler" style={{ top: 402, left: 610 }} label="Scheduling" />
      <EdgePill edgeKey="route_negotiate" fromNode="Orchestrator" toNode="Jack-Negotiator" style={{ top: 402, left: 800 }} label="Offer or negotiation" />

      <WorkflowNode nodeKey="start" style={{ top: 40, left: 455 }} pill>
        <div className="node-head">
          <svg className="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 22V4l14 8-14 10z" />
          </svg>{" "}
          Start
        </div>
      </WorkflowNode>

      <WorkflowNode nodeKey="orchestrator" style={{ top: 180, left: 380 }}>
        <div className="node-head">
          <SubagentIcon />
          Orchestrator
        </div>
        <div className="node-desc">Fetch full thread from cache. Classify intent. Call exactly one routing tool below — never write a reply directly.</div>
      </WorkflowNode>

      <WorkflowNode nodeKey="intake" style={{ top: 510, left: 10 }}>
        <div className="node-head">
          <SubagentIcon />
          Jack-Intake
        </div>
        <div className="node-desc">Parse resume, build candidate profile, ask any missing onboarding questions.</div>
        <div className="node-badges">
          <span className="node-badge">guarded</span>
          <span className="node-badge">auto-send</span>
        </div>
      </WorkflowNode>

      <WorkflowNode nodeKey="updater" style={{ top: 510, left: 200 }}>
        <div className="node-head">
          <SubagentIcon />
          Jack-Updater
        </div>
        <div className="node-desc">Read application stage from ATS, summarize truthfully — never invent progress.</div>
        <div className="node-badges">
          <span className="node-badge">guarded</span>
          <span className="node-badge">auto-send</span>
        </div>
      </WorkflowNode>

      <WorkflowNode nodeKey="coach" style={{ top: 510, left: 390 }}>
        <div className="node-head">
          <SubagentIcon />
          Jack-Coach
        </div>
        <div className="node-desc">Interview prep, resume tweaks, practice questions, behavioural coaching.</div>
        <div className="node-badges">
          <span className="node-badge">guarded</span>
          <span className="node-badge">auto-send</span>
        </div>
      </WorkflowNode>

      <WorkflowNode nodeKey="scheduler" style={{ top: 510, left: 580 }}>
        <div className="node-head">
          <SubagentIcon />
          Jack-Scheduler
        </div>
        <div className="node-desc">Propose slots in candidate&apos;s timezone, confirm interview times via calendar.</div>
        <div className="node-badges">
          <span className="node-badge">guarded</span>
          <span className="node-badge">auto-send</span>
        </div>
      </WorkflowNode>

      <WorkflowNode nodeKey="negotiator" style={{ top: 510, left: 770 }}>
        <div className="node-head">
          <SubagentIcon />
          Jack-Negotiator
        </div>
        <div className="node-desc">Offer review, comp / equity questions, draft counter-offers.</div>
        <div className="node-badges">
          <span className="node-badge">guarded</span>
          <span className="node-badge danger">human approval</span>
        </div>
      </WorkflowNode>

      <WorkflowNode nodeKey="end" style={{ top: 900, left: 460 }} pill>
        <div className="node-head">
          <svg className="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 2L2 22M22 22L2 2" />
          </svg>{" "}
          End
        </div>
      </WorkflowNode>
    </div>
  );
}
