import type { Edge, Node } from "reactflow";

export type NodeKind =
  | "linkInput"
  | "textPrompt"
  | "mediaUpload"
  | "contentExtractor"
  | "sceneGenerator"
  | "animationStyle"
  | "videoRender";

export type FlowNodeData = {
  label: string;
  description: string;
  category: "input" | "processing" | "output";
  fields?: Array<{
    key: string;
    label: string;
    placeholder?: string;
    multiline?: boolean;
  }>;
  values?: Record<string, string>;
  status?: "idle" | "ready" | "running" | "success" | "error";
  output?: unknown;
};

export type FlowNode = Node<FlowNodeData> & {
  type: NodeKind;
};

export type FlowEdge = Edge;

export type WorkflowPayload = {
  id?: string;
  projectId: string;
  name: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
};

export type WorkflowExecutionResult = {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  executionOrder: string[];
  outputs: Record<string, unknown>;
  outputUrl?: string | null;
  error?: string | null;
};

export type ExecutableNodeContext = {
  input: unknown[];
  node: FlowNode;
  upstream: Array<{
    sourceId: string;
    output: unknown;
  }>;
};
