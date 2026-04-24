import IORedis from "ioredis";

declare global {
  // eslint-disable-next-line no-var
  var redis: IORedis | undefined;
}

export function getRedisConnection() {
  if (!process.env.REDIS_URL) {
    return null;
  }

  if (!global.redis) {
    global.redis = new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
    });
  }

  return global.redis;
}
