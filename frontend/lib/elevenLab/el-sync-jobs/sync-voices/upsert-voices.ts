import prisma from "@/lib/prisma";
import { ElVoice } from "../el-api-types";

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