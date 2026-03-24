// voice models sync with eleven lab api

import prisma from "@/lib/prisma";
import upsertVoice from "./upsert-voices";
import { getLanguageMap, getSpeechModelMap } from "./voice-map";
import { elApiClient } from "../client";


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