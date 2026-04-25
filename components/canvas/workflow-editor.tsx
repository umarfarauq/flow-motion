"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  MarkerType,
  ReactFlowProvider,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import "@reactflow/node-resizer/dist/style.css";
import { Button } from "@/components/ui/button";
import { FlowNodeCard } from "@/components/canvas/flow-node-card";
import { NODE_TEMPLATES, useWorkflowStore } from "@/store/workflow-store";

const IconType = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7" /><line x1="9" x2="15" y1="20" y2="20" /><line x1="12" x2="12" y1="4" y2="20" /></svg>;
const IconImage = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>;
const IconVideo = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z" /><rect width="14" height="12" x="2" y="6" rx="2" ry="2" /></svg>;
const IconChevronLeft = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>;
const IconChevronRight = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>;
const IconSave = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>;
const IconPlay = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>;

function getTemplateIcon(type: string) {
  if (type === 'textPrompt') return <IconType />;
  if (type === 'mediaUpload') return <IconImage />;
  if (type === 'videoRender') return <IconVideo />;
  return <div className="h-3 w-3 rounded-full bg-amber-300" />;
}

const nodeTypes = {
  textPrompt: FlowNodeCard,
  mediaUpload: FlowNodeCard,
  videoRender: FlowNodeCard,
};

function WorkflowEditorInner() {
  const { fitView } = useReactFlow();
  const [message, setMessage] = useState("Canvas ready.");
  const [isPending, startTransition] = useTransition();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [projectName, setProjectName] = useState<string>("");
  const [isSavingProjectName, setIsSavingProjectName] = useState(false);

  const {
    workflowId,
    projectId,
    workflowName,
    geminiApiKey,
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    isExecuting,
    setSaving,
    setExecuting,
    setExecutionResult,
    lastJobId,
    lastOutputUrl,
    setGeminiApiKey,
  } = useWorkflowStore();

  const styledEdges = edges.map((edge, index) => ({
    ...edge,
    animated: false,
    type: "default",
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 18,
      height: 18,
      color: index % 2 === 0 ? "#f5b544" : "#38bdf8",
    },
    style: {
      stroke: index % 2 === 0 ? "#f5b544" : "#38bdf8",
      strokeWidth: 2.5,
      strokeLinecap: "round" as const,
    },
  }));

  useEffect(() => {
    const frame = requestAnimationFrame(() => fitView({ padding: 0.16, duration: 400 }));
    return () => cancelAnimationFrame(frame);
  }, [fitView]);

  useEffect(() => {
    const savedKey = window.localStorage.getItem("flowmotion-gemini-api-key");
    if (savedKey) {
      setGeminiApiKey(savedKey);
    }
  }, [setGeminiApiKey]);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;

    async function loadProject() {
      try {
        const res = await fetch(`/api/projects/${projectId}`, { cache: "no-store" });
        const payload = await res.json();
        if (!res.ok || cancelled) return;
        setProjectName(payload.project?.name ?? "");
      } catch {
        // ignore
      }
    }

    void loadProject();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  async function saveProjectName(nextName: string) {
    if (!projectId) return;
    const name = nextName.trim();
    if (!name) return;
    setIsSavingProjectName(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error || "Unable to update project name.");
      }
      setProjectName(payload.project?.name ?? name);
      setMessage("Project name updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update project name.");
    } finally {
      setIsSavingProjectName(false);
    }
  }

  useEffect(() => {
    if (!lastJobId) {
      return;
    }

    let cancelled = false;

    async function pollJob() {
      const response = await fetch(`/api/jobs/${lastJobId}`, { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok || cancelled) {
        return;
      }

      if (payload.job.status === "completed") {
        setExecutionResult({
          jobId: lastJobId,
          outputUrl: payload.job.outputUrl,
        });
        setMessage("Render complete.");
        return;
      }

      if (payload.job.status === "failed") {
        setExecuting(false);
        setMessage(payload.job.error || "Render failed.");
        return;
      }

      setTimeout(() => {
        void pollJob();
      }, 1500);
    }

    void pollJob();

    return () => {
      cancelled = true;
    };
  }, [lastJobId, setExecutionResult, setExecuting]);

  async function saveWorkflow() {
    setSaving(true);
    setMessage("Saving workflow...");

    try {
      const response = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowId,
          projectId,
          name: workflowName,
          nodes,
          edges,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Failed to save workflow.");
      }

      useWorkflowStore.getState().setWorkflowMeta({
        workflowId: payload.workflow.id,
        projectId,
        workflowName,
      });
      setMessage("Workflow saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save workflow.");
    } finally {
      setSaving(false);
    }
  }

  async function executeWorkflow() {
    setExecuting(true);
    setMessage("Executing workflow...");

    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowId,
          projectId,
          name: workflowName,
          nodes,
          edges,
          apiKey: geminiApiKey,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Execution failed.");
      }

      setExecutionResult({
        jobId: payload.result.jobId,
        outputUrl: payload.result.outputUrl,
      });

      setMessage(
        payload.result.status === "pending"
          ? "Queued for processing..."
          : payload.result.outputUrl
            ? "Video ready."
            : "Workflow executed.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Execution failed.");
      setExecuting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(82,35,126,0.38),_transparent_34%),linear-gradient(135deg,_#251537_0%,_#17171b_52%,_#111214_100%)] text-white">
      <div className={`grid min-h-screen gap-0 transition-[grid-template-columns] duration-300 ${isSidebarCollapsed ? "grid-cols-[80px_1fr]" : "grid-cols-[320px_1fr]"}`}>
        <aside className="border-r border-white/10 bg-black/[0.12] backdrop-blur-xl flex flex-col h-full overflow-hidden relative">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute top-4 right-4 z-10 p-1.5 rounded-md hover:bg-white/10 text-white/50 hover:text-white transition"
          >
            {isSidebarCollapsed ? <IconChevronRight /> : <IconChevronLeft />}
          </button>

          {!isSidebarCollapsed && (
            <div className="border-b border-white/10 p-7 pr-12 shrink-0">
              <div className="text-[11px] uppercase tracking-[0.32em] text-white/[0.55]">FlowMotion AI</div>
              {/* <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.03em]">
                Build cinematic AI video workflows
              </h1> */}
              {/* <p className="mt-3 max-w-xs text-sm leading-6 text-white/[0.65]">
                Prompt, guide, and render in one canvas. Your generated video appears in the video render node as soon as it is ready.
              </p> */}
            </div>
          )}

          <div className={`flex-1 overflow-y-auto ${isSidebarCollapsed ? "p-4 space-y-6 mt-12" : "p-6 space-y-6"}`}>
            {!isSidebarCollapsed && (
              <div>
                <div className="mb-3 text-[11px] uppercase tracking-[0.22em] text-white/[0.45]">Project</div>
                <div className="rounded-[26px] border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white/[0.82]">
                  {workflowName}
                </div>
              </div>
            )}

            <div>
              {!isSidebarCollapsed && <div className="mb-3 text-[11px] uppercase tracking-[0.22em] text-white/[0.45]">Node Library</div>}
              <div className="space-y-3">
                {NODE_TEMPLATES.map((template, index) => (
                  <button
                    key={template.type}
                    title={isSidebarCollapsed ? template.label : undefined}
                    className={`w-full rounded-[26px] border border-white/10 bg-white/[0.06] transition hover:bg-white/10 text-white ${isSidebarCollapsed ? "p-3 flex justify-center items-center h-12" : "px-4 py-4 text-left text-sm"}`}
                    onClick={() => addNode(template.type)}
                  >
                    {isSidebarCollapsed ? (
                      getTemplateIcon(template.type)
                    ) : (
                      <>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 font-medium tracking-[-0.01em]">
                            {getTemplateIcon(template.type)}
                            {template.label}
                          </div>
                          <div
                            className={`h-3 w-3 rounded-full ${index % 2 === 0 ? "bg-amber-300" : "bg-sky-400"}`}
                          />
                        </div>
                        <div className="mt-2 text-xs leading-5 text-white/[0.58]">{template.description}</div>
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className={`border-t border-white/10 pt-5 space-y-3`}>
              {isSidebarCollapsed ? (
                <>
                  <Button className="w-full px-0 flex justify-center h-12 rounded-[26px]" onClick={() => startTransition(() => void saveWorkflow())} disabled={isPending} title="Save Workflow">
                    <IconSave />
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full px-0 flex justify-center h-12 rounded-[26px]"
                    onClick={() => startTransition(() => void executeWorkflow())}
                    disabled={isPending}
                    title="Generate Video"
                  >
                    {isExecuting ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                    ) : (
                      <IconPlay />
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button className="w-full" onClick={() => startTransition(() => void saveWorkflow())} disabled={isPending}>
                    Save Workflow
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => startTransition(() => void executeWorkflow())}
                    disabled={isPending}
                  >
                    <span className="inline-flex items-center gap-2">
                      {isExecuting ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                          Generating…
                        </span>
                      ) : (
                        "Generate Video"
                      )}
                    </span>
                  </Button>
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.06] px-4 py-4 text-xs leading-5 text-white/[0.76]">
                    {message}
                  </div>
                  {lastOutputUrl ? (
                    <a
                      href={lastOutputUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-[22px] border border-sky-400/30 bg-sky-400/10 px-4 py-3 text-center text-xs uppercase tracking-[0.16em] text-sky-100"
                    >
                      Open Video File
                    </a>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </aside>

        <section className="grid min-h-screen grid-rows-[auto_1fr_auto] min-w-0">
          <header className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-white/10 px-7 py-5">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-white/[0.45]">Workflow</div>
              <div className="mt-2 flex items-center gap-3 min-w-0">
                <Image src="/logo.png" alt="Flow Motion" width={28} height={28} className="shrink-0" />
                <div className="text-xl font-medium tracking-[-0.02em] truncate">{workflowName}</div>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="text-[11px] uppercase tracking-[0.24em] text-white/[0.45] w-20 shrink-0">
                  Project
                </div>
                <input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  onBlur={() => void saveProjectName(projectName)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      (e.currentTarget as HTMLInputElement).blur();
                    }
                  }}
                  placeholder="Untitled project"
                  disabled={!projectId || isSavingProjectName}
                  className="h-10 w-full max-w-[420px] rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-sm text-white/80 outline-none placeholder:text-white/30 disabled:opacity-60"
                />
              </div>
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs uppercase tracking-[0.16em] text-white/60">
              Canvas
            </div>
          </header>

          <div className="grid min-h-0 grid-cols-1 gap-6 p-6">
            <div className="flow-grid relative overflow-hidden rounded-[36px] border border-white/10 bg-black/[0.14] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.08),transparent_28%),radial-gradient(circle_at_80%_100%,rgba(56,189,248,0.12),transparent_26%)]" />
              <ReactFlow
                nodes={nodes}
                edges={styledEdges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                snapToGrid
                snapGrid={[24, 24]}
                selectionOnDrag
                defaultEdgeOptions={{
                  type: "default",
                  markerEnd: { type: MarkerType.ArrowClosed, color: "#f5b544" },
                  style: { stroke: "#f5b544", strokeWidth: 2.5 },
                }}
              >
                <Background gap={24} size={1} color="rgba(255,255,255,0.08)" />
                <MiniMap
                  pannable
                  zoomable
                  nodeStrokeColor="#ffffff55"
                  nodeColor="#0f1015"
                  maskColor="rgba(9,10,14,0.75)"
                  className="!rounded-[22px] !border !border-white/10 !bg-[#0f1015]/80"
                />
                <Controls showInteractive={false} className="rounded-2xl border border-white/10 bg-[#0f1015]/90" />
              </ReactFlow>
            </div>
          </div>

          <footer className="grid grid-cols-3 border-t border-white/10 text-white/[0.65]">
            <div className="border-r border-white/10 px-6 py-4 text-sm">
              Drag rounded nodes, connect curves, and shape the generation path.
            </div>
            <div className="border-r border-white/10 px-6 py-4 text-sm">
              Prompt and media are combined into a Veo-ready motion brief.
            </div>
            <div className="px-6 py-4 text-sm">As soon as the AI returns a file URL, the preview panel swaps to the video.</div>
          </footer>
        </section>
      </div>
    </div>
  );
}

export function WorkflowEditor() {
  return (
    <ReactFlowProvider>
      <WorkflowEditorInner />
    </ReactFlowProvider>
  );
}
