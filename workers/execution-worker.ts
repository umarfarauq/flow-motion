import { Worker } from "bullmq";
import { getRedisConnection } from "@/lib/redis";
import { executeWorkflowGraph } from "@/lib/workflow/execution";
import { FLOW_EXECUTION_QUEUE } from "@/lib/queue";
import { updateRenderJob } from "@/lib/db/workflows";
import type { FlowEdge, FlowNode } from "@/types/flow";

const connection = getRedisConnection();

if (!connection) {
  throw new Error("REDIS_URL is required to start the BullMQ worker.");
}

const worker = new Worker(
  FLOW_EXECUTION_QUEUE,
  async (job) => {
    await updateRenderJob(job.data.jobId, { status: "processing" });

    const result = await executeWorkflowGraph({
      jobId: job.data.jobId as string,
      nodes: job.data.nodes as FlowNode[],
      edges: job.data.edges as FlowEdge[],
    });

    await updateRenderJob(job.data.jobId as string, {
      status: result.status,
      outputUrl: result.outputUrl,
      payload: {
        executionOrder: result.executionOrder,
        outputs: result.outputs,
      },
    });

    return result;
  },
  { connection },
);

worker.on("failed", async (job, error) => {
  if (!job) {
    return;
  }

  await updateRenderJob(job.data.jobId as string, {
    status: "failed",
    error: error.message,
  });
});

console.log(`FlowMotion worker listening on queue "${FLOW_EXECUTION_QUEUE}"`);
