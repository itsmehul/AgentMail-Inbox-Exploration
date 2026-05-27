"use client";

import { nodeDomId } from "@/lib/utils";
import { useWorkflowStore } from "@/stores/workflow-store";

interface WorkflowNodeProps {
  nodeKey: string;
  style: React.CSSProperties;
  pill?: boolean;
  needsApproval?: boolean;
  selected?: boolean;
  children: React.ReactNode;
}

export function WorkflowNode({ nodeKey, style, pill, needsApproval, selected, children }: WorkflowNodeProps) {
  const selectNode = useWorkflowStore((s) => s.selectNode);
  const selection = useWorkflowStore((s) => s.selection);
  const isSelected = selected ?? (selection?.kind === "node" && selection.key === nodeKey);

  return (
    <div
      id={nodeDomId(nodeKey)}
      className={`node ${pill ? "pill" : ""} ${needsApproval ? "needs-approval" : ""} ${isSelected ? "selected" : ""}`}
      style={style}
      onClick={() => selectNode(nodeKey)}
      onKeyDown={(e) => e.key === "Enter" && selectNode(nodeKey)}
      role="button"
      tabIndex={0}
    >
      {needsApproval && (
        <div className="node-approval-icon" title="Needs your approval before sending">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M5 12l5 5L20 7" />
          </svg>
        </div>
      )}
      {children}
    </div>
  );
}

interface EdgePillProps {
  edgeKey: string;
  fromNode: string;
  toNode: string;
  style: React.CSSProperties;
  label: string;
  onEdge?: boolean;
}

export function EdgePill({ edgeKey, fromNode, toNode, style, label, onEdge }: EdgePillProps) {
  const selectEdge = useWorkflowStore((s) => s.selectEdge);
  const selection = useWorkflowStore((s) => s.selection);
  const isSelected = selection?.kind === "edge" && selection.key === edgeKey;

  return (
    <div
      className={`edge-pill ${onEdge ? "on-edge" : ""} ${isSelected ? "selected" : ""}`}
      data-pill={edgeKey}
      style={style}
      onClick={() => selectEdge(edgeKey, fromNode, toNode)}
      onKeyDown={(e) => e.key === "Enter" && selectEdge(edgeKey, fromNode, toNode)}
      role="button"
      tabIndex={0}
    >
      <span className="arr">↳</span> <span className="lbl">{label}</span>
    </div>
  );
}

interface EdgeGroupProps {
  edgeKey?: string;
  fromNode?: string;
  toNode?: string;
  d: string;
}

export function EdgeGroup({ edgeKey, fromNode, toNode, d }: EdgeGroupProps) {
  const selectEdge = useWorkflowStore((s) => s.selectEdge);
  const selection = useWorkflowStore((s) => s.selection);
  const isSelected = edgeKey && selection?.kind === "edge" && selection.key === edgeKey;

  return (
    <g
      className={`edge-group ${isSelected ? "selected" : ""}`}
      data-edge={edgeKey}
      onClick={edgeKey && fromNode && toNode ? () => selectEdge(edgeKey, fromNode, toNode) : undefined}
      style={edgeKey ? { pointerEvents: "stroke", cursor: "pointer" } : undefined}
    >
      <path className="edge-hit" d={d} />
      <path className="edge-line" d={d} />
    </g>
  );
}
