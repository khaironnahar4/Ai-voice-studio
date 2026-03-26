import { Job } from "bullmq";
import {
  uploadAudio,
  buildStorageKey,
  generateSignedUrl,
  contentTypeForFormat,
} from "@/lib/storage/r2";
import { writeCache } from "@/lib/tts/cache";
import type { TtsJobPayload } from "@/lib/queue";
import prisma from "../prisma";

const EL_BASE = process.env.EL_BASE ;

// ── Call ElevenLabs TTS API → returns raw audio Buffer ────────
async function callElevenLabs(payload: TtsJobPayload): Promise<{
  buffer:      Buffer;
  elRequestId: string;
  charCost:    number;
}> {
  const endpoint = `${EL_BASE}/v1/text-to-speech/${payload.elVoiceId}`;

  const body = {
    text:       payload.inputText,
    model_id:   payload.elModelId,
    language_code: payload.languageCode || undefined,
    voice_settings: {
      stability:        payload.stability,
      similarity_boost: payload.similarityBoost,
      style:            payload.style,
      use_speaker_boost: payload.useSpeakerBoost,
    },
    seed:                      payload.seed ?? undefined,
    apply_text_normalization:  payload.applyTextNormalization,
    output_format:             payload.outputFormat,
  };

  const res = await fetch(endpoint, {
    method:  "POST",
    headers: {
      "xi-api-key":   process.env.ELEVENLABS_API_KEY!,
      "Content-Type": "application/json",
      "Accept":       "audio/*",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`ElevenLabs API error ${res.status}: ${errText}`);
  }

  const elRequestId = res.headers.get("xi-request-id") ?? "";

  // EL returns "x-char-cost" in some plans — fall back to inputText.length
  const charCostHeader = res.headers.get("character-cost");
  const charCost = charCostHeader
    ? parseInt(charCostHeader, 10)
    : payload.charCount;

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return { buffer, elRequestId, charCost };
}

// ── Main job processor ────────────────────────────────────────
export async function processTtsJob(
  job: Job<TtsJobPayload>
): Promise<void> {
  const p = job.data;

  // ── Mark request as processing ───────────────────────────────
  await prisma.ttsRequest.update({
    where: { id: p.requestId },
    data:  { status: "processing" },
  });

  await prisma.job.update({
    where: { id: job.id },
    data:  {
      status:    "active",
      startedAt: new Date(),
      workerId:  `worker-${process.pid}`,
      attempts:  job.attemptsMade + 1,
    },
  });

  let buffer:      Buffer;
  let elRequestId: string;
  let charCost:    number;

  // ── Call ElevenLabs ──────────────────────────────────────────
  try {
    ({ buffer, elRequestId, charCost } = await callElevenLabs(p));
  } catch (err) {
    // Update status before BullMQ retries the job
    await prisma.ttsRequest.update({
      where: { id: p.requestId },
      data:  {
        status:       "failed",
        errorMessage: err instanceof Error ? err.message : String(err),
        retryCount:   job.attemptsMade + 1,
      },
    });
    throw err; // BullMQ sees the throw and schedules a retry
  }

  // ── Upload to R2 ─────────────────────────────────────────────
  const storageKey   = buildStorageKey(p.userId, p.requestId, p.outputFormat);
  const contentType  = contentTypeForFormat(p.outputFormat);
  const fileFormat   = p.outputFormat.split("_")[0]; // "mp3_44100_128" → "mp3"
  const fileSizeBytes = BigInt(buffer.byteLength);

  try {
    await uploadAudio(storageKey, buffer, contentType);
  } catch (err) {
    await prisma.ttsRequest.update({
      where: { id: p.requestId },
      data:  {
        status:       "failed",
        errorMessage: `R2 upload failed: ${err instanceof Error ? err.message : String(err)}`,
        retryCount:   job.attemptsMade + 1,
      },
    });
    throw err;
  }

  // ── Generate presigned URL ───────────────────────────────────
  const { url: signedUrl, expiresAt: signedUrlExpiresAt } =
    await generateSignedUrl(storageKey);

  // ── Write audio_files row ────────────────────────────────────
  const audioFile = await prisma.audioFile.create({
    data: {
      requestId:    p.requestId,
      userId:       p.userId,
      storageBucket: process.env.R2_BUCKET_NAME!,
      storageKey,
      fileName:     `${p.requestId}.${fileFormat}`,
      fileFormat,
      fileSizeBytes,
      cdnUrl:       null,
      signedUrl,
      signedUrlExpiresAt,
      downloadCount: 0,
      isPublic:     false,
      elRequestId,
      elCharacterCost: charCost,
      elModelUsed:  p.elModelId,
      elVoiceIdUsed: p.elVoiceId,
    },
  });

  // ── Write request_cache row ──────────────────────────────────
  await writeCache({
    cacheKey:    p.cacheKey,
    audioFileId: audioFile.id,
    voiceModelId: p.voiceModelId,
    outputFormat: p.outputFormat,
    charCount:   p.charCount,
  });

  // ── Mark request as completed ────────────────────────────────
  await prisma.ttsRequest.update({
    where: { id: p.requestId },
    data:  {
      status:      "completed",
      completedAt: new Date(),
    },
  });

  // ── Mark job as completed ────────────────────────────────────
  await prisma.job.update({
    where: { id: job.id },
    data:  {
      status:      "completed",
      completedAt: new Date(),
      result: {
        audioFileId: audioFile.id,
        storageKey,
        fileSizeBytes: buffer.byteLength,
        elRequestId,
        charCost,
      },
    },
  });
}