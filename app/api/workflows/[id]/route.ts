import { NextResponse } from "next/server";
import { getWorkflowById } from "@/lib/db/workflows";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const workflow = await getWorkflowById(id);

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found." }, { status: 404 });
    }

    return NextResponse.json({ workflow });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to fetch workflow." },
      { status: 500 },
    );
  }
}
