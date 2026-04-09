import prisma from "@/lib/auth/prisma"

function extractFilePath(url: string): string {
  // Supabase public URL pattern:
  // /storage/v1/object/public/sample-audio/{filePath}

  const marker = "https://hvyaijcomdyiwlgriysr.supabase.co/storage/v1/public/sample-audio"

  // R2 public URL pattern:
  // https://your-r2-domain.com/{filePath}
  const r2Base = process.env.R2_PUBLIC_URL

  if (marker && url.startsWith(marker)) {
    return url.replace(`${marker}`, `${r2Base}`)
  }

  // যদি already file path হয়
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return url
  }

  throw new Error(`Could not extract file path from URL: ${url}`)
}

async function main() {
  const voices = await prisma.voiceModel.findMany({
    where: {
      sampleAudioUrl: {
        not: null,
      },
    },
    select: {
      id: true,
      sampleAudioUrl: true,
      slug: true,
    },
  })

  console.log(`→ Found ${voices.length} voice records\n`)

  let updated = 0
  let skipped = 0
  let failed = 0

  for (const voice of voices) {
    const currentValue = voice.sampleAudioUrl

    if (!currentValue) {
      skipped++
      continue
    }

    try {
      const filePath = extractFilePath(currentValue)

      // যদি already path হয়, unnecessary update skip করো
      if (filePath === currentValue) {
        console.log(`- Skipped (already path): ${voice.slug}`)
        skipped++
        continue
      }

      await prisma.voiceModel.update({
        where: { id: voice.id },
        data: {
          sampleAudioUrl: filePath,
        },
      })

      console.log(`✓ Updated: ${voice.slug}`)
      console.log(`   Old: ${currentValue}`)
      console.log(`   New: ${filePath}\n`)

      updated++
    } catch (err) {
      console.log(`✗ Failed: ${voice.slug}`)
      console.log(`   Reason: ${err instanceof Error ? err.message : err}\n`)
      failed++
    }
  }

  console.log(`\n─────────────────────────`)
  console.log(`✓ Updated: ${updated}`)
  console.log(`- Skipped: ${skipped}`)
  console.log(`✗ Failed:  ${failed}`)
  console.log(`─────────────────────────`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })