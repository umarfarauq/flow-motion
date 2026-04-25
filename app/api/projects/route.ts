import { NextResponse } from "next/server";
import { createProjectWithWorkflow } from "@/lib/db/workflows";
import { createNodeFromTemplate } from "@/lib/node-definitions";
import { nanoid } from "nanoid";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, mode } = body;

    if (!prompt && mode !== "canvas") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const starterText = createNodeFromTemplate("textPrompt", { x: 80, y: 120 });
    starterText.data.values = { prompt: prompt || "" };

    const starterMedia = createNodeFromTemplate("mediaUpload", { x: 80, y: 360 });
    const starterRender = createNodeFromTemplate("videoRender", { x: 480, y: 120 });

    const nodes = [starterText, starterMedia, starterRender];
    const edges = [
      { id: nanoid(), source: starterText.id, target: starterRender.id },
      { id: nanoid(), source: starterMedia.id, target: starterRender.id },
    ];

    // Assuming a single standard user for the SaaS platform for now, 
    // since auth isn't fully implemented yet.
    const { project, workflow } = await createProjectWithWorkflow({
      userId: "local-user",
      projectName: "New Motion Project",
      workflowName: "Default Workflow",
      nodes,
      edges,
    });

    return NextResponse.json({ projectId: project.id, workflowId: workflow.id });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create project." },
      { status: 500 }
    );
  }
}
