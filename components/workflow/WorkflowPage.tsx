"use client";

import { useAgentStore } from "@/stores/agent-store";
import { JackCanvas } from "./JackCanvas";
import { JillCanvas } from "./JillCanvas";
import { WorkflowToolbar } from "./WorkflowToolbar";

export function WorkflowPage() {
  const currentAgent = useAgentStore((s) => s.currentAgent);

  return (
    <main className="canvas-area page active" id="page-workflow">
      <WorkflowToolbar />
      <div className="canvas">
        {currentAgent === "jack" ? <JackCanvas /> : <JillCanvas />}
      </div>
    </main>
  );
}
