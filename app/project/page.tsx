import { LocalWorkflowHydrator } from "@/components/canvas/local-workflow-hydrator";
import { redirect } from "next/navigation";

export default async function ProjectQueryPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project } = await searchParams;
  const projectId = (project || "").trim();

  if (!projectId) {
    redirect("/");
  }

  return <LocalWorkflowHydrator projectId={projectId} />;
}

