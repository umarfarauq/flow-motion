"use client";

import { memo } from "react";
import { Handle, NodeToolbar, Position, type NodeProps } from "reactflow";
import { NodeResizer } from "@reactflow/node-resizer";
import type { FlowNodeData } from "@/types/flow";
import { useWorkflowStore } from "@/store/workflow-store";

export const FlowNodeCard = memo(function FlowNodeCard({ id, data, selected, width, height }: NodeProps<FlowNodeData> & { width?: number; height?: number }) {
  const deleteNode = useWorkflowStore((state) => state.deleteNode);
  const duplicateNode = useWorkflowStore((state) => state.duplicateNode);
  const updateNodeField = useWorkflowStore((state) => state.updateNodeField);
  const setActiveNode = useWorkflowStore((state) => state.setActiveNode);
  const lastOutputUrl = useWorkflowStore((state) => state.lastOutputUrl);
  const categoryTone =
    data.category === "input"
      ? "from-amber-300/[0.15] to-amber-500/5 text-amber-100"
      : data.category === "output"
        ? "from-sky-300/[0.15] to-sky-500/5 text-sky-100"
        : "from-white/10 to-white/5 text-white";
  const statusTone =
    data.status === "error"
      ? "bg-rose-400/[0.15] text-rose-100"
      : data.status === "success"
        ? "bg-emerald-400/[0.15] text-emerald-100"
        : data.status === "running"
          ? "bg-sky-400/[0.15] text-sky-100"
          : "bg-white/10 text-white/70";

  return (
    <div
      className="min-w-[280px] h-full rounded-[30px] border border-white/[0.12] bg-[#111217]/95 text-white shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur flex flex-col"
      style={{ width: width ?? 'auto', height: height ?? 'auto' }}
      onClick={() => setActiveNode(id)}
      role="presentation"
    >
      <NodeToolbar
        isVisible={selected}
        className="flex gap-2 rounded-2xl border border-white/[0.12] bg-[#0f1015]/95 p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.35)]"
        position={Position.Top}
      >
        <button
          className="rounded-xl border border-white/[0.12] bg-white/5 px-3 py-1.5 text-xs text-white transition hover:bg-white/10"
          onClick={() => duplicateNode(id)}
        >
          Duplicate
        </button>
        <button
          className="rounded-xl border border-white/[0.12] bg-white/5 px-3 py-1.5 text-xs text-white transition hover:bg-white/10"
          onClick={() => deleteNode(id)}
        >
          Delete
        </button>
      </NodeToolbar>

      {data.label === "Video Render" && (
        <NodeResizer minWidth={280} minHeight={300} isVisible={selected} lineClassName="border-sky-400" handleClassName="h-3 w-3 bg-[#0f1015] border-2 border-sky-400 rounded" />
      )}

      <Handle
        type="target"
        position={Position.Left}
        className="!h-4 !w-4 !rounded-full !border-2 !border-amber-300 !bg-[#111217]"
      />

      <div className={`rounded-t-[30px] bg-gradient-to-br ${categoryTone} border-b border-white/10 px-5 py-4 shrink-0`}>
        <div className="text-[11px] uppercase tracking-[0.24em] text-white/60">{data.category}</div>
        <div className="mt-2 text-base font-semibold tracking-[-0.02em]">{data.label}</div>
      </div>

      <div className="space-y-4 px-5 py-4 flex-1 flex flex-col min-h-0">
        <p className="text-xs leading-5 text-white/[0.72] shrink-0">{data.description}</p>

        {(data.fields ?? []).map((field) =>
          field.multiline ? (
            <label key={field.key} className="block text-xs">
              <span className="mb-2 block uppercase tracking-[0.16em] text-white/[0.55]">{field.label}</span>
              <textarea
                value={data.values?.[field.key] ?? ""}
                onChange={(event) => updateNodeField(id, field.key, event.target.value)}
                placeholder={field.placeholder}
                className="min-h-[100px] w-full resize-none rounded-2xl border border-white/[0.12] bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-white/[0.28]"
              />
            </label>
          ) : (
            <label key={field.key} className="block text-xs">
              <span className="mb-2 block uppercase tracking-[0.16em] text-white/[0.55]">{field.label}</span>
              <input
                value={data.values?.[field.key] ?? ""}
                onChange={(event) => updateNodeField(id, field.key, event.target.value)}
                placeholder={field.placeholder}
                className="h-11 w-full rounded-2xl border border-white/[0.12] bg-white/[0.06] px-4 text-sm text-white outline-none placeholder:text-white/[0.28]"
              />
            </label>
          ),
        )}

        {data.label === "Media Upload" ? (
          <div className="space-y-2">
            <label className="block text-xs">
              <span className="mb-2 block uppercase tracking-[0.16em] text-white/[0.55]">Upload Image</span>
              <input
                type="file"
                accept="image/*"
                className="block w-full rounded-2xl border border-dashed border-white/[0.18] bg-white/[0.06] px-4 py-3 text-white file:mr-3 file:rounded-xl file:border-0 file:bg-amber-300 file:px-3 file:py-1.5 file:text-slate-950"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) {
                    return;
                  }

                  updateNodeField(id, "status", "uploading");

                  try {
                    const formData = new FormData();
                    formData.append("file", file);

                    const response = await fetch("/api/upload", {
                      method: "POST",
                      body: formData,
                    });

                    if (!response.ok) {
                      throw new Error("Upload failed");
                    }

                    const result = await response.json();

                    updateNodeField(id, "mediaDataUrl", result.url);
                    updateNodeField(id, "mimeType", result.mimeType);
                    updateNodeField(id, "fileName", result.fileName);
                    updateNodeField(id, "status", "ready");
                  } catch (error) {
                    console.error("Upload error:", error);
                    updateNodeField(id, "status", "failed");
                    alert("Failed to upload image. Please check your Firebase connection.");
                  }
                }}
              />
            </label>

            {data.values?.mediaDataUrl ? (
              <img
                src={data.values.mediaDataUrl}
                alt={data.values.fileName || "Uploaded media preview"}
                className="h-32 w-full rounded-2xl border border-white/[0.12] object-cover"
              />
            ) : null}
          </div>
        ) : null}

        {data.label === "Video Render" && lastOutputUrl ? (
          <div className="space-y-2 mt-4 flex-1 flex flex-col min-h-0">
            <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-white/[0.55] shrink-0">Output Video</span>
            <video
              key={lastOutputUrl}
              src={lastOutputUrl}
              controls
              autoPlay
              muted
              playsInline
              className="w-full h-full flex-1 rounded-2xl border border-white/[0.12] object-cover min-h-0"
            />
            <a
              href={lastOutputUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 block rounded-xl border border-sky-400/30 bg-sky-400/10 px-3 py-2 text-center text-xs uppercase tracking-[0.16em] text-sky-100 transition hover:bg-sky-400/20 shrink-0"
            >
              Open Video File
            </a>
          </div>
        ) : null}

        <div className="flex items-center justify-between border-t border-white/10 pt-4 text-[11px] uppercase tracking-[0.16em] text-white/60 shrink-0 mt-auto">
          <span>Status</span>
          <span className={`rounded-full px-3 py-1 ${statusTone}`}>{data.status ?? "idle"}</span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!h-4 !w-4 !rounded-full !border-2 !border-sky-400 !bg-[#111217]"
      />
    </div>
  );
});
