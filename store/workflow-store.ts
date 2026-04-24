"use client";

import { create } from "zustand";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from "reactflow";
import { createNodeFromTemplate, NODE_TEMPLATES } from "@/lib/node-definitions";
import type { FlowEdge, FlowNode, NodeKind } from "@/types/flow";
import { nanoid } from "nanoid";

const starterText = createNodeFromTemplate("textPrompt", { x: 80, y: 120 });
starterText.data.values = {
  prompt: "Create a clean monochrome product teaser for FlowMotion AI with typographic transitions and modular frame movement.",
};

const starterMedia = createNodeFromTemplate("mediaUpload", { x: 80, y: 360 });
const starterRender = createNodeFromTemplate("videoRender", { x: 480, y: 120 });

type WorkflowStore = {
  workflowId?: string;
  projectId: string;
  workflowName: string;
  geminiApiKey: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  activeNodeId?: string;
  isSaving: boolean;
  isExecuting: boolean;
  lastJobId?: string;
  lastOutputUrl?: string | null;
  setActiveNode: (nodeId?: string) => void;
  setWorkflowMeta: (input: { workflowId?: string; projectId?: string; workflowName?: string }) => void;
  setGeminiApiKey: (value: string) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (type: NodeKind) => void;
  deleteNode: (nodeId: string) => void;
  duplicateNode: (nodeId: string) => void;
  updateNodeField: (nodeId: string, key: string, value: string) => void;
  loadWorkflow: (input: { workflowId?: string; projectId: string; workflowName: string; nodes: FlowNode[]; edges: FlowEdge[] }) => void;
  setSaving: (value: boolean) => void;
  setExecuting: (value: boolean) => void;
  setExecutionResult: (input: { jobId?: string; outputUrl?: string | null }) => void;
};

export const useWorkflowStore = create<WorkflowStore>((set) => ({
  projectId: "flowmotion-demo-project",
  workflowName: "Launch Motion Workflow",
  geminiApiKey: "",
  nodes: [starterText, starterMedia, starterRender],
  edges: [
    { id: nanoid(), source: starterText.id, target: starterRender.id },
    { id: nanoid(), source: starterMedia.id, target: starterRender.id },
  ],
  isSaving: false,
  isExecuting: false,
  setActiveNode: (nodeId) => set({ activeNodeId: nodeId }),
  setGeminiApiKey: (value) => set({ geminiApiKey: value }),
  setWorkflowMeta: (input) =>
    set((state) => ({
      workflowId: input.workflowId ?? state.workflowId,
      projectId: input.projectId ?? state.projectId,
      workflowName: input.workflowName ?? state.workflowName,
    })),
  onNodesChange: (changes) =>
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes) as FlowNode[],
    })),
  onEdgesChange: (changes) =>
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    })),
  onConnect: (connection) =>
    set((state) => ({
      edges: addEdge(
        {
          ...connection,
          id: nanoid(),
          animated: false,
          style: { stroke: "#000000", strokeWidth: 1 },
        },
        state.edges,
      ),
    })),
  addNode: (type) =>
    set((state) => {
      const offset = state.nodes.length * 28;
      const node = createNodeFromTemplate(type, { x: 120 + offset, y: 220 + offset / 2 });
      return { nodes: [...state.nodes, node] };
    }),
  deleteNode: (nodeId) =>
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== nodeId),
      edges: state.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
      activeNodeId: state.activeNodeId === nodeId ? undefined : state.activeNodeId,
    })),
  duplicateNode: (nodeId) =>
    set((state) => {
      const original = state.nodes.find((node) => node.id === nodeId);
      if (!original) {
        return state;
      }

      const duplicate: FlowNode = {
        ...original,
        id: nanoid(),
        position: {
          x: original.position.x + 40,
          y: original.position.y + 40,
        },
        data: {
          ...original.data,
          values: { ...(original.data.values ?? {}) },
        },
      };

      return { nodes: [...state.nodes, duplicate] };
    }),
  updateNodeField: (nodeId, key, value) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                values: {
                  ...(node.data.values ?? {}),
                  [key]: value,
                },
                status: "ready",
              },
            }
          : node,
      ),
    })),
  loadWorkflow: (input) =>
    set({
      workflowId: input.workflowId,
      projectId: input.projectId,
      workflowName: input.workflowName,
      nodes: input.nodes,
      edges: input.edges,
    }),
  setSaving: (value) => set({ isSaving: value }),
  setExecuting: (value) => set({ isExecuting: value }),
  setExecutionResult: (input) =>
    set({
      lastJobId: input.jobId,
      lastOutputUrl: input.outputUrl,
      isExecuting: false,
    }),
}));

export { NODE_TEMPLATES };
