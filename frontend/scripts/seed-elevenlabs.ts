import { syncElModels } from "@/lib/elevenLab/el-sync-jobs/sync-models";
import { snapshotElUsage } from "@/lib/elevenLab/el-sync-jobs/sync-usage";
import { syncElVoices } from "@/lib/elevenLab/el-sync-jobs/sync-voices/sync-voices";


async function main() {
  console.log("→ syncing EL speech models...");
  const models = await syncElModels();
  console.log(`   upserted: ${models.upserted}, deprecated: ${models.deprecated}`);

  console.log("→ syncing EL voices (full)...");
  await syncElVoices("full");
  console.log("   done");

  console.log("→ snapshotting EL usage...");
  await snapshotElUsage();
  console.log("   done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});