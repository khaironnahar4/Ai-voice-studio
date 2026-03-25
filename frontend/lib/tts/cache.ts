// lib/tts/cache.ts

import { createHash } from "crypto";
import { generateSignedUrl } from "@/lib/storage/r2";
import prisma from "../prisma";

// ── Config ────────────────────────────────────────────────────
const MAX_CACHE_ENTRIES = 500;                        // LRU limit
const TTL_DAYS          = 7;                          // 7 days TTL

// ── Cache Key ─────────────────────────────────────────────────
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

// ── Types ─────────────────────────────────────────────────────
export type CacheHit = {
  hit:         true;
  audioFileId: string;
  signedUrl:   string;
  expiresAt:   Date;
};

export type CacheMiss = { hit: false; cacheKey: string };

// ── Lookup ────────────────────────────────────────────────────
export async function lookupCache(
  cacheKey: string
): Promise<CacheHit | CacheMiss> {
  const entry = await prisma.requestCache.findUnique({
    where:   { cacheKey },
    include: {
      audioFile: {
        select: { id: true, storageKey: true, deletedAt: true },
      },
    },
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

  // Increment hit counter (fire-and-forget)
  prisma.requestCache
    .update({
      where: { cacheKey },
      data:  { hitCount: { increment: 1 }, lastHitAt: new Date() },
    })
    .catch(() => {});

  return {
    hit:         true,
    audioFileId: entry.audioFileId,
    signedUrl:   url,
    expiresAt,
  };
}

// ── LRU Eviction ──────────────────────────────────────────────
// Deletes the least recently used, lowest hit entry
// Pinned entries are never evicted
async function evictIfNeeded(): Promise<void> {
  const count = await prisma.requestCache.count();
  if (count < MAX_CACHE_ENTRIES) return;

  const oldest = await prisma.requestCache.findFirst({
    where:   { isPinned: false },
    orderBy: [
      { hitCount: "asc"  },
      { lastHitAt: "asc" },
    ],
    select: { id: true },
  });

  if (oldest) {
    await prisma.requestCache.delete({ where: { id: oldest.id } });
  }
}

// ── Write ─────────────────────────────────────────────────────
// Called by the worker after successful generation
export async function writeCache(params: {
  cacheKey:     string;
  audioFileId:  string;
  voiceModelId: string;
  outputFormat: string;
  charCount:    number;
  isPinned?:    boolean; // true = never evicted, never expires (homepage demos)
}): Promise<void> {
  const { isPinned = false, ...rest } = params;

  // Only apply TTL and eviction to non-pinned entries
  const expiresAt = isPinned
    ? null
    : new Date(Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000);

  // Evict oldest unpinned entry if limit reached
  if (!isPinned) await evictIfNeeded();

  await prisma.requestCache.upsert({
    where:  { cacheKey: rest.cacheKey },
    create: {
      ...rest,
      isPinned,
      hitCount:  0,
      expiresAt,
    },
    update: {
      audioFileId: rest.audioFileId,
      isPinned,
      hitCount:    0,
      lastHitAt:   new Date(),
      expiresAt,
    },
  });
}

// ── TTL Cleanup ───────────────────────────────────────────────
// Run this in a nightly cron job: /api/cron/cleanup-cache
export async function cleanupExpiredCache(): Promise<{ deleted: number }> {
  const { count } = await prisma.requestCache.deleteMany({
    where: {
      isPinned:  false,
      expiresAt: { lt: new Date() },
    },
  });

  return { deleted: count };
}