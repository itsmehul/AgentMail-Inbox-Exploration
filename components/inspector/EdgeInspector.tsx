"use client";

import { EDGES } from "@/lib/mock/workflow";
import { useWorkflowStore } from "@/stores/workflow-store";

function Tip({ text }: { text: string }) {
  return (
    <span className="tip">
      ?<span className="tip-bubble">{text}</span>
    </span>
  );
}

export function EdgeInspector({
  edgeKey,
  fromNode,
  toNode,
}: {
  edgeKey: string;
  fromNode: string;
  toNode: string;
}) {
  const selectNode = useWorkflowStore((s) => s.selectNode);
  const e = EDGES[edgeKey as keyof typeof EDGES];
  if (!e) return null;
  const f = e.forward;

  return (
    <>
      <div className="insp-head">
        <div className="title">
          {fromNode} <span className="arrow-sep">→</span> {toNode}
        </div>
        <div className="icons">
          <button type="button" className="btn-icon ghost" onClick={() => selectNode("jill_orchestrator")} title="Back to node">
            <svg className="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="insp-tabs">
        <div className="insp-tab active">Forward</div>
        <div className="insp-tab">Backward</div>
      </div>

      <div className="insp-section">
        <div className="insp-row">
          <span className="insp-label">
            Transition type
            <Tip text="How this edge is followed. LLM Condition = agent decides based on description." />
          </span>
        </div>
        <div className="select-box">
          <span>{f.type}</span>
        </div>
      </div>

      <div className="insp-section">
        <div className="insp-row">
          <span className="insp-label">
            Label
            <Tip text="Short name shown on the canvas pill. Keep it under 30 characters." />
          </span>
        </div>
        <input className="input" defaultValue={f.label} readOnly />
      </div>

      {f.type === "LLM Condition" ? (
        <div className="insp-section">
          <div className="insp-row">
            <span className="insp-label">
              LLM condition
              <Tip text="Plain-English description the LLM reads to decide if this edge should be taken." />
            </span>
          </div>
          <textarea className="textarea lg" defaultValue={f.condition} readOnly />
          <div className="helper-text">Write this like you&apos;re explaining the rule to a teammate.</div>
        </div>
      ) : (
        <div className="insp-section">
          <div className="insp-row">
            <span className="insp-label">
              Condition
              <Tip text="When this edge is followed." />
            </span>
          </div>
          <textarea className="textarea" defaultValue={f.condition} readOnly />
        </div>
      )}

      <div className="insp-section">
        <div className="insp-row">
          <span className="insp-label">
            Priority
            <Tip text="If multiple edges from the same node match, the lower priority number wins." />
          </span>
        </div>
        <div className="select-box">
          <span>Auto</span>
        </div>
      </div>
    </>
  );
}
