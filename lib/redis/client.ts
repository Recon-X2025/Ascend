import Redis from "ioredis";

const globalForRedis = globalThis as unknown as { redis: Redis | undefined };

export const redis =
  globalForRedis.redis ??
  (process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL, {
        retryStrategy: (times) => Math.min(times * 50, 2000),
        lazyConnect: true,
      })
    : new Redis({
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379"),
        password: process.env.REDIS_PASSWORD || undefined,
        tls: process.env.NODE_ENV === "production" ? {} : undefined,
        retryStrategy: (times) => Math.min(times * 50, 2000),
        lazyConnect: true, // defer connection until first use so app can start if Redis is down
      }));

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

export default redis;
