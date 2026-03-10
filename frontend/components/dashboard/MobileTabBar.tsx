"use client";

import Link from "next/link";
import { MicIcon, ClockIcon, WaveIcon, FolderIcon, SettingsIcon } from "@/utils/Icons";

const TABS = [
  { id: "compose",  label: "Compose",  href: "/dashboard",          Icon: MicIcon },
  { id: "history",  label: "History",  href: "/dashboard/history",  Icon: ClockIcon },
  { id: "voices",   label: "Voices",   href: "/dashboard/voices",   Icon: WaveIcon },
  { id: "projects", label: "Projects", href: "/dashboard/projects", Icon: FolderIcon },
  { id: "settings", label: "Settings", href: "/dashboard/settings", Icon: SettingsIcon },
];

export default function MobileTabBar({ active }: { active: string }) {
  return (
    <nav className="
      lg:hidden fixed bottom-0 left-0 right-0 z-40
      bg-surface border-t border-theme
      flex items-center justify-around
      px-2 py-2 pb-safe
    " aria-label="Mobile navigation">
      {TABS.map(({ id, label, href, Icon }) => {
        const isActive = active === id;
        return (
          <Link
            key={id}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`
              flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl min-w-[44px] min-h-[44px] justify-center
              transition-all duration-150
              ${isActive
                ? "text-[rgb(var(--accent))]"
                : "text-gray-400 dark:text-gray-500"
              }
            `}
          >
            <Icon size={20} />
            <span className="text-[10px] font-medium leading-none">{label}</span>
            {isActive && (
              <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-[rgb(var(--accent))]" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
