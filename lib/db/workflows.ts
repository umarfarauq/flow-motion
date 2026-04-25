import type { Workflow, RenderJob, JobStatus } from "@prisma/client";
import type { FlowEdge, FlowNode } from "@/types/flow";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

const memoryProjects = new Map<string, any>();
const memoryWorkflows = new Map<string, any>();
const memoryJobs = new Map<string, any>();

export async function createDefaultProject() {
  const email = "demo@flowmotion.ai";

  try {
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
  } catch (error) {
    console.warn("Database connection failed. Falling back to in-memory project.");
    const id = "flowmotion-demo-project";
    if (!memoryProjects.has(id)) {
      memoryProjects.set(id, { id, name: "FlowMotion Demo", userId: "local-user" });
    }
    return memoryProjects.get(id);
  }
}

export async function createProjectWithWorkflow(input: {
  userId: string;
  projectName: string;
  workflowName: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
}) {
  try {
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
  } catch (error) {
    console.warn("Database connection failed. Falling back to in-memory workflow creation.");
    const project = { id: nanoid(), name: input.projectName, userId: input.userId };
    const workflow = {
      id: nanoid(),
      projectId: project.id,
      name: input.workflowName,
      nodes: input.nodes,
      edges: input.edges,
    };
    memoryProjects.set(project.id, project);
    memoryWorkflows.set(workflow.id, workflow);
    return { project, workflow };
  }
}

export async function saveWorkflow(input: {
  workflowId?: string;
  projectId: string;
  name: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
}) {
  try {
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
  } catch (error) {
    const workflow = {
      id: input.workflowId || nanoid(),
      projectId: input.projectId,
      name: input.name,
      nodes: input.nodes,
      edges: input.edges,
    };
    memoryWorkflows.set(workflow.id, workflow);
    return workflow;
  }
}

export async function getWorkflowById(id: string) {
  try {
    const workflow = await prisma.workflow.findUnique({
      where: { id },
    });

    if (!workflow) return null;
    return normalizeWorkflow(workflow);
  } catch (error) {
    return memoryWorkflows.get(id) || null;
  }
}

export async function createRenderJob(workflowId: string) {
  try {
    return await prisma.renderJob.create({
      data: {
        workflowId,
        status: "pending",
      },
    });
  } catch (error) {
    const job = { id: nanoid(), workflowId, status: "pending", outputUrl: null, payload: {} };
    memoryJobs.set(job.id, job);
    return job;
  }
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
  try {
    return await prisma.renderJob.update({
      where: { id: jobId },
      data: {
        status: input.status,
        outputUrl: input.outputUrl,
        payload: input.payload as any,
        error: input.error,
      },
    });
  } catch (error) {
    const job = memoryJobs.get(jobId);
    if (job) {
      const updated = { ...job, ...input };
      memoryJobs.set(jobId, updated);
      return updated;
    }
    throw new Error(`Job ${jobId} not found in memory.`);
  }
}

export async function getRenderJob(jobId: string) {
  try {
    const job = await prisma.renderJob.findUnique({
      where: { id: jobId },
    });
    return job ? normalizeRenderJob(job) : null;
  } catch (error) {
    return memoryJobs.get(jobId) || null;
  }
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
