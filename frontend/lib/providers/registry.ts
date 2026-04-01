// provider factory and registry for managing different providers

// import { GoogleTtsProvider }    from "./google"
import { ElevenLabsProvider }   from "./elevenlabs"
import type { TtsProvider }     from "./types"

const SUPPORTED_PROVIDERS = ["google", "elevenlabs"] as const
export type ProviderName = (typeof SUPPORTED_PROVIDERS)[number]

export function getProvider(providerName: string): TtsProvider {
  switch (providerName) {

    case "elevenlabs":
      return new ElevenLabsProvider()

    default:
      throw new Error(
        `Unsupported TTS provider: "${providerName}". ` +
        `Supported: ${SUPPORTED_PROVIDERS.join(", ")}`
      )
  }
}

export function isSupportedProvider(name: string): name is ProviderName {
  return SUPPORTED_PROVIDERS.includes(name as ProviderName)
}