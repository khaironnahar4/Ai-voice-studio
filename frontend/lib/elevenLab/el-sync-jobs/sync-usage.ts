// el usage sync 

import prisma from "@/lib/prisma";
import { elApiClient } from "./client";
    

export async function snapshotElUsage(): Promise<void> {
  const sub = await elApiClient.getSubscription();

  const charactersUsed = BigInt(sub.character_count);
  const characterLimit = BigInt(sub.character_limit);
  const charactersRemaining = characterLimit - charactersUsed;

  const nextReset = sub.next_character_count_reset_unix
    ? new Date(sub.next_character_count_reset_unix * 1000)
    : null;

  await prisma.elUsageSync.create({
    data: {
      charactersUsed,
      characterLimit,
      charactersRemaining,
      voiceLimit: sub.voice_limit,
      professionalVoiceLimit: sub.professional_voice_limit,
      canExtendCharacterLimit: sub.can_extend_character_limit,
      canUseInstantVoiceCloning: sub.can_use_instant_voice_cloning,
      elPlanTier: sub.tier,
      nextCharacterResetAt: nextReset,
      rawResponse: sub as object,
    },
  });
}