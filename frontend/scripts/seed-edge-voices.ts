import { syncEdgeVoices } from "@/lib/edge/edge-voices-sync"


async function main() {
  console.log("→ Edge TTS voice sync starting...")
  console.log("  HF Space:", process.env.EDGE_TTS_BASE_URL)

  // Health check আগে
  const health = await fetch(
    `${process.env.EDGE_TTS_BASE_URL}/health`
  )
  if (!health.ok) {
    throw new Error(`HF Space unreachable: ${health.status}`)
  }
  console.log("  ✓ HF Space is up")

  const result = await syncEdgeVoices()

  console.log(`\n  ✓ Fetched:     ${result.fetched}`)
  console.log(`  ✓ Added:       ${result.added}`)
  console.log(`  ✓ Updated:     ${result.updated}`)
  console.log(`  ⚠ Deactivated: ${result.deactivated}`)
  console.log(`  ⚠ Skipped:     ${result.skipped}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})