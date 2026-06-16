import prisma from "@/lib/auth/prisma";
import { createTtsWorker } from "@/lib/queue";
import { processTtsJob }   from "@/lib/tts/worker";
import http from "http";

// ─── Health Check Server ──────────────────────────────────────
const PORT = Number(process.env.PORT || 8080);

const server = http.createServer((req, res) => {
  if (req.url === "/health" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      status: "ok",
      worker: worker.isRunning() ? "running" : "idle",
      timestamp: new Date().toISOString(),
    }));
    return;
  }
  res.writeHead(404);
  res.end();
});

// Worker 
server.listen(PORT, "0.0.0.0", () => {
  console.log(`[worker] health check listening on port ${PORT}`);
});

const worker = createTtsWorker(processTtsJob);

worker.on("completed", (job) => {
  console.log(`[worker] ✓ job ${job.id} (request: ${job.data.requestId})`);
});

worker.on("failed", async (job, err) => {
  if (!job) return;
  console.error(`[worker] ✗ job ${job.id} attempt ${job.attemptsMade}:`, err.message);

  // On final failure (no more retries left), mark request as failed
  const isLastAttempt = job.attemptsMade >= job.opts.attempts!;
  if (isLastAttempt) {
    await prisma.ttsRequest.update({
      where: { id: job.data.requestId },
      data:  {
        status:       "failed",
        errorMessage: err.message,
        retryCount:   job.attemptsMade,
      },
    }).catch(() => {}); // don't crash the worker on DB error

    await prisma.job.update({
      where: { id: job.id },
      data:  {
        status:      "failed",
        completedAt: new Date(),
        error:       { message: err.message, stack: err.stack },
      },
    }).catch(() => {});
  }
});

worker.on("error", (err) => {
  console.error("[worker] Redis error:", err);
});



// Graceful shutdown
async function shutdown() {
  console.log("[worker] shutting down...");
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT",  shutdown);

console.log("[worker] TTS worker started");