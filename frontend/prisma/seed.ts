import prisma from "@/lib/auth/prisma"

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
    { code: "en", name: "English",    nativeName: "English"    },
    { code: "bn", name: "Bengali",    nativeName: "বাংলা"       },
    { code: "hi", name: "Hindi",      nativeName: "हिन्दी"      },
    { code: "ar", name: "Arabic",     nativeName: "العربية"    },
    { code: "zh", name: "Chinese",    nativeName: "中文"        },
    { code: "fr", name: "French",     nativeName: "Français"   },
    { code: "de", name: "German",     nativeName: "Deutsch"    },
    { code: "es", name: "Spanish",    nativeName: "Español"    },
    { code: "pt", name: "Portuguese", nativeName: "Português"  },
    { code: "ja", name: "Japanese",   nativeName: "日本語"      },
    { code: "ko", name: "Korean",     nativeName: "한국어"      },
    { code: "it", name: "Italian",    nativeName: "Italiano"   },
    { code: "ru", name: "Russian",    nativeName: "Русский"    },
    { code: "tr", name: "Turkish",    nativeName: "Türkçe"     },
    { code: "pl", name: "Polish",     nativeName: "Polski"     },
    { code: "nl", name: "Dutch",      nativeName: "Nederlands" },
    { code: "sv", name: "Swedish",    nativeName: "Svenska"    },
    { code: "nb", name: "Norwegian",  nativeName: "Norsk"      },
    { code: "da", name: "Danish",     nativeName: "Dansk"      },
    { code: "fi", name: "Finnish",    nativeName: "Suomi"      },
    { code: "el", name: "Greek",      nativeName: "Ελληνικά"   },
    { code: "cs", name: "Czech",      nativeName: "Čeština"    },
    { code: "sk", name: "Slovak",     nativeName: "Slovenčina" },
    { code: "ro", name: "Romanian",   nativeName: "Română"     },
    { code: "hu", name: "Hungarian",  nativeName: "Magyar"     },
    { code: "uk", name: "Ukrainian",  nativeName: "Українська" },
    { code: "bg", name: "Bulgarian",  nativeName: "Български"  },
    { code: "hr", name: "Croatian",   nativeName: "Hrvatski"   },
    { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia" },
    { code: "ms", name: "Malay",      nativeName: "Bahasa Melayu"    },
    { code: "ta", name: "Tamil",      nativeName: "தமிழ்"      },
    { code: "te", name: "Telugu",     nativeName: "తెలుగు"     },
    { code: "ml", name: "Malayalam",  nativeName: "മലയാളം"     },
    { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt" },
    { code: "th", name: "Thai",       nativeName: "ภาษาไทย"    },
    { code: "fa", name: "Persian",    nativeName: "فارسی"      },
    { code: "ur", name: "Urdu",       nativeName: "اردو"       },
    { code: "he", name: "Hebrew",     nativeName: "עברית"      },
    { code: "ca", name: "Catalan",    nativeName: "Català"     },
  ]

  for (const l of langs) {
    await prisma.language.upsert({
      where:  { code: l.code },
      update: {},
      create: l,
    })
  }

  console.log("✅ Seed complete")
}

main().catch(console.error).finally(() => prisma.$disconnect())