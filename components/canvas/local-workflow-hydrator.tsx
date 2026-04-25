"use client";

import { useEffect, useMemo, useState } from "react";
import { useWorkflowStore } from "@/store/workflow-store";
import { WorkflowEditor } from "@/components/canvas/workflow-editor";
import { createNodeFromTemplate } from "@/lib/node-definitions";
import { nanoid } from "nanoid";
import type { FlowEdge, FlowNode } from "@/types/flow";

type PersistedWorkflow = {
  workflowId: string;
  projectId: string;
  workflowName: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
};

function makeStarterWorkflow(projectId: string): PersistedWorkflow {
  const starterText = createNodeFromTemplate("textPrompt", { x: 80, y: 120 });
  const starterMedia = createNodeFromTemplate("mediaUpload", { x: 80, y: 360 });
  const starterRender = createNodeFromTemplate("videoRender", { x: 480, y: 120 });

  return {
    workflowId: projectId,
    projectId,
    workflowName: "Motion Graphics Workflow",
    nodes: [starterText, starterMedia, starterRender],
    edges: [
      { id: nanoid(), source: starterText.id, target: starterRender.id },
      { id: nanoid(), source: starterMedia.id, target: starterRender.id },
    ],
  };
}

function storageKey(projectId: string) {
  return `flowmotion:workflow:${projectId}`;
}

export function LocalWorkflowHydrator({ projectId }: { projectId: string }) {
  const [hydrated, setHydrated] = useState(false);
  const [missing, setMissing] = useState(false);
  const loadWorkflow = useWorkflowStore((s) => s.loadWorkflow);

  const initial = useMemo(() => makeStarterWorkflow(projectId), [projectId]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey(projectId));
      const parsed = raw ? (JSON.parse(raw) as Partial<PersistedWorkflow>) : null;

      const workflow: PersistedWorkflow =
        parsed?.nodes && parsed?.edges
          ? {
              workflowId: parsed.workflowId || projectId,
              projectId: parsed.projectId || projectId,
              workflowName: parsed.workflowName || "Motion Graphics Workflow",
              nodes: parsed.nodes as FlowNode[],
              edges: parsed.edges as FlowEdge[],
            }
          : initial;

      // If it didn't exist yet, create it so refresh works.
      if (!raw) {
        window.localStorage.setItem(storageKey(projectId), JSON.stringify(workflow));
      }

      loadWorkflow({
        workflowId: workflow.workflowId,
        projectId: workflow.projectId,
        workflowName: workflow.workflowName,
        nodes: workflow.nodes,
        edges: workflow.edges,
      });

      setHydrated(true);
    } catch {
      setMissing(true);
      setHydrated(true);
    }
  }, [projectId, loadWorkflow, initial]);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-white/50 text-sm tracking-widest uppercase">
        Loading Canvas…
      </div>
    );
  }

  if (missing) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-white/60 text-sm">
        Unable to load this project in your browser storage.
      </div>
    );
  }

  return <WorkflowEditor />;
}

