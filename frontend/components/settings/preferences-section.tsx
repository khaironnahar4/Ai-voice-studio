// components/settings/preferences-section.tsx
"use client"

import { useState }         from "react"
import { Check, Loader2 }  from "lucide-react"

const FORMAT_OPTIONS = [
  { value: "mp3_44100_128", label: "MP3 · 128 kbps (recommended)" },
  { value: "mp3_44100_192", label: "MP3 · 192 kbps"              },
  { value: "wav",           label: "WAV · Lossless"               },
  { value: "ogg",           label: "OGG · Opus"                   },
]

const LANGUAGE_OPTIONS = [
  { value: "en-US", label: "English (US)"      },
  { value: "en-GB", label: "English (UK)"      },
  { value: "bn-BD", label: "Bangla (BD)"       },
  { value: "bn-IN", label: "Bangla (India)"    },
  { value: "hi-IN", label: "Hindi (India)"     },
  { value: "fr-FR", label: "French"            },
  { value: "de-DE", label: "German"            },
  { value: "es-ES", label: "Spanish"           },
  { value: "ja-JP", label: "Japanese"          },
  { value: "zh-CN", label: "Chinese (Simplified)" },
]

interface PrefValues {
  defaultFormat:   string
  defaultLanguage: string
  speakingRate:    number
  autoPlay:        boolean
}

export function PreferencesSection() {
  const [prefs, setPrefs]   = useState<PrefValues>({
    defaultFormat:   "mp3_44100_128",
    defaultLanguage: "en-US",
    speakingRate:    1.0,
    autoPlay:        true,
  })
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  function set<K extends keyof PrefValues>(key: K, val: PrefValues[K]) {
    setPrefs(p => ({ ...p, [key]: val }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    const res = await fetch("/api/settings/preferences", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(prefs),
    })
    setSaving(false)
    if (!res.ok) { setError("Failed to save."); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="space-y-5">

      {/* Studio defaults */}
      <div className="rounded-xl border border-[#282846] bg-[#141424] p-6">
        <h2 className="text-sm font-medium text-white/70 mb-5">
          Studio defaults
        </h2>

        <div className="space-y-5">
          {/* Default format */}
          <div>
            <label className="text-xs text-white/45 block mb-1.5">
              Default output format
            </label>
            <div className="relative">
              <select
                value={prefs.defaultFormat}
                onChange={e => set("defaultFormat", e.target.value)}
                className="w-full appearance-none bg-[#0F0F1A] border border-[#282846]
                           rounded-lg pl-3 pr-8 py-2.5 text-sm text-white/70
                           focus:outline-none focus:border-[rgba(120,62,246,0.5)]
                           cursor-pointer transition-colors"
              >
                {FORMAT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3
                           text-white/30 pointer-events-none"
                viewBox="0 0 10 6" fill="currentColor"
              >
                <path d="M0 0l5 6 5-6H0z"/>
              </svg>
            </div>
          </div>

          {/* Default language */}
          <div>
            <label className="text-xs text-white/45 block mb-1.5">
              Default language
            </label>
            <div className="relative">
              <select
                value={prefs.defaultLanguage}
                onChange={e => set("defaultLanguage", e.target.value)}
                className="w-full appearance-none bg-[#0F0F1A] border border-[#282846]
                           rounded-lg pl-3 pr-8 py-2.5 text-sm text-white/70
                           focus:outline-none focus:border-[rgba(120,62,246,0.5)]
                           cursor-pointer transition-colors"
              >
                {LANGUAGE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3
                           text-white/30 pointer-events-none"
                viewBox="0 0 10 6" fill="currentColor"
              >
                <path d="M0 0l5 6 5-6H0z"/>
              </svg>
            </div>
          </div>

          {/* Speaking rate */}
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-xs text-white/45">
                Default speaking rate
              </label>
              <span className="text-xs font-mono text-white/40">
                {prefs.speakingRate.toFixed(1)}×
              </span>
            </div>
            <div className="relative h-5 flex items-center">
              <div className="absolute inset-x-0 h-1 bg-[#282846] rounded-full"/>
              <div
                className="absolute left-0 h-1 rounded-full
                           bg-linear-to-r from-[rgb(120,62,246)] to-[rgb(34,211,238)]"
                style={{ width: `${((prefs.speakingRate - 0.25) / (4 - 0.25)) * 100}%` }}
              />
              <div
                className="absolute w-3.5 h-3.5 rounded-full bg-white
                           border-2 border-[rgb(120,62,246)] shadow-md
                           pointer-events-none"
                style={{
                  left: `calc(${((prefs.speakingRate - 0.25) / (4 - 0.25)) * 100}% - 7px)`,
                }}
              />
              <input
                type="range"
                min={0.25} max={4} step={0.25}
                value={prefs.speakingRate}
                onChange={e => set("speakingRate", parseFloat(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer h-5"
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-white/20">0.25×</span>
              <span className="text-[10px] text-white/20">4×</span>
            </div>
          </div>
        </div>
      </div>

      {/* Playback */}
      <div className="rounded-xl border border-[#282846] bg-[#141424] p-6">
        <h2 className="text-sm font-medium text-white/70 mb-4">
          Playback
        </h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/65">Auto-play generated audio</p>
            <p className="text-xs text-white/30 mt-0.5">
              Automatically play audio as soon as it&apos;s ready in Studio.
            </p>
          </div>
          <button
            onClick={() => set("autoPlay", !prefs.autoPlay)}
            role="switch"
            aria-checked={prefs.autoPlay}
            className={`relative w-10 h-5.5 rounded-full transition-colors duration-200
              ${prefs.autoPlay
                ? "bg-[rgb(120,62,246)]"
                : "bg-[#282846]"
              }`}
            style={{ height: "22px" }}
          >
            <span
              className="absolute top-0.75 w-4 h-4 rounded-full bg-white shadow
                         transition-transform duration-200"
              style={{
                left:      "3px",
                transform: prefs.autoPlay ? "translateX(18px)" : "translateX(0)",
              }}
            />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-400 px-1">{error}</p>
      )}

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl
                     text-sm font-medium transition-all duration-150
                     ${saving
                       ? "bg-white/5 text-white/30 cursor-wait"
                       : "bg-[rgb(120,62,246)] text-white hover:bg-[rgba(120,62,246,0.85)]"
                     }`}
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : saved ? (
            <Check className="w-3.5 h-3.5 text-teal-400" />
          ) : null}
          {saved ? "Saved!" : saving ? "Saving…" : "Save preferences"}
        </button>
      </div>

    </div>
  )
}