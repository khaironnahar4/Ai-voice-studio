import prisma from "@/lib/auth/prisma";
import { elApiClient } from "./client";

export async function syncElModels(): Promise<{
  upserted: number;
  deprecated: number;
}> {
  const models = await elApiClient.getModels();

  const ttsCandidates = models.filter((m) => m.can_do_text_to_speech);
  console.log(
    `Syncing EL models: ${models.length} total, ${ttsCandidates.length} TTS-capable`
  );

  // ✅ await যোগ করো
  const results = await Promise.all(
    ttsCandidates.map(async (m) => {
      const isFlash = m.model_id.includes("flash");
      const languages = m.languages.map((l) => l.language_id);
      const maxChars = m.max_characters_request_subscribed_user;

      await prisma.elSpeechModel.upsert({
        where: { elModelId: m.model_id },
        create: {
          elModelId: m.model_id,
          name: m.name,
          description: m.description ?? null,
          canDoTts: true,
          supportedLanguages: languages,
          maxCharactersPerRequest: maxChars,
          isFlash,
          isDeprecated: false,
          isActive: true,
          tokenCostFactor: m.token_cost_factor ?? null,
          lastSyncedAt: new Date(),
        },
        update: {
          name: m.name,
          description: m.description ?? null,
          supportedLanguages: languages,
          maxCharactersPerRequest: maxChars,
          isFlash,
          isDeprecated: false,
          isActive: true,
          tokenCostFactor: m.token_cost_factor ?? null,
          lastSyncedAt: new Date(),
        },
      });

      return true; // ✅ count করার জন্য
    })
  );

  const upserted = results.length;

  // ✅ এখন safely deprecation চলবে, কারণ upserts শেষ হয়েছে
  const activeIds = ttsCandidates.map((m) => m.model_id);
  const { count: deprecated } = await prisma.elSpeechModel.updateMany({
    where: {
      elModelId: { notIn: activeIds },
      isActive: true,
    },
    data: {
      isActive: false,
      isDeprecated: true,
    },
  });

  console.log(`[sync-models] Done — upserted: ${upserted}, deprecated: ${deprecated}`);

  return { upserted, deprecated };
}