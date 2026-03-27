import { seedFreeVoices } from "@/lib/elevenLab/el-sync-jobs/sync-voices/seed-free-voices";


export async function POST() {

  
  const results = await seedFreeVoices();
  return Response.json({ success: true, results });
}
    