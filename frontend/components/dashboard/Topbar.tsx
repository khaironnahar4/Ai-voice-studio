"use client";

import { useTheme } from "@/utils/ThemeProvider";
import { SunIcon, MoonIcon, LogoIcon } from "@/utils/Icons";

const PAGE_TITLES: Record<string, string> = {
  compose: "Compose",
  history: "History",
  voices: "Voices",
  projects: "Projects",
  settings: "Settings",
};

export default function TopBar({ active }: { active: string }) {
  const { theme, toggle } = useTheme();

  return (
    <header className="
      sticky top-0 z-20
      flex items-center justify-between
      h-14 px-4 md:px-6
      bg-surface border-b border-theme
      flex-shrink-0
    ">
      {/* Left — Logo on mobile, page title on desktop */}
      <div className="flex items-center gap-3">
        <div className="lg:hidden flex items-center gap-2">
          <LogoIcon />
          <span className="font-display font-extrabold text-base text-gray-900 dark:text-gray-100">
            Vocera
          </span>
        </div>
        <h1 className="hidden lg:block font-display font-bold text-base text-gray-900 dark:text-gray-100">
          {PAGE_TITLES[active] ?? "Dashboard"}
        </h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Usage pill — hidden on small mobile */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface2 border border-theme text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--accent2))] animate-pulse2" />
          <span className="text-gray-500 dark:text-gray-400 hidden md:inline">12,450 /</span>
          <span className="text-gray-500 dark:text-gray-400">50k chars</span>
        </div>

        {/* Theme toggle — only on mobile (desktop has it in sidebar) */}
        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className="
            lg:hidden w-9 h-9 rounded-xl
            flex items-center justify-center
            bg-surface2 border border-theme
            text-gray-500 dark:text-gray-400
            hover:text-gray-900 dark:hover:text-gray-100
            transition-all duration-150
          "
        >
          {theme === "dark" ? <SunIcon size={16} /> : <MoonIcon size={16} />}
        </button>

        {/* Avatar — mobile only */}
        <div className="lg:hidden w-8 h-8 rounded-full bg-gradient-to-br from-[rgb(var(--accent))] to-[rgb(var(--accent2))] flex items-center justify-center text-white text-xs font-semibold">
          AK
        </div>
      </div>
    </header>
  );
}
