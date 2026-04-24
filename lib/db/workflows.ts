import type { Workflow, RenderJob, JobStatus } from "@prisma/client";
import type { FlowEdge, FlowNode } from "@/types/flow";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

const memoryProjects = new Map<
  string,
  {
    id: string;
    userId: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  }
>();
const memoryWorkflows = new Map<
  string,
  {
    id: string;
    projectId: string;
    name: string;
    nodes: FlowNode[];
    edges: FlowEdge[];
    createdAt: Date;
    updatedAt: Date;
  }
>();
const memoryJobs = new Map<
  string,
  {
    id: string;
    workflowId: string;
    status: JobStatus;
    outputUrl: string | null;
    payload: Record<string, unknown>;
    error: string | null;
    createdAt: Date;
    updatedAt: Date;
  }
>();

export async function createDefaultProject() {
  const email = "demo@flowmotion.ai";

  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email },
    });

    return prisma.project.upsert({
      where: { id: "flowmotion-demo-project" },
      update: {},
      create: {
        id: "flowmotion-demo-project",
        name: "FlowMotion Demo",
        userId: user.id,
      },
    });
  } catch {
    const existing = memoryProjects.get("flowmotion-demo-project");
    if (existing) {
      return existing;
    }

    const project = {
      id: "flowmotion-demo-project",
      userId: "local-user",
      name: "FlowMotion Demo",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryProjects.set(project.id, project);
    return project;
  }
}

export async function saveWorkflow(input: {
  workflowId?: string;
  projectId: string;
  name: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
}) {
  if (input.workflowId) {
    try {
      return await prisma.workflow.update({
        where: { id: input.workflowId },
        data: {
          name: input.name,
          nodes: input.nodes as any,
          edges: input.edges as any,
        },
      });
    } catch {
      const existing = memoryWorkflows.get(input.workflowId);
      if (existing) {
        const updated = {
          ...existing,
          name: input.name,
          nodes: input.nodes,
          edges: input.edges,
          updatedAt: new Date(),
        };
        memoryWorkflows.set(updated.id, updated);
        return updated;
      }
    }
  }

  try {
    return await prisma.workflow.create({
      data: {
        projectId: input.projectId,
        name: input.name,
        nodes: input.nodes as any,
        edges: input.edges as any,
      },
    });
  } catch {
    const workflow = {
      id: input.workflowId ?? nanoid(),
      projectId: input.projectId,
      name: input.name,
      nodes: input.nodes,
      edges: input.edges,
      createdAt: new Date(),
      updatedAt: new Date(),
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

    if (!workflow) {
      return null;
    }

    return normalizeWorkflow(workflow);
  } catch {
    return memoryWorkflows.get(id) ?? null;
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
  } catch {
    const job = {
      id: nanoid(),
      workflowId,
      status: "pending" as JobStatus,
      outputUrl: null,
      payload: {},
      error: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
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
  } catch {
    const existing = memoryJobs.get(jobId);
    if (!existing) {
      throw new Error(`Render job ${jobId} not found.`);
    }

    const updated = {
      ...existing,
      status: input.status,
      outputUrl: input.outputUrl ?? existing.outputUrl,
      payload: input.payload ?? existing.payload,
      error: input.error ?? existing.error,
      updatedAt: new Date(),
    };
    memoryJobs.set(jobId, updated);
    return updated;
  }
}

export async function getRenderJob(jobId: string) {
  try {
    const job = await prisma.renderJob.findUnique({
      where: { id: jobId },
    });

    return job ? normalizeRenderJob(job) : null;
  } catch {
    return memoryJobs.get(jobId) ?? null;
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
