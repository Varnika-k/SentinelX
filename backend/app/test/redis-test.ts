import { redis } from "../config/redis.ts";

async function testRedis() {
  try {
    console.log("Testing Redis...");

    await redis.set("sentinelx", "online");

    const value = await redis.get("sentinelx");

    console.log("REDIS RESPONSE:", value);

    process.exit(0);
  } catch (err) {
    console.error("REDIS ERROR:", err);
    process.exit(1);
  }
}

testRedis();