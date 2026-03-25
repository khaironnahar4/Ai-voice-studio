/**
 * test-storage.ts
 * Supabase S3 storage connection test
 *
 * Usage:
 *   npx tsx scripts/test-storage.ts
 */
import { deleteAudio, generateSignedUrl, uploadAudio } from "@/lib/storage/r2";


async function main() {
  const testKey = `test/connection-test-${Date.now()}.txt`;
  const testContent = Buffer.from("Vocera AI — storage connection test ✅");

  console.log("Testing Supabase S3 storage connection...\n");

  // 1. Upload
  console.log("1. Uploading test file...");
  await uploadAudio(testKey, testContent, "text/plain");
  console.log(`   ✅ Uploaded: ${testKey}`);

  // 2. Signed URL
  console.log("2. Generating signed URL...");
  const { url, expiresAt } = await generateSignedUrl(testKey, 60);
  console.log(`   ✅ Signed URL: ${url}`);
  console.log(`   Expires at: ${expiresAt.toISOString()}`);

  // 3. Delete
  console.log("3. Deleting test file...");
  await deleteAudio(testKey);
  console.log(`   ✅ Deleted: ${testKey}`);

  console.log("\n🎉 Storage connection is working!");
}

main().catch((err) => {
  console.error("\n❌ Storage test failed:");
  console.error(err.message);
  process.exit(1);
});