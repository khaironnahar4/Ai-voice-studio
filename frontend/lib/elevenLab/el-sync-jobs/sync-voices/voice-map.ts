import prisma from "@/lib/prisma";

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