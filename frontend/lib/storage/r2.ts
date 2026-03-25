import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import dotenv from "dotenv";

dotenv.config();

export const r2 = new S3Client({
  forcePathStyle: true,
  region: process.env.SUPABASE_STORAGE_REGION,
  endpoint: process.env.SUPABASE_STORAGE_ENDPOINT,
  credentials: {
    accessKeyId: process.env.SUPABASE_STORAGE_ACCESS_KEY_ID!,
    secretAccessKey: process.env.SUPABASE_STORAGE_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET!;

// ── Deterministic object key ──────────────────────────────────
// Pattern: audio/{userId}/{YYYY/MM}/{requestId}.{ext}
// Matches the storageKey design in your audio_files schema.
export function buildStorageKey(
  userId: string,
  requestId: string,
  format: string, // "mp3_44100_128" → strip to "mp3"
  createdAt = new Date(),
): string {
  const ext = format.split("_")[0]; // "mp3_44100_128" → "mp3"
  const year = createdAt.getFullYear();
  const month = String(createdAt.getMonth() + 1).padStart(2, "0");
  return `audio/${userId}/${year}/${month}/${requestId}.${ext}`;
}

// ── Upload raw audio buffer ───────────────────────────────────
export async function uploadAudio(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

// ── Presigned download URL (15-min TTL) ───────────────────────
export async function generateSignedUrl(
  key: string,
  expiresInSeconds = 60 * 15,
): Promise<{ url: string; expiresAt: Date }> {
  const url = await getSignedUrl(
    r2,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn: expiresInSeconds },
  );
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
  return { url, expiresAt };
}

// ── Hard delete (used by the 30-day cleanup job) ──────────────
export async function deleteAudio(key: string): Promise<void> {
  await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

// ── MIME type helper ──────────────────────────────────────────
export function contentTypeForFormat(format: string): string {
  const mime: Record<string, string> = {
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    flac: "audio/flac",
  };
  const ext = format.split("_")[0];
  return mime[ext] ?? "audio/mpeg";
}
