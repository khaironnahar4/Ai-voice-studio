// lib/tts/edge-tts-client.ts

const EDGE_TTS_BASE_URL = process.env.EDGE_TTS_BASE_URL!;
const EDGE_TTS_API_KEY  = process.env.EDGE_TTS_API_KEY!;

if (!EDGE_TTS_BASE_URL) throw new Error("EDGE_TTS_BASE_URL is not set");
if (!EDGE_TTS_API_KEY)  throw new Error("EDGE_TTS_API_KEY is not set");

// ── Types ─────────────────────────────────────────────────────────────────────

export type TTSOutputFormat = "mp3" | "wav" | "opus" | "flac";

export interface TTSSynthesizeParams {
  text:         string;
  voice:        string;        // edge-tts voice name e.g. "en-US-AvaNeural"
  outputFormat?: TTSOutputFormat;
  speed?:       number;        // 0.25 – 4.0, default 1.0
}

export interface TTSSynthesizeResult {
  audioBuffer:  Buffer;
  mimeType:     string;
  outputFormat: TTSOutputFormat;
}

export interface EdgeTTSVoice {
  Name:           string;      // "Microsoft Server Speech Text to Speech Voice (en-US, AvaNeural)"
  ShortName:      string;      // "en-US-AvaNeural"
  Gender:         string;      // "Female"
  Locale:         string;      // "en-US"
  SuggestedCodec: string;
  FriendlyName:   string;
  Status:         string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const MIME_MAP: Record<TTSOutputFormat, string> = {
  mp3:  "audio/mpeg",
  wav:  "audio/wav",
  opus: "audio/opus",
  flac: "audio/flac",
};

// OpenAI voice aliases → Edge TTS voice map
export const OPENAI_VOICE_MAP: Record<string, string> = {
  alloy:   "en-US-AvaNeural",
  echo:    "en-US-AndrewNeural",
  fable:   "en-GB-SoniaNeural",
  onyx:    "en-US-EricNeural",
  nova:    "en-US-JennyNeural",
  shimmer: "en-US-EmmaNeural",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function resolveVoice(voice: string): string {
  return OPENAI_VOICE_MAP[voice.toLowerCase()] ?? voice;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${EDGE_TTS_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${EDGE_TTS_API_KEY}`,
      "Content-Type":  "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "unknown error");
    throw new Error(`Edge TTS API error ${res.status}: ${body}`);
  }

  return res as unknown as T;
}

// ── Client ────────────────────────────────────────────────────────────────────

export const edgeTtsClient = {

  /**
   * Synthesize text to speech.
   * Returns raw audio bytes — caller handles storage.
   */
  async synthesize(params: TTSSynthesizeParams): Promise<TTSSynthesizeResult> {
    const outputFormat: TTSOutputFormat = params.outputFormat ?? "mp3";
    const edgeVoice = resolveVoice(params.voice);

    const res = await fetch(`${EDGE_TTS_BASE_URL}/v1/audio/speech`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${EDGE_TTS_API_KEY}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({
        model:           "tts-1",
        input:           params.text,
        voice:           edgeVoice,
        response_format: outputFormat,
        speed:           params.speed ?? 1.0,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "unknown");
      throw new Error(`Edge TTS synthesis error ${res.status}: ${body}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    if (audioBuffer.length === 0) {
      throw new Error("Edge TTS returned empty audio buffer");
    }

    return {
      audioBuffer,
      mimeType: MIME_MAP[outputFormat],
      outputFormat,
    };
  },

  /**
   * List all available Edge TTS voices.
   */
  async listVoices(): Promise<EdgeTTSVoice[]> {
    const res = await request<Response>("/v1/voices");
    const data = await (res as unknown as Response).json();
    return data.voices ?? [];
  },

  /**
   * Check if the Hugging Face Space is awake.
   * Call this before synthesize() to handle cold start.
   */
  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${EDGE_TTS_BASE_URL}/health`, {
        signal: AbortSignal.timeout(10_000),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * Wake up the HF Space if it's sleeping.
   * Retries up to maxAttempts with delay between each.
   */
  async warmUp(maxAttempts = 5, delayMs = 3000): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      const isAlive = await this.healthCheck();
      if (isAlive) return;
      if (i < maxAttempts - 1) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
    throw new Error("Edge TTS service is unavailable after warm-up attempts");
  },
};