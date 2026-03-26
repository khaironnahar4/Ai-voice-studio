import { NextResponse }    from "next/server";
import { z }               from "zod";
import { checkUserQuota }  from "@/lib/tts/quota";
import { buildCacheKey, lookupCache } from "@/lib/tts/cache";
import { ttsQueue }        from "@/lib/queue";
import type { TtsJobPayload } from "@/lib/queue";
import prisma from "@/lib/auth/prisma";
import { authIsRequired } from "@/lib/auth/auth-utils";

// ── Request validation ────────────────────────────────────────
const TtsRequestSchema = z.object({
  text: z
    .string()
    .min(1,     "Text is required.")
    .max(10000, "Text exceeds maximum length."),
  voiceModelId:  z.string().uuid("Invalid voice model ID."),
  outputFormat:  z.string().default("mp3_44100_128"),
  languageCode:  z.string().max(5).default("en"),
  stability:     z.number().min(0).max(1).default(0.5),
  similarityBoost: z.number().min(0).max(1).default(0.75),
  style:         z.number().min(0).max(1).default(0),
  useSpeakerBoost: z.boolean().default(true),
  seed:          z.number().int().nullable().default(null),
  applyTextNormalization: z.enum(["auto", "on", "off"]).default("auto"),
});

export async function POST(req: Request) {
  // ── Auth ────────────────────────────────────────────────────
  const session = await authIsRequired();
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
  }
  const userId = session.user.id;

  // ── Parse + validate ────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = TtsRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const input = parsed.data;
  const charCount = input.text.length;
  const wordCount = input.text.trim().split(/\s+/).length;

  // ── Load voice model (validates it exists + is active) ──────
  const voiceModel = await prisma.voiceModel.findUnique({
    where:   { id: input.voiceModelId, isActive: true },
    include: { elSpeechModel: { select: { id: true, elModelId: true } } },
  });

  if (!voiceModel) {
    return NextResponse.json({ error: "Voice model not found." }, { status: 404 });
  }
  if (!voiceModel.elSpeechModel) {
    return NextResponse.json({ error: "No speech model linked to this voice." }, { status: 422 });
  }

  // ── Premium voice access check ──────────────────────────────
  if (voiceModel.isPremium) {
    const sub = await prisma.subscription.findFirst({
      where:   { userId, status: { in: ["active", "trialing"] } },
      include: { plan: { select: { hasPremiumVoices: true } } },
    });
    if (!sub?.plan.hasPremiumVoices) {
      return NextResponse.json(
        { error: "This voice requires a paid plan." },
        { status: 403 }
      );
    }
  }

  // ── Quota check ─────────────────────────────────────────────
  const quota = await checkUserQuota(userId, charCount);
  if (!quota.allowed) {
    return NextResponse.json(
      { error: quota.reason, code: quota.code },
      { status: 402 }
    );
  }

  // ── Cache lookup ─────────────────────────────────────────────
  const cacheKey = buildCacheKey({
    inputText:    input.text,
    elVoiceId:    voiceModel.elVoiceId,
    elModelId:    voiceModel.elSpeechModel.elModelId,
    languageCode: input.languageCode,
    outputFormat: input.outputFormat,
  });

  const cached = await lookupCache(cacheKey);

  if (cached.hit) {
    // Write a completed tts_request row for quota tracking
    // even though no EL call was made
    const ttsRequest = await prisma.ttsRequest.create({
      data: {
        userId,
        voiceModelId:    input.voiceModelId,
        elSpeechModelId: voiceModel.elSpeechModel.id,
        inputText:       input.text,
        inputTextHash:   cacheKey,
        charCount,
        wordCount,
        status:          "completed",
        outputFormat:    input.outputFormat,
        languageCode:    input.languageCode,
        stability:       input.stability,
        similarityBoost: input.similarityBoost,
        style:           input.style,
        useSpeakerBoost: input.useSpeakerBoost,
        seed:            input.seed,
        applyTextNormalization: input.applyTextNormalization,
        servedFromCache: true,
        completedAt:     new Date(),
      },
    });

    return NextResponse.json({
      requestId:   ttsRequest.id,
      status:      "completed",
      fromCache:   true,
      audioFileId: cached.audioFileId,
      url:         cached.signedUrl,
      urlExpiresAt: cached.expiresAt,
    });
  }

  // ── Create request row + enqueue (atomic) ───────────────────
  const ttsRequest = await prisma.ttsRequest.create({
    data: {
      userId,
      voiceModelId:    input.voiceModelId,
      elSpeechModelId: voiceModel.elSpeechModel.id,
      inputText:       input.text,
      inputTextHash:   cacheKey,
      charCount,
      wordCount,
      status:          "queued",
      outputFormat:    input.outputFormat,
      languageCode:    input.languageCode,
      stability:       input.stability,
      similarityBoost: input.similarityBoost,
      style:           input.style,
      useSpeakerBoost: input.useSpeakerBoost,
      seed:            input.seed,
      applyTextNormalization: input.applyTextNormalization,
      servedFromCache: false,
    },
  });

  // Write job audit row to DB
  const jobRecord = await prisma.job.create({
    data: {
      queueName:   "tts.generate",
      jobType:     "GENERATE_AUDIO",
      requestId:   ttsRequest.id,
      userId,
      payload:     {} as object, // populated below
      status:      "waiting",
      priority:    0,
      maxAttempts: 3,
    },
  });

  const payload: TtsJobPayload = {
    requestId:    ttsRequest.id,
    userId,
    voiceModelId: input.voiceModelId,
    elVoiceId:    voiceModel.elVoiceId,
    elModelId:    voiceModel.elSpeechModel.elModelId,
    inputText:    input.text,
    inputTextHash: cacheKey,
    charCount,
    outputFormat: input.outputFormat,
    languageCode: input.languageCode,
    stability:    input.stability,
    similarityBoost: input.similarityBoost,
    style:        input.style,
    useSpeakerBoost: input.useSpeakerBoost,
    seed:         input.seed,
    applyTextNormalization: input.applyTextNormalization,
    cacheKey,
  };

  // Push to BullMQ — job id matches DB job row id for traceability
  await ttsQueue.add("generate", payload, {
    jobId:    jobRecord.id,
    priority: 0,
  });

  // Update DB job row with the payload now that we have it
  await prisma.job.update({
    where: { id: jobRecord.id },
    data:  { payload: payload as object },
  });

  return NextResponse.json(
    {
      requestId: ttsRequest.id,
      jobId:     jobRecord.id,
      status:    "queued",
    },
    { status: 202 }
  );
}