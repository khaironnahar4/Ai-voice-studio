// This is the typed wrapper all three sync jobs share. It handles auth headers, error surfacing, and pagination.

import { ElModel, ElSubscription, ElVoice } from "./el-api-types";

const EL_BASE = process.env.EL_BASE || "https://api.elevenlabs.io";

function headers() {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY is not set");
  return { "xi-api-key": key, "Content-Type": "application/json" };
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${EL_BASE}${path}`, {
    headers: headers(),
    next: { revalidate: 0 }, // always fresh — never cached
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`EL API ${path} → ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

// ── Public API ──────────────────────────────────────────────────

export const elApiClient = {
  getModels: () => get<ElModel[]>("/v1/models"),

  getVoices: () =>
    get<{ voices: ElVoice[] }>("/v1/voices?show_legacy=false").then(
      (r) => r.voices
    ),

  getSubscription: () => get<ElSubscription>("/v1/user/subscription"),
};