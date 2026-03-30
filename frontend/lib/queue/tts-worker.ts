// lib/queue/tts-worker.ts

import { Worker, Job } from "bullmq";
import { edgeTtsClient } from "@/lib/tts/edge-tts-client";
import prisma from "@/lib/auth/prisma";
import { redis } from ".";
import { buildStorageKey, contentTypeForFormat, generateSignedUrl, uploadAudio } from "../storage/r2";

// ── Job payload type ──────────────────────────────────────────────────────────

interface TTSJobPayload {
  requestId: string;
  userId: string;
  text: string;
  voice: string; // edge-tts voice e.g. "en-US-AvaNeural"
  outputFormat: string;
  speed: number;
  languageCode: string;
  voiceModelId: string;
  cacheKey: string;
}

// ── Worker ────────────────────────────────────────────────────────────────────

export const ttsWorker = new Worker<TTSJobPayload>(
  "tts.generate",
  async (job: Job<TTSJobPayload>) => {
    const {
      requestId,
      userId,
      text,
      voice,
      outputFormat,
      speed,
      voiceModelId,
      cacheKey,
    } = job.data;

    // ── 1. Mark request as processing ───────────────────────────────────────
    await prisma.ttsRequest.update({
      where: { id: requestId },
      data: { status: "processing" },
    });

    await prisma.job.updateMany({
      where: { requestId, status: "waiting" },
      data: {
        status: "active",
        startedAt: new Date(),
        workerId: `worker-${process.pid}`,
      },
    });

    // ── 2. Warm up HF Space if needed ───────────────────────────────────────
    await edgeTtsClient.warmUp();

    // ── 3. Call Edge TTS ─────────────────────────────────────────────────────
    const {
      audioBuffer,
      outputFormat: format,
    } = await edgeTtsClient.synthesize({
      text,
      voice,
      outputFormat: outputFormat as "mp3" | "wav" | "opus" | "flac",
      speed,
    });

    // ── 4. Upload to Supabase Storage ────────────────────────────────────────
    const now         = new Date();
    const storageKey  = buildStorageKey(userId, requestId, format, now);
    const contentType = contentTypeForFormat(format);
 
    await uploadAudio(storageKey, audioBuffer, contentType);
 
    // ── 5. Generate presigned URL (15-min TTL) ────────────────────────────────
    const { url: signedUrl, expiresAt: signedUrlExpiresAt } =
      await generateSignedUrl(storageKey);
    // ── 5. Create AudioFile record ───────────────────────────────────────────
    const audioFile = await prisma.audioFile.create({
      data: {
        requestId,
        userId,
        storageBucket: process.env.STORAGE_BUCKET ?? "vocera-audio",
        storageKey,
        fileName: `${requestId}.${format}`,
        fileFormat: format,
        fileSizeBytes: BigInt(audioBuffer.length),
        cdnUrl,
        signedUrl,
        signedUrlExpiresAt,
        isPublic: false,
      },
    });

    // ── 6. Create cache entry (SHA-256 dedup) ────────────────────────────────
    await prisma.requestCache.upsert({
      where: { cacheKey },
      create: {
        cacheKey,
        audioFileId: audioFile.id,
        voiceModelId,
        outputFormat: format,
        charCount: text.length,
        hitCount: 0,
      },
      update: {}, // already cached — do nothing
    });

    // ── 7. Mark request as completed ─────────────────────────────────────────
    await prisma.ttsRequest.update({
      where: { id: requestId },
      data: {
        status: "completed",
        servedFromCache: false,
        completedAt: new Date(),
      },
    });

    await prisma.job.updateMany({
      where: { requestId, status: "active" },
      data: {
        status: "completed",
        completedAt: new Date(),
        result: {
          audioFileId: audioFile.id,
          fileSizeBytes: audioBuffer.length,
        },
      },
    });

    return { audioFileId: audioFile.id, cdnUrl };
  },

  {
    connection: redis,
    concurrency: 5,
  },
);

// ── Error handler ─────────────────────────────────────────────────────────────

ttsWorker.on("failed", async (job, err) => {
  if (!job) return;

  const { requestId } = job.data;

  await prisma.ttsRequest.update({
    where: { id: requestId },
    data: {
      status: "failed",
      errorMessage: err.message,
      retryCount: { increment: 1 },
    },
  });

  await prisma.job.updateMany({
    where: { requestId, status: "active" },
    data: {
      status: "failed",
      completedAt: new Date(),
      error: {
        message: err.message,
        stack: err.stack,
      },
    },
  });

  console.error(
    `[tts-worker] Job failed — requestId: ${requestId}`,
    err.message,
  );
});

ttsWorker.on("completed", (job) => {
  console.log(`[tts-worker] Job completed — requestId: ${job.data.requestId}`);
});
