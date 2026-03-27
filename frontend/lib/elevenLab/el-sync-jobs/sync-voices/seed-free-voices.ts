// lib/el/sync/seed-free-voices.ts
import prisma from "@/lib/auth/prisma";
import { EL_FREE_VOICES } from "./free-voices";

export async function seedFreeVoices() {
  // একবারে speech model আর language নিয়ে নাও
  const [speechModel, language] = await Promise.all([
    prisma.elSpeechModel.findFirst({
      where: { elModelId: "eleven_turbo_v2_5", isActive: true },
      select: { id: true },
    }),
    prisma.language.findFirst({
      where: { code: "en", isActive: true },
      select: { id: true },
    }),
  ]);

  if (!speechModel) throw new Error("eleven_turbo_v2_5 model not found in DB. Run syncElModels() first.");
  if (!language) throw new Error("English language not found in DB.");

  const results = await Promise.all(
    EL_FREE_VOICES.map(async (voice) => {
      const slug = voice.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

      const data = {
        // VoiceModel core fields
        name: voice.name,
        slug,
        provider: "elevenlabs",
        providerVoiceId: voice.id,
        gender: voice.gender,
        accent: voice.accent,
        styleTags: [],
        sampleAudioUrl: null,
        isPremium: false,          // ✅ explicitly free
        isActive: true,
        languageId: language.id,

        // EL-specific fields
        elVoiceId: voice.id,
        elCategory: "premade",
        elLabels: { gender: voice.gender, accent: voice.accent },
        elDescription: null,
        elPreviewUrl: null,
        elAvailableForTiers: ["free", "starter", "creator", "pro"],
        elVerifiedLanguages: [],
        elHighQualityModelIds: ["eleven_turbo_v2_5"],
        elFineTuningStatus: null,
        elSafetyControl: null,
        elSharingEnabled: false,
        elSpeechModelId: speechModel.id,
        lastSyncedAt: new Date(),
      };

      const result = await prisma.voiceModel.upsert({
        where: { elVoiceId: voice.id },
        create: data,
        update: data,
        select: { id: true, name: true, createdAt: true, updatedAt: true },
      });

      const isNew = result.createdAt.getTime() === result.updatedAt.getTime();
      return { name: voice.name, status: isNew ? "added" : "updated" };
    })
  );

  results.forEach((r) => console.log(`[seed-free-voices] ${r.name}: ${r.status}`));
  return results;
}