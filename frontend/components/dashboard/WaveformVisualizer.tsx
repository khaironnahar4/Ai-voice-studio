"use client";

import { useEffect, useState } from "react";

const BARS = 44;

export default function WaveformVisualizer({ active }: { active: boolean }) {
  const [heights, setHeights] = useState<number[]>(() =>
    Array.from({ length: BARS }, () => 0.12)
  );

  useEffect(() => {
    if (!active) {
      setHeights(Array.from({ length: BARS }, () => 0.12));
      return;
    }
    const id = setInterval(() => {
      setHeights(
        Array.from({ length: BARS }, (_, i) => {
          const center = Math.abs(i - BARS / 2) / (BARS / 2);
          const base = 0.12 + (1 - center) * 0.45;
          return Math.max(0.06, Math.min(1, base + (Math.random() - 0.5) * 0.55));
        })
      );
    }, 80);
    return () => clearInterval(id);
  }, [active]);

  return (
    <div
      role="img"
      aria-label={active ? "Audio generating" : "Waveform idle"}
      className="flex items-center gap-[3px] h-12 px-1"
    >
      {heights.map((h, i) => (
        <div
          key={i}
          className="w-[3px] rounded-sm flex-shrink-0 transition-[height] duration-75"
          style={{
            height: `${h * 100}%`,
            background: active
              ? `linear-gradient(to top, rgb(var(--accent)), rgb(var(--accent2)))`
              : `rgb(var(--accent) / 0.2)`,
            transitionDuration: active ? "80ms" : "300ms",
          }}
        />
      ))}
    </div>
  );
}
