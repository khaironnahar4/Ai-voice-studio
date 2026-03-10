"use client";

import { WaveIcon, CheckIcon } from "@/utils/Icons";

interface Voice {
  id: number;
  name: string;
  gender: string;
  accent: string;
  tone: string;
  uses: number;
  color: string;
}

interface VoiceCardProps {
  voice: Voice;
  selected: boolean;
  onSelect: (id: number) => void;
}

export default function VoiceCard({ voice, selected, onSelect }: VoiceCardProps) {
  return (
    <button
      onClick={() => onSelect(voice.id)}
      aria-pressed={selected}
      className={`
        relative text-left w-full p-4 rounded-2xl border
        transition-all duration-200 cursor-pointer overflow-hidden
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent))]
        ${selected
          ? "border-[color:var(--voice-color)] bg-[color:var(--voice-color-bg)]"
          : "border-theme bg-surface hover:border-gray-300 dark:hover:border-[#2A2A40]"
        }
      `}
      style={{
        // @ts-expect-error CSS custom property
        "--voice-color": voice.color,
        "--voice-color-bg": `${voice.color}18`,
      }}
    >
      {/* Glow */}
      {selected && (
        <div
          className="absolute top-0 right-0 w-20 h-20 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl opacity-30"
          style={{ background: voice.color }}
          aria-hidden="true"
        />
      )}

      {/* Icon */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
        style={{ background: `${voice.color}22`, color: voice.color }}
      >
        <WaveIcon size={16} />
      </div>

      {/* Info */}
      <p className="font-display font-semibold text-sm text-gray-900 dark:text-gray-100 mb-0.5">
        {voice.name}
      </p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
        {voice.accent} · {voice.tone}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span
          className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium"
          style={{ background: `${voice.color}20`, color: voice.color }}
        >
          {voice.gender}
        </span>
        <span className="text-[11px] text-gray-400 dark:text-gray-500">
          {voice.uses.toLocaleString()} uses
        </span>
      </div>

      {/* Selected check */}
      {selected && (
        <div
          className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: voice.color }}
        >
          <CheckIcon size={10} className="text-white" />
        </div>
      )}
    </button>
  );
}
