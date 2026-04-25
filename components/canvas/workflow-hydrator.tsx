"use client";

import { useEffect, useState } from "react";
import { useWorkflowStore } from "@/store/workflow-store";
import { WorkflowEditor } from "@/components/canvas/workflow-editor";
import type { FlowNode, FlowEdge } from "@/types/flow";

export function WorkflowHydrator({
  workflow,
}: {
  workflow: {
    id: string;
    projectId: string;
    name: string;
    nodes: FlowNode[];
    edges: FlowEdge[];
  };
}) {
  const [hydrated, setHydrated] = useState(false);
  const loadWorkflow = useWorkflowStore((state) => state.loadWorkflow);

  useEffect(() => {
    loadWorkflow({
      workflowId: workflow.id,
      projectId: workflow.projectId,
      workflowName: workflow.name,
      nodes: workflow.nodes,
      edges: workflow.edges,
    });
    setHydrated(true);
  }, [workflow, loadWorkflow]);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-white/50 text-sm tracking-widest uppercase">
        Loading Workflow...
      </div>
    );
  }

  return <WorkflowEditor />;
}
