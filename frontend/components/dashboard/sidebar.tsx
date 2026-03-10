"use client";

import Link from "next/link";
import {
  MicIcon, ClockIcon, WaveIcon, FolderIcon,
  SettingsIcon, LogoIcon, SunIcon, MoonIcon,
} from "@/utils/Icons";
import { useTheme } from "@/utils/ThemeProvider";

const NAV_ITEMS = [
  { id: "compose",  label: "Compose",  href: "/dashboard",          Icon: MicIcon },
  { id: "history",  label: "History",  href: "/dashboard/history",  Icon: ClockIcon },
  { id: "voices",   label: "Voices",   href: "/dashboard/voices",   Icon: WaveIcon },
  { id: "projects", label: "Projects", href: "/dashboard/projects", Icon: FolderIcon },
  { id: "settings", label: "Settings", href: "/dashboard/settings", Icon: SettingsIcon },
];

interface SidebarProps {
  active: string;
}

export default function Sidebar({ active }: SidebarProps) {
  const { theme, toggle } = useTheme();

  return (
    <aside className="
      hidden lg:flex flex-col
      lg:w-16 xl:w-56
      h-screen sticky top-0
      bg-surface border-r border-theme
      transition-all duration-300 ease-out
      shrink-0 z-30
    ">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-theme">
        <div className="shrink-0">
          <LogoIcon />
        </div>
        <span className="hidden xl:block font-display font-extrabold text-lg text-gray-900 dark:text-gray-100 whitespace-nowrap">
          Vocera
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 p-2 flex-1 mt-2">
        {NAV_ITEMS.map(({ id, label, href, Icon }) => {
          const isActive = active === id;
          return (
            <Link
              key={id}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`
                relative flex items-center gap-3 px-3 py-2.5 rounded-xl
                transition-all duration-150 group
                ${isActive
                  ? "bg-[rgb(var(--accent)/0.12)] text-[rgb(var(--accent))] font-medium"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-100"
                }
              `}
            >
              {/* Active indicator bar */}
              {isActive && (
                <span className="absolute left-0 top-1/4 bottom-1/4 w-0.5 rounded-r bg-[rgb(var(--accent))]" />
              )}
              <Icon size={18} />
              <span className="hidden xl:block text-sm whitespace-nowrap">{label}</span>

              {/* Tooltip for icon-only mode */}
              <span className="
                xl:hidden absolute left-14 bg-gray-900 dark:bg-gray-700 text-white text-xs
                px-2 py-1 rounded-md whitespace-nowrap
                opacity-0 pointer-events-none group-hover:opacity-100
                transition-opacity duration-150 z-50
              ">
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom: theme toggle + user */}
      <div className="p-2 border-t border-theme space-y-1">
        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className="
            w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
            text-gray-500 dark:text-gray-400
            hover:bg-gray-100 dark:hover:bg-white/5
            hover:text-gray-900 dark:hover:text-gray-100
            transition-all duration-150
          "
        >
          {theme === "dark" ? <SunIcon size={18} /> : <MoonIcon size={18} />}
          <span className="hidden xl:block text-sm">
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </span>
        </button>

        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-all duration-150 cursor-pointer">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[rgb(var(--accent))] to-[rgb(var(--accent2))] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            AK
          </div>
          <div className="hidden xl:block overflow-hidden">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-none mb-0.5 truncate">Alex Khan</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Pro Plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
