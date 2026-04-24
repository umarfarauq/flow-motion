import type { Edge } from "reactflow";
import type { FlowNode, WorkflowExecutionResult } from "@/types/flow";
import { invariant } from "@/lib/utils";
import { renderWorkflowVideo } from "@/lib/remotion/render-video";
import { nodeExecutors } from "@/lib/workflow/node-registry";

export function validateWorkflow(nodes: FlowNode[], edges: Edge[]) {
  const nodeIds = new Set(nodes.map((node) => node.id));
  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      throw new Error(`Invalid edge ${edge.id}: missing source or target node.`);
    }
  }
}

export function topologicalSort(nodes: FlowNode[], edges: Edge[]) {
  validateWorkflow(nodes, edges);

  const incoming = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const node of nodes) {
    incoming.set(node.id, 0);
    adjacency.set(node.id, []);
  }

  for (const edge of edges) {
    incoming.set(edge.target, (incoming.get(edge.target) ?? 0) + 1);
    adjacency.get(edge.source)?.push(edge.target);
  }

  const queue = nodes.filter((node) => (incoming.get(node.id) ?? 0) === 0).map((node) => node.id);
  const ordered: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }

    ordered.push(current);

    for (const next of adjacency.get(current) ?? []) {
      const nextIncoming = (incoming.get(next) ?? 0) - 1;
      incoming.set(next, nextIncoming);

      if (nextIncoming === 0) {
        queue.push(next);
      }
    }
  }

  if (ordered.length !== nodes.length) {
    throw new Error("Workflow graph contains a cycle.");
  }

  return ordered;
}

export async function executeWorkflowGraph(args: {
  jobId: string;
  nodes: FlowNode[];
  edges: Edge[];
  apiKey?: string;
}): Promise<WorkflowExecutionResult> {
  const executionOrder = topologicalSort(args.nodes, args.edges);
  const outputs = new Map<string, unknown>();
  const nodeById = new Map(args.nodes.map((node) => [node.id, node]));

  for (const nodeId of executionOrder) {
    const node = nodeById.get(nodeId);
    invariant(node, `Node ${nodeId} missing during execution.`);
    const upstream = args.edges
      .filter((edge) => edge.target === node.id)
      .map((edge) => ({
        sourceId: edge.source,
        output: outputs.get(edge.source),
      }));

    const execute = nodeExecutors[node.type];
    invariant(execute, `No executor registered for node type ${node.type}.`);
    const result = await execute({
      node,
      input: upstream.map((item) => item.output),
      upstream,
    });
    outputs.set(node.id, result);
  }

  const renderOutput = args.nodes
    .filter((node) => node.type === "videoRender")
    .map((node) => outputs.get(node.id))
    .at(-1) as Record<string, unknown> | undefined;

  const outputUrl =
    renderOutput && typeof renderOutput === "object"
      ? (
          await renderWorkflowVideo({
            jobId: args.jobId,
            payload: renderOutput,
            apiKey: args.apiKey,
          })
        ).outputUrl
      : null;

  return {
    jobId: args.jobId,
    status: "completed",
    executionOrder,
    outputs: Object.fromEntries(outputs.entries()),
    outputUrl,
  };
}
