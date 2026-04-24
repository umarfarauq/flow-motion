import { NextResponse } from "next/server";
import { createRenderJob, saveWorkflow, updateRenderJob } from "@/lib/db/workflows";
import { executeWorkflowGraph } from "@/lib/workflow/execution";
import { getExecutionQueue } from "@/lib/queue";
import type { WorkflowPayload } from "@/types/flow";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as WorkflowPayload & { workflowId?: string; apiKey?: string };

    const workflow = await saveWorkflow({
      workflowId: body.id ?? body.workflowId,
      projectId: body.projectId,
      name: body.name,
      nodes: body.nodes,
      edges: body.edges,
    });

    const job = await createRenderJob(workflow.id);
    await updateRenderJob(job.id, { status: "processing" });

    const result = await executeWorkflowGraph({
      jobId: job.id,
      nodes: body.nodes,
      edges: body.edges,
      apiKey: body.apiKey,
    });

    await updateRenderJob(job.id, {
      status: result.status,
      outputUrl: result.outputUrl,
      payload: {
        executionOrder: result.executionOrder,
        outputs: result.outputs,
      },
    });

    return NextResponse.json({ workflow, result });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Workflow execution failed.",
      },
      { status: 500 },
    );
  }
}
