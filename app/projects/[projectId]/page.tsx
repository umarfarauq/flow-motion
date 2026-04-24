import { WorkflowEditor } from "@/components/canvas/workflow-editor";
import { createDefaultProject } from "@/lib/db/workflows";

export default async function ProjectCanvasPage() {
  await createDefaultProject();
  return <WorkflowEditor />;
}
