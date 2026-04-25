import type { Workflow, RenderJob, JobStatus } from "@prisma/client";
import type { FlowEdge, FlowNode } from "@/types/flow";
import { prisma } from "@/lib/prisma";

export async function createDefaultProject() {
  const email = "demo@flowmotion.ai";

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email },
  });

  return await prisma.project.upsert({
    where: { id: "flowmotion-demo-project" },
    update: {},
    create: {
      id: "flowmotion-demo-project",
      name: "FlowMotion Demo",
      userId: user.id,
    },
  });
}

export async function createProjectWithWorkflow(input: {
  userId: string;
  projectName: string;
  workflowName: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
}) {
  const user = await prisma.user.upsert({
    where: { email: `${input.userId}@flowmotion.ai` },
    update: {},
    create: { id: input.userId, email: `${input.userId}@flowmotion.ai` },
  });

  const project = await prisma.project.create({
    data: {
      userId: user.id,
      name: input.projectName,
    },
  });

  const workflow = await prisma.workflow.create({
    data: {
      projectId: project.id,
      name: input.workflowName,
      nodes: input.nodes as any,
      edges: input.edges as any,
    },
  });

  return { project, workflow };
}

export async function saveWorkflow(input: {
  workflowId?: string;
  projectId: string;
  name: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
}) {
  if (input.workflowId) {
    return await prisma.workflow.update({
      where: { id: input.workflowId },
      data: {
        name: input.name,
        nodes: input.nodes as any,
        edges: input.edges as any,
      },
    });
  }

  return await prisma.workflow.create({
    data: {
      projectId: input.projectId,
      name: input.name,
      nodes: input.nodes as any,
      edges: input.edges as any,
    },
  });
}

export async function getWorkflowById(id: string) {
  const workflow = await prisma.workflow.findUnique({
    where: { id },
  });

  if (!workflow) return null;
  return normalizeWorkflow(workflow);
}

export async function createRenderJob(workflowId: string) {
  return await prisma.renderJob.create({
    data: {
      workflowId,
      status: "pending",
    },
  });
}

export async function updateRenderJob(
  jobId: string,
  input: {
    status: JobStatus;
    outputUrl?: string | null;
    payload?: Record<string, unknown>;
    error?: string | null;
  },
) {
  return await prisma.renderJob.update({
    where: { id: jobId },
    data: {
      status: input.status,
      outputUrl: input.outputUrl,
      payload: input.payload as any,
      error: input.error,
    },
  });
}

export async function getRenderJob(jobId: string) {
  const job = await prisma.renderJob.findUnique({
    where: { id: jobId },
  });
  return job ? normalizeRenderJob(job) : null;
}

export function normalizeWorkflow(workflow: Workflow) {
  return {
    ...workflow,
    nodes: workflow.nodes as unknown as FlowNode[],
    edges: workflow.edges as unknown as FlowEdge[],
  };
}

export function normalizeRenderJob(job: RenderJob) {
  return {
    ...job,
    payload: (job.payload ?? {}) as Record<string, unknown>,
  };
}
