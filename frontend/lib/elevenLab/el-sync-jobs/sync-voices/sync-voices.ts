// voice models sync with eleven lab api

import prisma from "@/lib/auth/prisma";
import { elApiClient } from "../client";
import { ElVoice } from "../el-api-types";

// Maps EL language_id (e.g. "en") to your languages.id (SmallInt)
export async function getLanguageMap(): Promise<Map<string, number>> {
  const langs = await prisma.language.findMany({
    where: { isActive: true },
    select: { id: true, code: true },
  });
  return new Map(langs.map((l) => [l.code, l.id]));
}

// Preload ALL elSpeechModels into a Map to avoid DB queries inside the voice loop
export async function getSpeechModelMap(): Promise<Map<string, string>> {
  const models = await prisma.elSpeechModel.findMany({
    select: { id: true, elModelId: true },
  });
  return new Map(models.map((m) => [m.elModelId, m.id]));
}

export default async function upsertVoice(
  voice: ElVoice,
  languageMap: Map<string, number>,
  speechModelMap: Map<string, string> // preloaded — no DB call
): Promise<"added" | "updated" | "skipped"> {
  const langCode =
    voice.verified_languages?.[0]?.language_id ??
    voice.labels?.language ??
    "en";

  const languageId = languageMap.get(langCode) ?? languageMap.get("en");
  if (!languageId) return "skipped";

  // O(1) Map lookup instead of a DB query per voice
  const elSpeechModelId = voice.high_quality_base_model_ids?.[0]
    ? (speechModelMap.get(voice.high_quality_base_model_ids[0]) ?? null)
    : null;

  const slug = voice.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const data = {
    languageId,
    name: voice.name,
    slug,
    provider: "elevenlabs",
    providerVoiceId: voice.voice_id,
    gender: voice.labels?.gender ?? null,
    accent: voice.labels?.accent ?? null,
    styleTags: voice.labels?.use_case ? [voice.labels.use_case] : [],
    sampleAudioUrl: null,
    isPremium: !voice.available_for_tiers?.includes("free"),
    isActive: true,
    elVoiceId: voice.voice_id,
    elCategory: voice.category,
    elLabels: voice.labels ?? {},
    elDescription: voice.description ?? null,
    elPreviewUrl: voice.preview_url ?? null,
    elAvailableForTiers: voice.available_for_tiers ?? [],
    elVerifiedLanguages: voice.verified_languages ?? [],
    elHighQualityModelIds: voice.high_quality_base_model_ids ?? [],
    elFineTuningStatus: voice.fine_tuning?.finetuning_state ?? null,
    elSafetyControl: voice.safety_control ?? null,
    elSharingEnabled: voice.sharing?.enabled_in_library ?? false,
    elSpeechModelId,
    lastSyncedAt: new Date(),
  };

  const result = await prisma.voiceModel.upsert({
    where: { elVoiceId: voice.voice_id },
    create: data,
    update: data,
    select: { id: true, createdAt: true, updatedAt: true },
  });

  // createdAt === updatedAt means it was just created
  const isNew =
    result.createdAt.getTime() === result.updatedAt.getTime();

  return isNew ? "added" : "updated";
}


const BATCH_SIZE = 50;

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export async function syncElVoices(
  syncType: "full" | "incremental" = "full"
): Promise<void> {
  const startedAt = new Date();
  let status = "running";
  let errorMessage: string | null = null;

  const log = await prisma.elVoiceSyncLog.create({
    data: { syncType, status: "running", startedAt },
  });

  let voicesFetched = 0;
  let voicesAdded = 0;
  let voicesUpdated = 0;
  let voicesDeactivated = 0;

  try {
    // Preload lookup maps — 2 queries total regardless of voice count
    const [languageMap, speechModelMap] = await Promise.all([
      getLanguageMap(),
      getSpeechModelMap(),
    ]);

    const voices = await elApiClient.getVoices();
    voicesFetched = voices.length;

    console.log(`[sync-voices] Fetched ${voicesFetched} voices from EL`);

    // Process in batches of BATCH_SIZE (parallel within each batch)
    const batches = chunk(voices, BATCH_SIZE);

    for (const batch of batches) {
      const results = await Promise.all(
        batch.map((voice) => upsertVoice(voice, languageMap, speechModelMap))
      );

      for (const result of results) {
        if (result === "added") voicesAdded++;
        if (result === "updated") voicesUpdated++;
      }
    }

    // On full sync: deactivate voices no longer returned by EL
    if (syncType === "full") {
      const activeElIds = voices.map((v) => v.voice_id);
      const { count } = await prisma.voiceModel.updateMany({
        where: {
          elVoiceId: { notIn: activeElIds },
          isActive: true,
        },
        data: { isActive: false },
      });
      voicesDeactivated = count;
    }

    status = "completed";
    console.log(
      `[sync-voices] Done — added: ${voicesAdded}, updated: ${voicesUpdated}, deactivated: ${voicesDeactivated}`
    );
  } catch (err) {
    status = "failed";
    errorMessage = err instanceof Error ? err.message : String(err);
    throw err;
  } finally {
    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();

    await prisma.elVoiceSyncLog.update({
      where: { id: log.id },
      data: {
        status,
        voicesFetched,
        voicesAdded,
        voicesUpdated,
        voicesDeactivated,
        durationMs,
        errorMessage,
        completedAt,
      },
    });
  }
}