import { getWorkflowById } from "@/lib/db/workflows";
import { WorkflowHydrator } from "@/components/canvas/workflow-hydrator";
import { redirect } from "next/navigation";

export default async function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  // Note: we use workflowId in the URL for simplicity as it directly loads the workflow.
  const workflow = await getWorkflowById(projectId);

  if (!workflow) {
    redirect("/");
  }

  return <WorkflowHydrator workflow={workflow} />;
}
