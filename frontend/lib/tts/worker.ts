import { Job } from "bullmq";
import {
  uploadAudio,
  buildStorageKey,
  generateSignedUrl,
  contentTypeForFormat,
} from "@/lib/storage/r2";
import { writeCache } from "@/lib/tts/cache";
import { getProvider } from "@/lib/providers/registry";
import type { TtsJobPayload } from "@/lib/queue";
import type { SynthesisParams } from "@/lib/providers/types";
import prisma from "../auth/prisma";

// ── Build provider-agnostic SynthesisParams from job payload ──────────────
// Worker টা payload থেকে params বানায়, provider নিজেই decide করে কোনটা দরকার
async function buildSynthesisParams(
  payload: TtsJobPayload,
): Promise<SynthesisParams> {
  // Voice model লোড করো — provider-specific fields সহ
  const voiceModel = await prisma.voiceModel.findUniqueOrThrow({
    where: { id: payload.voiceModelId },
    select: {
      id: true,
      provider: true,
      providerVoiceId: true,
      elVoiceId: true,
      elSpeechModelId: true,
      gcpVoiceName: true,
      gcpLanguageCode: true,
      gcpSsmlGender: true,
      gcpVoiceType: true,
      edgeVoiceName: true,
      edgeLocale: true,
      edgeGender: true,
      edgeFriendlyName: true,
    },
  });

  return {
    requestId: payload.requestId,
    userId: payload.userId,
    inputText: payload.inputText,
    outputFormat: payload.outputFormat,
    languageCode: payload.languageCode,
    voiceModel,

    // EL-specific — provider class নিজে ignore করবে যদি GCP হয়
    elModelId: payload.elModelId,
    stability: payload.stability,
    similarityBoost: payload.similarityBoost,
    style: payload.style,
    useSpeakerBoost: payload.useSpeakerBoost,
    seed: payload.seed,
    applyTextNormalization: payload.applyTextNormalization,

    // GCP-specific — provider class নিজে ignore করবে যদি EL হয়
    speakingRate: payload.speakingRate,
    pitch: payload.pitch,
    volumeGainDb: payload.volumeGainDb,

    // Edge TTS
    edgeSpeed: payload.edgeSpeed,
  };
}

// ── Main job processor ────────────────────────────────────────────────────
export async function processTtsJob(job: Job<TtsJobPayload>): Promise<void> {
  const p = job.data;

  // ── Mark as processing ───────────────────────────────────────────────
  await prisma.ttsRequest.update({
    where: { id: p.requestId },
    data: { status: "processing" },
  });

  await prisma.job.update({
    where: { id: job.id },
    data: {
      status: "active",
      startedAt: new Date(),
      workerId: `worker-${process.pid}`,
      attempts: job.attemptsMade + 1,
    },
  });

  // ── Build params + select provider ──────────────────────────────────
  let params: SynthesisParams;
  try {
    params = await buildSynthesisParams(p);
  } catch (err) {
    await markFailed(p.requestId, job, err);
    throw err;
  }

  const providerName = params.voiceModel.provider; // "google" | "elevenlabs"
  const provider = getProvider(providerName);

  console.log(
    `[worker] job ${job.id} → provider: ${providerName} | voice: ${params.voiceModel.providerVoiceId}`,
  );

  // ── Synthesize ───────────────────────────────────────────────────────
  let result: Awaited<ReturnType<typeof provider.synthesize>>;
  try {
    result = await provider.synthesize(params);
  } catch (err) {
    await markFailed(p.requestId, job, err);
    throw err;
  }

  // ── Upload to R2 ─────────────────────────────────────────────────────
  const storageKey = buildStorageKey(p.userId, p.requestId, p.outputFormat);
  const contentType = contentTypeForFormat(p.outputFormat);
  const fileFormat = p.outputFormat.split("_")[0];
  const fileSizeBytes = BigInt(result.buffer.byteLength);

  try {
    await uploadAudio(storageKey, result.buffer, contentType);
  } catch (err) {
    await markFailed(
      p.requestId,
      job,
      new Error(
        `R2 upload failed: ${err instanceof Error ? err.message : err}`,
      ),
    );
    throw err;
  }

  // ── Generate presigned URL ───────────────────────────────────────────
  const { url: signedUrl, expiresAt: signedUrlExpiresAt } =
    await generateSignedUrl(storageKey);

  // ── Write audio_files ────────────────────────────────────────────────
  // নতুন generic columns + পুরনো EL columns (EL হলে populated, GCP হলে null)
  const audioFile = await prisma.audioFile.create({
    data: {
      requestId: p.requestId,
      userId: p.userId,
      storageBucket: process.env.R2_BUCKET_NAME!,
      storageKey,
      fileName: `${p.requestId}.${fileFormat}`,
      fileFormat,
      fileSizeBytes,
      signedUrl,
      signedUrlExpiresAt,
      downloadCount: 0,
      isPublic: false,

      // ── Generic provider fields (নতুন columns) ────────────────────
      providerRequestId: result.providerRequestId,
      providerCost: result.providerCost,
      providerModelUsed: result.providerModel,
      providerVoiceUsed: result.providerVoice,

      // ── EL-specific (EL হলে populated, GCP হলে null) ─────────────
      elRequestId:
        providerName === "elevenlabs" ? result.providerRequestId : null,
      elCharacterCost:
        providerName === "elevenlabs" ? result.providerCost : null,
      elModelUsed: providerName === "elevenlabs" ? result.providerModel : null,
      elVoiceIdUsed:
        providerName === "elevenlabs" ? result.providerVoice : null,
    },
  });

  // ── Write request_cache ──────────────────────────────────────────────
  await writeCache({
    cacheKey: p.cacheKey,
    audioFileId: audioFile.id,
    voiceModelId: p.voiceModelId,
    outputFormat: p.outputFormat,
    charCount: p.charCount,
  });

  // ── Mark completed ───────────────────────────────────────────────────
  await prisma.ttsRequest.update({
    where: { id: p.requestId },
    data: { status: "completed", completedAt: new Date() },
  });

  await prisma.job.update({
    where: { id: job.id },
    data: {
      status: "completed",
      completedAt: new Date(),
      result: {
        audioFileId: audioFile.id,
        storageKey,
        fileSizeBytes: result.buffer.byteLength,
        provider: providerName,
        providerRequestId: result.providerRequestId,
        providerCost: result.providerCost,
      },
    },
  });

  console.log(
    `[worker] ✓ job ${job.id} completed | ` +
      `${providerName} | ${result.buffer.byteLength} bytes | ` +
      `${result.providerCost} chars billed`,
  );
}

// ── Helper: mark request + job as failed ─────────────────────────────────
async function markFailed(
  requestId: string,
  job: Job<TtsJobPayload>,
  err: unknown,
): Promise<void> {
  const message = err instanceof Error ? err.message : String(err);

  await Promise.allSettled([
    prisma.ttsRequest.update({
      where: { id: requestId },
      data: {
        status: "failed",
        errorMessage: message,
        retryCount: job.attemptsMade + 1,
      },
    }),
    prisma.job.update({
      where: { id: job.id },
      data: {
        status: "failed",
        completedAt: new Date(),
        error: { message, stack: err instanceof Error ? err.stack : undefined },
      },
    }),
  ]);
}
