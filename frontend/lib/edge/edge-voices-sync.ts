import prisma from "../auth/prisma"
import dotenv from "dotenv"
dotenv.config()


// ── fetch voice list from HF Space ───────────────────────────────────
async function fetchEdgeVoices(): Promise<EdgeVoice[]> {
  const baseUrl = process.env.EDGE_TTS_BASE_URL
  const apiKey  = process.env.EDGE_TTS_API_KEY

  if (!baseUrl) throw new Error("EDGE_TTS_BASE_URL is not set")
  if (!apiKey)  throw new Error("EDGE_TTS_API_KEY is not set")

  const res = await fetch(`${baseUrl}/v1/voices`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal:  AbortSignal.timeout(30_000),
  })

  if (!res.ok) {
    throw new Error(`HF voice list fetch failed: ${res.status}`)
  }

  const data = await res.json() as { voices: EdgeVoice[] }
  return data.voices ?? []
}

interface EdgeVoice {
  Name:         string
  ShortName:    string
  Gender:       string
  Locale:       string
  LocaleName:   string
  FriendlyName: string
  Status:       string
  VoiceTag?: {
    ContentCategories:   string[]
    VoicePersonalities:  string[]
  }
}

// ── URL-safe slug ─────────────────────────────────────────────────────────
function buildSlug(shortName: string): string {
  // "en-US-AriaNeural" → "en-us-arianural-edge"
  return shortName.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-edge"
}

// ── Language code → DB language id ───────────────────────────────────────
async function resolveLanguageId(
  locale: string,
  langMap: Map<string, number>
): Promise<number | null> {
  // Exact: "en-US"
//   console.log(langMap)
  if (langMap.has(locale)) return langMap.get(locale)!
  // Short: "en"
  const short = locale.split("-")[0]
  if (langMap.has(short)) return langMap.get(short)!
  return null
}

// ── Edge TTS তে সব voices free — Neural voices premium treat করো ──────────
function isPremium(shortName: string): boolean {
  // MultilingualNeural আর Multilingual voices premium রাখো
  return shortName.includes("Multilingual")
}

// ── Style tags — VoicePersonalities থেকে ────────────────────────────────
function buildStyleTags(voice: EdgeVoice): string[] {
  const tags: string[] = []

  const personalities = voice.VoiceTag?.VoicePersonalities ?? []
  const categories    = voice.VoiceTag?.ContentCategories  ?? []

  // Normalize করে lowercase এ রাখো
  tags.push(...personalities.map((p) => p.toLowerCase()))
  tags.push(...categories.map((c) => c.toLowerCase()))

  return [...new Set(tags)]   // duplicate সরাও
}

// ── Main sync function ────────────────────────────────────────────────────
export async function syncEdgeVoices(): Promise<{
  fetched:     number
  added:       number
  updated:     number
  deactivated: number
  skipped:     number
}> {
  // ── Voice list fetch ──────────────────────────────────────────────────
  const voices = await fetchEdgeVoices()
  if (voices.length === 0) throw new Error("Edge TTS returned empty voice list")

    // console.log(voices)
  // ── Language map ──────────────────────────────────────────────────────
  const langs = await prisma.language.findMany({
    where:  { isActive: true },
    select: { id: true, code: true },
  })
  const langMap = new Map(langs.map((l) => [l.code, l.id]))

  let added = 0, updated = 0, deactivated = 0, skipped = 0
  const syncedShortNames: string[] = []

  for (const voice of voices) {
    // GA status ছাড়া skip করো (Preview voices unstable)
    if (voice.Status !== "GA") { skipped++; continue }

    const languageId = await resolveLanguageId(voice.Locale, langMap)
    if (!languageId) {
      console.warn(`[edge-sync] no language for locale ${voice.Locale} (${voice.ShortName})`)
      skipped++
      continue
    }

    const slug      = buildSlug(voice.ShortName)
    const isPrem    = isPremium(voice.ShortName)
    const styleTags = buildStyleTags(voice)

    const data = {
      languageId,
      name:            voice.FriendlyName,
      slug,
      provider:        "edge",
      providerVoiceId: voice.ShortName,
      gender:          voice.Gender?.toLowerCase() ?? null,
      accent:          voice.Locale,
      styleTags,
      isPremium:       isPrem,
      isActive:        true,
      sortOrder:       isPrem ? 0 : 10,

      // Edge-specific fields
      edgeVoiceName:    voice.ShortName,
      edgeLocale:       voice.Locale,
      edgeGender:       voice.Gender,
      edgeFriendlyName: voice.FriendlyName,

      // EL-specific → placeholder (unique constraint এর জন্য)
      elVoiceId:               `edge-${voice.ShortName}`,
      elCategory:              "edge",
      elLabels:                {},
      elAvailableForTiers:     isPrem
                                 ? ["pro", "business"]
                                 : ["free", "pro", "business"],
      elHighQualityModelIds:   [],
      elVerifiedLanguages:     [],

      // GCP-specific → null
      gcpVoiceName:    null,
      gcpLanguageCode: null,
      gcpSsmlGender:   null,
      gcpVoiceType:    null,

      lastSyncedAt: new Date(),
    }

    const existing = await prisma.voiceModel.findUnique({
      where:  { slug },
      select: { id: true },
    })

    if (existing) {
      await prisma.voiceModel.update({ where: { id: existing.id }, data })
      updated++
    } else {
      await prisma.voiceModel.create({ data })
      added++
    }

    syncedShortNames.push(voice.ShortName)
  }

  // ── Deactivate — আর নেই এমন voices ──────────────────────────────────
  const { count } = await prisma.voiceModel.updateMany({
    where: {
      provider:      "edge",
      edgeVoiceName: { notIn: syncedShortNames },
      isActive:      true,
    },
    data: { isActive: false },
  })
  deactivated = count

  return {
    fetched:     voices.length,
    added,
    updated,
    deactivated,
    skipped,
  }
}