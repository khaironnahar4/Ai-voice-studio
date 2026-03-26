import { Queue, Worker, type Processor } from "bullmq";
import { Redis }  from "ioredis";
import dotenv from "dotenv"
dotenv.config();


// Shared Redis connection — reused across Queue + Worker
export const redis = new Redis(process.env.UPSTASH_REDIS_URL!, {
  maxRetriesPerRequest: null, // required by BullMQ
  tls: process.env.NODE_ENV === "production" ? {} : undefined,
});

// ── Queue names ───────────────────────────────────────────────
export const QUEUES = {
  TTS_GENERATE: "tts.generate",
} as const;

// ── Typed job payload ─────────────────────────────────────────
export interface TtsJobPayload {
  requestId:    string;
  userId:       string;
  voiceModelId: string;
  elVoiceId:    string;
  elModelId:    string;
  inputText:    string;
  inputTextHash: string;
  charCount:    number;
  outputFormat: string;
  languageCode: string;
  stability:    number;
  similarityBoost: number;
  style:        number;
  useSpeakerBoost: boolean;
  seed:         number | null;
  applyTextNormalization: string;
  cacheKey:     string;
}

// ── Queue instance (used to add jobs from the API route) ──────
export const ttsQueue = new Queue<TtsJobPayload>(QUEUES.TTS_GENERATE, {
  connection: redis,
  defaultJobOptions: {
    attempts:    3,
    backoff:     { type: "exponential", delay: 2000 },
    removeOnComplete: { count: 100 },
    removeOnFail:     { count: 500 },
  },
});

// ── Factory to create the worker (used in workers/tts-worker.ts) ──
export function createTtsWorker(processor: Processor<TtsJobPayload>) {
  return new Worker<TtsJobPayload>(QUEUES.TTS_GENERATE, processor, {
    connection: redis,
    concurrency: 5,       // 5 parallel EL API calls max
    limiter: {
      max:      10,       // max 10 jobs per
      duration: 1000,     // second — respects EL rate limits
    },
  });
}