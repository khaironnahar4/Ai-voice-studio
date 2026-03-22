import prisma from "@/lib/prisma"


async function main() {

  // ── Plans ───────────────────────────────────────
  await prisma.plan.upsert({
    where:  { slug: "free" },
    update: {},
    create: {
      name: "Free", slug: "free",
      priceMonthly: 0, priceYearly: 0,
      charLimitMonthly: 10000,
      requestLimitMonthly: 20,
      storageLimitMb: 100,
      concurrentJobs: 1,
      hasPremiumVoices: false, hasApiAccess: false,
    }
  })

  // ── Languages (from EL GET /v1/models supported languages) ──
  const langs = [
    { code: "en", name: "English" },
    { code: "bn", name: "Bengali", nativeName: "বাংলা" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
    // ... add all 70+ EL-supported languages
  ]
  for (const l of langs) {
    await prisma.language.upsert({ where: { code: l.code }, update: {}, create: l })
  }

  console.log("✅ Seed complete")
}

main().catch(console.error).finally(() => prisma.$disconnect())