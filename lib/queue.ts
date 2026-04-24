import { Queue } from "bullmq";
import { getRedisConnection } from "@/lib/redis";

export const FLOW_EXECUTION_QUEUE = "flowmotion-execution";

export function getExecutionQueue() {
  const connection = getRedisConnection();

  if (!connection) {
    return null;
  }

  return new Queue(FLOW_EXECUTION_QUEUE, { connection });
}
