// shared interfaces and types for providers
// lib/providers/types.ts

export interface VoiceModelRow {
  id:               string
  provider:         string
  providerVoiceId:  string
  elVoiceId:        string
  elSpeechModelId:  string | null
  gcpVoiceName:     string | null
  gcpLanguageCode:  string | null
  gcpSsmlGender:    string | null
  gcpVoiceType:     string | null
}

export interface SynthesisParams {
  requestId:    string
  userId:       string
  inputText:    string
  outputFormat: string
  languageCode: string
  voiceModel:   VoiceModelRow

  // ElevenLabs-specific (optional)
  elModelId?:             string
  stability?:             number
  similarityBoost?:       number
  style?:                 number
  useSpeakerBoost?:       boolean
  seed?:                  number | null
  applyTextNormalization?: string

  // Google Cloud TTS-specific (optional)
  speakingRate?: number
  pitch?:        number
  volumeGainDb?: number
}

export interface SynthesisResult {
  buffer:            Buffer
  providerRequestId: string   // EL: xi-request-id, GCP: uuid v4 (GCP doesn't return one)
  providerCost:      number   // character count billed
  providerModel:     string   // "eleven_v3" or "en-US-Journey-F"
  providerVoice:     string   // el_voice_id or gcp_voice_name
}

export interface TtsProvider {
  synthesize(params: SynthesisParams): Promise<SynthesisResult>
}