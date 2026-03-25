// lib/tts/cache.ts

import { createHash } from "crypto";
import { generateSignedUrl } from "@/lib/storage/r2";
import prisma from "../prisma";

// Canonical hash: same inputs → same audio → cache hit
export function buildCacheKey(params: {
  inputText:    string;
  elVoiceId:    string;
  elModelId:    string;
  languageCode: string;
  outputFormat: string;
}): string {
  const canonical = [
    params.inputText,
    params.elVoiceId,
    params.elModelId,
    params.languageCode,
    params.outputFormat,
  ].join("|");

  return createHash("sha256").update(canonical).digest("hex");
}

export type CacheHit = {
  hit: true;
  audioFileId: string;
  signedUrl:   string;
  expiresAt:   Date;
};

export type CacheMiss = { hit: false; cacheKey: string };

export async function lookupCache(
  cacheKey: string
): Promise<CacheHit | CacheMiss> {
  const entry = await prisma.requestCache.findUnique({
    where:   { cacheKey },
    include: { audioFile: { select: { id: true, storageKey: true, deletedAt: true } } },
  });

  // Miss: no entry, expired, or source file soft-deleted
  if (
    !entry ||
    (entry.expiresAt && entry.expiresAt < new Date()) ||
    entry.audioFile.deletedAt
  ) {
    return { hit: false, cacheKey };
  }

  // Generate fresh presigned URL for the cached file
  const { url, expiresAt } = await generateSignedUrl(entry.audioFile.storageKey);

  // Increment hit counter (fire-and-forget — don't await)
  prisma.requestCache.update({
    where: { cacheKey },
    data:  { hitCount: { increment: 1 }, lastHitAt: new Date() },
  }).catch(() => {});

  return {
    hit:         true,
    audioFileId: entry.audioFileId,
    signedUrl:   url,
    expiresAt,
  };
}

// Called by the worker after successful generation
export async function writeCache(params: {
  cacheKey:    string;
  audioFileId: string;
  voiceModelId: string;
  outputFormat: string;
  charCount:   number;
}): Promise<void> {
  await prisma.requestCache.upsert({
    where:  { cacheKey: params.cacheKey },
    create: { ...params, hitCount: 0 },
    update: { audioFileId: params.audioFileId, hitCount: 0, lastHitAt: new Date() },
  });
}