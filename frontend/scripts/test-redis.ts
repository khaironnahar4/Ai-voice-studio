// scripts/test-redis.ts
import { config } from "dotenv";
import { resolve } from "path";

// সবার আগে .env.local load করো
config({ path: resolve(process.cwd(), ".env") });

import { Redis } from "ioredis";

async function main() {
  const url = process.env.UPSTASH_REDIS_URL;
  
  if (!url) {
    console.error("UPSTASH_REDIS_URL not found in .env.local");
    process.exit(1);
  }

  console.log("Connecting to:", url.slice(0, 35) + "...");

  const redis = new Redis(url, { maxRetriesPerRequest: null });

  const pong = await redis.ping();
  console.log("Redis response:", pong); // PONG দেখলে সফল

  await redis.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});