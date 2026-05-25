"use client"

import { useState } from "react"

export interface VoiceSettingsValue {
  // Edge / EL shared
  stability:       number
  similarityBoost: number
  // Edge / GCP
  speakingRate:    number
  pitch:           number
  // Output
  outputFormat:    string
  languageCode:    string
}

const DEFAULTS: VoiceSettingsValue = {
  stability:       0.5,
  similarityBoost: 0.75,
  speakingRate:    1.0,
  pitch:           0,
  outputFormat:    "mp3_44100_128",
  languageCode:    "en-US",
}

const OUTPUT_FORMATS = [
  { value: "mp3_44100_128", label: "MP3 · 128kbps" },
  { value: "mp3_44100_192", label: "MP3 · 192kbps" },
  { value: "wav",           label: "WAV · Lossless" },
  { value: "ogg",           label: "OGG · Opus"    },
]

function Slider({
  label, hint, value, min, max, step, onChange,
}: {
  label: string; hint: string
  value: number; min: number; max: number; step: number
  onChange: (v: number) => void
}) {
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-white/65">{label}</p>
          <p className="text-[10px] text-white/25 mt-0.5">{hint}</p>
        </div>
        <span className="text-xs font-mono text-white/40 tabular-nums">
          {value.toFixed(step < 0.1 ? 2 : 1)}
        </span>
      </div>
      <div className="relative h-5 flex items-center">
        {/* Track */}
        <div className="absolute inset-x-0 h-1 bg-[#282846] rounded-full"/>
        {/* Fill */}
        <div className="absolute left-0 h-1 rounded-full
                        bg-linear-to-r from-[rgb(120,62,246)] to-[rgb(34,211,238)]"
             style={{ width: `${pct}%` }}/>
        {/* Thumb */}
        <div className="absolute w-3.5 h-3.5 rounded-full bg-white border-2
                        border-[rgb(120,62,246)] shadow-md pointer-events-none"
             style={{ left: `calc(${pct}% - 7px)` }}/>
        <input type="range" min={min} max={max} step={step} value={value}
               onChange={e => onChange(parseFloat(e.target.value))}
               className="absolute inset-0 w-full opacity-0 cursor-pointer h-5"/>
      </div>
    </div>
  )
}

interface VoiceSettingsProps {
  value:    VoiceSettingsValue
  provider: string | null   // "edge" | "elevenlabs" | "google" | null
  onChange: (v: VoiceSettingsValue) => void
}

export function VoiceSettings({ value, provider, onChange }: VoiceSettingsProps) {
  const [open, setOpen] = useState(false)

  function set<K extends keyof VoiceSettingsValue>(key: K, val: VoiceSettingsValue[K]) {
    onChange({ ...value, [key]: val })
  }

  const showElSettings  = provider === "elevenlabs"
  const showGcpSettings = provider === "google" || provider === "edge"

  return (
    <div className="rounded-xl border border-[#282846] bg-[#141424] overflow-hidden">

      {/* Output format + language — always visible */}
      <div className="px-4 py-4 space-y-3">
        <h3 className="text-sm font-medium text-white/80 mb-1">Output</h3>

        {/* Format select */}
        <div>
          <label className="text-[11px] text-white/35 block mb-1.5">Format</label>
          <div className="relative">
            <select value={value.outputFormat}
                    onChange={e => set("outputFormat", e.target.value)}
                    className="w-full appearance-none bg-vocera-bg border border-[#282846]
                               text-white/70 text-xs rounded-lg pl-3 pr-8 py-2.5
                               focus:outline-none focus:border-[rgba(120,62,246,0.5)]
                               cursor-pointer transition-colors">
              {OUTPUT_FORMATS.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
            <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3
                           text-white/30 pointer-events-none"
                 viewBox="0 0 10 6" fill="currentColor">
              <path d="M0 0l5 6 5-6H0z"/>
            </svg>
          </div>
        </div>

        {/* Language code */}
        <div>
          <label className="text-[11px] text-white/35 block mb-1.5">Language code</label>
          <input type="text" value={value.languageCode}
                 onChange={e => set("languageCode", e.target.value)}
                 placeholder="en-US"
                 className="w-full bg-vocera-bg border border-[#282846] rounded-lg
                            px-3 py-2.5 text-xs text-white/70 font-mono
                            placeholder:text-white/20 focus:outline-none
                            focus:border-[rgba(120,62,246,0.5)] transition-colors"/>
        </div>
      </div>

      {/* Advanced settings — collapsible */}
      {(showElSettings || showGcpSettings) && (
        <div className="border-t border-[#282846]">
          <button onClick={() => setOpen(o => !o)}
                  className="w-full flex items-center justify-between
                             px-4 py-3 text-xs font-medium text-white/40
                             hover:text-white/60 transition-colors">
            Advanced settings
            <svg className={`w-3.5 h-3.5 transition-transform duration-200
                            ${open ? "rotate-180" : ""}`}
                 viewBox="0 0 10 6" fill="currentColor">
              <path d="M0 0l5 6 5-6H0z"/>
            </svg>
          </button>

          {open && (
            <div className="px-4 pb-5 space-y-5 border-t border-[#282846]/60 pt-4">
              {showElSettings && (
                <>
                  <Slider label="Stability" hint="Low = expressive · High = consistent"
                          value={value.stability} min={0} max={1} step={0.01}
                          onChange={v => set("stability", v)}/>
                  <Slider label="Similarity boost" hint="How closely to match original voice"
                          value={value.similarityBoost} min={0} max={1} step={0.01}
                          onChange={v => set("similarityBoost", v)}/>
                </>
              )}
              {showGcpSettings && (
                <>
                  <Slider label="Speaking rate" hint="0.25 = slow · 1.0 = normal · 4.0 = fast"
                          value={value.speakingRate} min={0.25} max={4} step={0.05}
                          onChange={v => set("speakingRate", v)}/>
                  <Slider label="Pitch" hint="-20 = lower · 0 = normal · +20 = higher"
                          value={value.pitch} min={-20} max={20} step={0.5}
                          onChange={v => set("pitch", v)}/>
                </>
              )}

              <button onClick={() => onChange({ ...DEFAULTS, outputFormat: value.outputFormat, languageCode: value.languageCode })}
                      className="text-[11px] text-white/25 hover:text-white/45
                                 transition-colors underline underline-offset-2">
                Reset to defaults
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}