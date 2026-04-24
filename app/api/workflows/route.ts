import { NextResponse } from "next/server";
import { saveWorkflow } from "@/lib/db/workflows";
import type { WorkflowPayload } from "@/types/flow";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as WorkflowPayload & { workflowId?: string };
    const workflow = await saveWorkflow({
      workflowId: body.id ?? body.workflowId,
      projectId: body.projectId,
      name: body.name,
      nodes: body.nodes,
      edges: body.edges,
    });

    return NextResponse.json({
      workflow,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to save workflow.",
      },
      { status: 500 },
    );
  }
}
