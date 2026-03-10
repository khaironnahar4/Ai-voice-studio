"use client";

import { useState } from "react";
import { PlayIcon, DownloadIcon } from "@/utils/Icons";
import { VOICES } from "@/components/dashboard/data";

interface HistoryItem {
  id: number;
  title: string;
  voice: string;
  chars: number;
  duration: string;
  date: string;
}

export default function HistoryRow({ item, index }: { item: HistoryItem; index: number }) {
  const [hovered, setHovered] = useState(false);
  const voiceColor = VOICES.find((v) => v.name === item.voice)?.color ?? "#A78BFA";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="
        flex items-center gap-3 md:gap-4 px-3 md:px-4 py-3
        rounded-xl transition-all duration-150 cursor-pointer
        hover:bg-gray-50 dark:hover:bg-white/[0.04]
        animate-fadeUp
      "
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Play button */}
      <button
        aria-label={`Play ${item.title}`}
        className="
          w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center
          bg-gray-100 dark:bg-[#1E1E30]
          hover:scale-105 active:scale-95 transition-transform duration-150
        "
        style={{ color: voiceColor }}
      >
        <PlayIcon size={13} />
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate leading-snug">
          {item.title}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5 mt-0.5">
          <span className="font-medium" style={{ color: voiceColor }}>{item.voice}</span>
          <span>·</span>
          <span>{item.chars} chars</span>
          <span className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">{item.duration}</span>
        </p>
      </div>

      {/* Date + actions */}
      <div className="flex-shrink-0 text-right flex items-center gap-2">
        <span className="hidden md:block text-xs text-gray-400 dark:text-gray-500">{item.date}</span>

        <div className={`
          flex gap-1.5 transition-opacity duration-150
          ${hovered ? "opacity-100" : "opacity-0"}
        `}>
          <button
            aria-label="Reuse script"
            className="
              px-2.5 py-1 rounded-lg text-xs font-medium
              bg-gray-100 dark:bg-[#1E1E30]
              text-[rgb(var(--accent))]
              hover:bg-[rgb(var(--accent)/0.15)] transition-colors duration-150
            "
          >
            Reuse
          </button>
          <button
            aria-label="Download audio"
            className="
              p-1.5 rounded-lg
              bg-gray-100 dark:bg-[#1E1E30]
              text-[rgb(var(--accent))]
              hover:bg-[rgb(var(--accent)/0.15)] transition-colors duration-150
            "
          >
            <DownloadIcon size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
