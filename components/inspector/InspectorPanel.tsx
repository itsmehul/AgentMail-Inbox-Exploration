"use client";

import { useWorkflowStore } from "@/stores/workflow-store";
import { EdgeInspector } from "./EdgeInspector";
import { NodeInspector } from "./NodeInspector";

export function InspectorPanel() {
  const selection = useWorkflowStore((s) => s.selection);

  return (
    <aside className="inspector">
      <div className="insp-inner" id="insp-content">
        {selection?.kind === "edge" ? (
          <EdgeInspector key={selection.key} edgeKey={selection.key} fromNode={selection.fromNode} toNode={selection.toNode} />
        ) : selection?.kind === "node" ? (
          <NodeInspector key={selection.key} nodeKey={selection.key} />
        ) : null}
      </div>
    </aside>
  );
}
