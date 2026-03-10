'use client';

import { HISTORY, STATS, VOICES } from "@/components/dashboard/data";
import HistoryRow from "@/components/dashboard/HistoryRow";
import MobileTabBar from "@/components/dashboard/MobileTabBar";
import Sidebar from "@/components/dashboard/sidebar";
import StatCard from "@/components/dashboard/StatCard";
import TopBar from "@/components/dashboard/Topbar";
import VoiceCard from "@/components/dashboard/VoiceCard";
import { MicIcon, SparkleIcon } from "@/utils/Icons";
import dynamic from "next/dynamic";
import React, { useState } from "react";

// Lazy-load waveform — no SSR needed
const WaveformVisualizer = dynamic(
  () => import("@/components/dashboard/WaveformVisualizer"),
  { ssr: false }
);

const CHAR_LIMIT = 5000;
const FORMATS = ["MP3", "WAV", "OGG"] as const;
type Format = (typeof FORMATS)[number];


const UserDashboardPage = () => {

    const [activeNav]        = useState("compose");
  const [selectedVoice, setSelectedVoice] = useState(1);
  const [text, setText]    = useState(
    "Welcome to Vocera. Type or paste your script here and we'll transform it into natural, expressive speech using your selected voice."
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [speed, setSpeed]  = useState(1.0);
  const [pitch, setPitch]  = useState(1.0);
  const [format, setFormat] = useState<Format>("MP3");

  const charCount = text.length;
  const charPct   = (charCount / CHAR_LIMIT) * 100;
  const charOver  = charPct > 90;


  const handleGenerate = () => {
    if (!text.trim() || isGenerating) return;
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 5000);
  };

  return (
    <div className="flex min-h-screen bg-[#F5F4FF] dark:bg-[#0D0D1A]">
      {/* Desktop Sidebar */}
      <Sidebar active={activeNav} />

      {/* Page wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar active={activeNav} />

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8 space-y-5 md:space-y-6">
            {/* ── Stats Row ───────────────────────────────── */}
            <section aria-label="Usage statistics">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {STATS.map((s) => (
                  <StatCard key={s.label} {...s} />
                ))}
              </div>
            </section>

            {/* ── Compose Area ────────────────────────────── */}
            <section
              aria-label="Compose"
              className="flex flex-col lg:flex-row gap-4 md:gap-5"
            >
              {/* ── Left: Script Editor ── */}
              <div className="flex-1 min-w-0 bg-surface border border-theme rounded-2xl flex flex-col overflow-hidden">
                {/* Panel header */}
                <div className="flex items-center justify-between px-4 md:px-5 py-3.5 border-b border-theme flex-shrink-0">
                  <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <SparkleIcon
                      size={14}
                      className="text-[rgb(var(--accent))]"
                    />
                    <span className="text-sm font-medium">Script Editor</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="
                      px-3 py-1.5 rounded-lg text-xs font-medium
                      border border-theme text-gray-500 dark:text-gray-400
                      hover:text-gray-900 dark:hover:text-gray-100
                      hover:bg-gray-50 dark:hover:bg-white/5
                      transition-all duration-150
                    "
                    >
                      Import
                    </button>
                    <button
                      className="
                      hidden sm:block px-3 py-1.5 rounded-lg text-xs font-medium
                      border border-theme text-gray-500 dark:text-gray-400
                      hover:text-gray-900 dark:hover:text-gray-100
                      hover:bg-gray-50 dark:hover:bg-white/5
                      transition-all duration-150
                    "
                    >
                      AI Enhance
                    </button>
                  </div>
                </div>

                {/* Textarea */}
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, CHAR_LIMIT))}
                  placeholder="Type or paste your script here…"
                  aria-label="Script input"
                  className="
                    flex-1 min-h-[180px] md:min-h-[220px]
                    bg-transparent border-none outline-none resize-none
                    px-4 md:px-5 py-4
                    text-base leading-relaxed
                    text-gray-900 dark:text-gray-100
                    placeholder:text-gray-300 dark:placeholder:text-gray-600
                    font-sans
                  "
                />

                {/* Waveform + char count */}
                <div className="px-4 md:px-5 pb-4 pt-2 border-t border-theme flex-shrink-0">
                  <WaveformVisualizer active={isGenerating} />
                  <div className="flex items-center justify-between mt-2">
                    <span
                      className={`text-xs ${charOver ? "text-red-400" : "text-gray-400 dark:text-gray-500"}`}
                    >
                      {charCount.toLocaleString()} /{" "}
                      {CHAR_LIMIT.toLocaleString()} chars
                    </span>
                    <div className="w-28 h-1 rounded-full bg-gray-100 dark:bg-[#1E1E30] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${charOver ? "bg-red-400" : "bg-[rgb(var(--accent))]"}`}
                        style={{ width: `${Math.min(charPct, 100)}%` }}
                        role="progressbar"
                        aria-valuenow={charCount}
                        aria-valuemax={CHAR_LIMIT}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Right: Controls Panel ── */}
              <div className="w-full lg:w-72 xl:w-80 flex flex-col gap-3 md:gap-4">
                {/* Voice selector */}
                <div className="bg-surface border border-theme rounded-2xl p-4">
                  <p className="text-[10px] uppercase tracking-widest font-medium text-gray-400 dark:text-gray-500 mb-3">
                    Voice
                  </p>
                  <div className="space-y-1">
                    {VOICES.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVoice(v.id)}
                        aria-pressed={selectedVoice === v.id}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                          transition-all duration-150 text-left
                          ${
                            selectedVoice === v.id
                              ? "bg-[rgb(var(--accent)/0.1)] border border-[rgb(var(--accent)/0.4)]"
                              : "border border-transparent hover:bg-gray-50 dark:hover:bg-white/5"
                          }
                        `}
                      >
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: v.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-none mb-0.5">
                            {v.name}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {v.accent} · {v.tone}
                          </p>
                        </div>
                        {selectedVoice === v.id && (
                          <span
                            className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: v.color }}
                          >
                            <svg
                              width="8"
                              height="8"
                              viewBox="0 0 10 10"
                              fill="none"
                            >
                              <polyline
                                points="2 5 4 7.5 8.5 2"
                                stroke="white"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Adjustments */}
                <div className="bg-surface border border-theme rounded-2xl p-4">
                  <p className="text-[10px] uppercase tracking-widest font-medium text-gray-400 dark:text-gray-500 mb-4">
                    Adjustments
                  </p>

                  {(
                    [
                      {
                        label: "Speed",
                        value: speed,
                        set: setSpeed,
                        min: 0.5,
                        max: 2,
                        step: 0.1,
                        fmt: (v: number) => `${v.toFixed(1)}×`,
                      },
                      {
                        label: "Pitch",
                        value: pitch,
                        set: setPitch,
                        min: 0.5,
                        max: 2,
                        step: 0.1,
                        fmt: (v: number) => `${v.toFixed(1)}×`,
                      },
                    ] as const
                  ).map((ctrl) => (
                    <div key={ctrl.label} className="mb-4 last:mb-0">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {ctrl.label}
                        </span>
                        <span className="text-sm font-semibold text-[rgb(var(--accent))]">
                          {ctrl.fmt(ctrl.value)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={ctrl.min}
                        max={ctrl.max}
                        step={ctrl.step}
                        value={ctrl.value}
                        onChange={(e) => ctrl.set(parseFloat(e.target.value))}
                        className="w-full"
                        aria-label={ctrl.label}
                      />
                    </div>
                  ))}

                  {/* Format */}
                  <div className="mt-4 pt-4 border-t border-theme">
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      Output Format
                    </p>
                    <div className="flex gap-2">
                      {FORMATS.map((f) => (
                        <button
                          key={f}
                          onClick={() => setFormat(f)}
                          aria-pressed={format === f}
                          className={`
                            flex-1 py-1.5 rounded-lg text-xs font-semibold
                            border transition-all duration-150
                            ${
                              format === f
                                ? "border-[rgb(var(--accent)/0.6)] bg-[rgb(var(--accent)/0.1)] text-[rgb(var(--accent))]"
                                : "border-theme text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
                            }
                          `}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Generate button */}
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !text.trim()}
                  aria-label="Generate voice audio"
                  className="
                    w-full h-12 rounded-2xl flex items-center justify-center gap-2.5
                    font-display font-semibold text-base text-white
                    bg-gradient-to-r from-[rgb(var(--accent))] to-[rgb(var(--accent2))]
                    disabled:opacity-60 disabled:cursor-not-allowed
                    hover:opacity-90 hover:-translate-y-px
                    active:translate-y-0 active:scale-[0.99]
                    transition-all duration-150
                    shadow-lg shadow-[rgb(var(--accent)/0.3)]
                  "
                >
                  {isGenerating ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <MicIcon size={16} />
                      Generate Voice
                    </>
                  )}
                </button>
              </div>
            </section>

            {/* ── Recent History ───────────────────────────── */}
            <section aria-label="Recent generations">
              <div className="bg-surface border border-theme rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 md:px-5 py-4 border-b border-theme">
                  <h2 className="font-display font-semibold text-sm md:text-base text-gray-900 dark:text-gray-100">
                    Recent Generations
                  </h2>
                  <button className="text-xs md:text-sm font-medium text-[rgb(var(--accent))] hover:opacity-75 transition-opacity duration-150">
                    View all →
                  </button>
                </div>
                <div className="p-2">
                  {HISTORY.slice(0, 4).map((item, i) => (
                    <HistoryRow key={item.id} item={item} index={i} />
                  ))}
                </div>
              </div>
            </section>

            {/* ── Voice Library Preview ────────────────────── */}
            <section aria-label="Voice library">
              <div className="bg-surface border border-theme rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 md:px-5 py-4 border-b border-theme">
                  <h2 className="font-display font-semibold text-sm md:text-base text-gray-900 dark:text-gray-100">
                    Voice Library
                  </h2>
                  <button className="text-xs md:text-sm font-medium text-[rgb(var(--accent))] hover:opacity-75 transition-opacity duration-150">
                    Explore all →
                  </button>
                </div>
                <div className="p-4 md:p-5 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  {VOICES.map((v) => (
                    <VoiceCard
                      key={v.id}
                      voice={v}
                      selected={selectedVoice === v.id}
                      onSelect={setSelectedVoice}
                    />
                  ))}
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <MobileTabBar active={activeNav} />
    </div>
  );
};

export default UserDashboardPage;
