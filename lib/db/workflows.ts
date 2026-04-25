import type { FlowEdge, FlowNode } from "@/types/flow";
import { nanoid } from "nanoid";
import { promises as fs } from "node:fs";
import path from "node:path";

export type JobStatus = "pending" | "processing" | "completed" | "failed";

export type WorkflowRecord = {
  id: string;
  projectId: string;
  name: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  createdAt: string;
  updatedAt: string;
};

export type ProjectRecord = {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type RenderJobRecord = {
  id: string;
  workflowId: string;
  status: JobStatus;
  outputUrl?: string | null;
  payload?: Record<string, unknown>;
  error?: string | null;
  createdAt: string;
  updatedAt: string;
};

function nowIso() {
  return new Date().toISOString();
}

type StoreShape = {
  projects: Record<string, ProjectRecord>;
  workflows: Record<string, WorkflowRecord>;
  renderJobs: Record<string, RenderJobRecord>;
};

type StorePaths = { dir: string; file: string };

let cachedStorePaths: StorePaths | null = null;

async function resolveStorePaths(): Promise<StorePaths> {
  if (cachedStorePaths) return cachedStorePaths;

  const preferredDir = process.env.FLOWMOTION_DATA_DIR
    ? path.resolve(process.env.FLOWMOTION_DATA_DIR)
    : process.env.NODE_ENV === "production"
      ? path.join("/tmp", "flowmotion-data")
      : path.join(process.cwd(), "data");

  const preferred: StorePaths = { dir: preferredDir, file: path.join(preferredDir, "store.json") };

  // On many serverless platforms the function bundle path is read-only (e.g. `/var/task`).
  // If we cannot create the directory, fall back to `/tmp`.
  try {
    await fs.mkdir(preferred.dir, { recursive: true });
    cachedStorePaths = preferred;
    return cachedStorePaths;
  } catch {
    const tmpDir = path.join("/tmp", "flowmotion-data");
    cachedStorePaths = { dir: tmpDir, file: path.join(tmpDir, "store.json") };
    await fs.mkdir(cachedStorePaths.dir, { recursive: true });
    return cachedStorePaths;
  }
}

async function ensureStore() {
  const paths = await resolveStorePaths();
  try {
    await fs.mkdir(paths.dir, { recursive: true });
  } catch {
    // If a bad cached path slipped through (e.g. read-only bundle dir), recover to /tmp.
    cachedStorePaths = { dir: path.join("/tmp", "flowmotion-data"), file: path.join("/tmp", "flowmotion-data", "store.json") };
    await fs.mkdir(cachedStorePaths.dir, { recursive: true });
  }
  try {
    const active = await resolveStorePaths();
    await fs.access(active.file);
  } catch {
    const initial: StoreShape = { projects: {}, workflows: {}, renderJobs: {} };
    const active = await resolveStorePaths();
    await fs.writeFile(active.file, JSON.stringify(initial, null, 2), "utf8");
  }
}

async function readStore(): Promise<StoreShape> {
  await ensureStore();
  const paths = await resolveStorePaths();
  const raw = await fs.readFile(paths.file, "utf8");
  const parsed = JSON.parse(raw) as Partial<StoreShape>;
  return {
    projects: parsed.projects ?? {},
    workflows: parsed.workflows ?? {},
    renderJobs: parsed.renderJobs ?? {},
  };
}

async function writeStore(next: StoreShape) {
  await ensureStore();
  const paths = await resolveStorePaths();
  const tmp = `${paths.file}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(next, null, 2), "utf8");
  await fs.rename(tmp, paths.file);
}

export async function createDefaultProject() {
  const projectId = "flowmotion-demo-project";
  const ts = nowIso();
  const store = await readStore();

  const existing = store.projects[projectId];
  if (existing) return existing;

  const project: ProjectRecord = {
    id: projectId,
    userId: "demo@flowmotion.ai",
    name: "FlowMotion Demo",
    createdAt: ts,
    updatedAt: ts,
  };

  store.projects[projectId] = project;
  await writeStore(store);
  return project;
}

export async function createProjectWithWorkflow(input: {
  userId: string;
  projectName: string;
  workflowName: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
}) {
  const ts = nowIso();
  const store = await readStore();

  const projectId = nanoid();
  const workflowId = nanoid();

  const project: ProjectRecord = {
    id: projectId,
    userId: input.userId,
    name: input.projectName,
    createdAt: ts,
    updatedAt: ts,
  };

  const workflow: WorkflowRecord = {
    id: workflowId,
    projectId,
    name: input.workflowName,
    nodes: input.nodes,
    edges: input.edges,
    createdAt: ts,
    updatedAt: ts,
  };

  store.projects[projectId] = project;
  store.workflows[workflowId] = workflow;
  await writeStore(store);

  return { project, workflow };
}

export async function saveWorkflow(input: {
  workflowId?: string;
  projectId: string;
  name: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
}) {
  const ts = nowIso();
  const store = await readStore();

  if (input.workflowId) {
    const existing = store.workflows[input.workflowId];
    const next: WorkflowRecord = {
      id: input.workflowId,
      projectId: input.projectId,
      name: input.name,
      nodes: input.nodes,
      edges: input.edges,
      createdAt: existing?.createdAt ?? ts,
      updatedAt: ts,
    };
    store.workflows[input.workflowId] = next;
    await writeStore(store);
    return next;
  }

  const workflowId = nanoid();
  const workflow: WorkflowRecord = {
    id: workflowId,
    projectId: input.projectId,
    name: input.name,
    nodes: input.nodes,
    edges: input.edges,
    createdAt: ts,
    updatedAt: ts,
  };

  store.workflows[workflowId] = workflow;
  await writeStore(store);
  return workflow;
}

export async function getWorkflowById(id: string) {
  const store = await readStore();
  return store.workflows[id] ?? null;
}

export async function createRenderJob(workflowId: string) {
  const ts = nowIso();
  const store = await readStore();
  const jobId = nanoid();
  const job: RenderJobRecord = {
    id: jobId,
    workflowId,
    status: "pending",
    createdAt: ts,
    updatedAt: ts,
  };

  store.renderJobs[jobId] = job;
  await writeStore(store);
  return job;
}

export async function getProjectById(projectId: string) {
  const store = await readStore();
  return store.projects[projectId] ?? null;
}

export async function updateProjectName(projectId: string, name: string) {
  const store = await readStore();
  const existing = store.projects[projectId];
  if (!existing) {
    const ts = nowIso();
    const created: ProjectRecord = {
      id: projectId,
      userId: "local-user",
      name,
      createdAt: ts,
      updatedAt: ts,
    };
    store.projects[projectId] = created;
    await writeStore(store);
    return created;
  }

  const next: ProjectRecord = { ...existing, name, updatedAt: nowIso() };
  store.projects[projectId] = next;
  await writeStore(store);
  return next;
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
  const store = await readStore();
  const existing = store.renderJobs[jobId];
  const ts = nowIso();
  const next: RenderJobRecord = {
    id: jobId,
    workflowId: existing?.workflowId ?? "unknown",
    status: input.status,
    outputUrl: input.outputUrl ?? null,
    payload: input.payload ?? existing?.payload ?? {},
    error: input.error ?? null,
    createdAt: existing?.createdAt ?? ts,
    updatedAt: ts,
  };
  store.renderJobs[jobId] = next;
  await writeStore(store);
  return next;
}

export async function getRenderJob(jobId: string) {
  const store = await readStore();
  const job = store.renderJobs[jobId];
  if (!job) return null;
  return { ...job, payload: job.payload ?? {} };
}
