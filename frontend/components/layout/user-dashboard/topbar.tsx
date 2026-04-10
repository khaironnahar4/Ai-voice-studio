"use client"

import Link                      from "next/link"
import { usePathname }           from "next/navigation"
import { SidebarTrigger }        from "@/components/ui/sidebar"
import { Separator }             from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, Search, Zap, LogOut, Settings } from "lucide-react"
import { signOut } from "@/lib/auth/auth-client"
import { useRouter } from "next/navigation"

// Page title map
const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/studio":    "Studio",
  "/history":   "History",
  "/billing":   "Billing",
  "/settings":  "Settings",
}

interface TopbarProps {
  user: {
    name:  string
    email: string
    plan?: string
  }
  notificationCount?: number
}

export function Topbar({ user, notificationCount = 0 }: TopbarProps) {
  const pathname = usePathname()
  const router   = useRouter()

  const pageTitle = PAGE_TITLES[pathname] ??
    Object.entries(PAGE_TITLES).find(([p]) =>
      pathname.startsWith(p + "/")
    )?.[1] ?? "Dashboard"

  const initials = user.name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const planLabel = user.plan ?? "Free"
  const isPro     = planLabel !== "Free"

  async function handleSignOut() {
    await signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <header
      className="flex h-14 shrink-0 items-center gap-2 px-4
                 border-b border-[rgb(var(--vborder))]
                 bg-[rgb(var(--surface-2))] sticky top-0 z-30"
    >
      {/* Sidebar toggle trigger */}
      <SidebarTrigger
        className="text-white/40 hover:text-white hover:bg-white/6
                   h-8 w-8 rounded-lg transition-all duration-150
                   -ml-1"
      />

      <Separator
        orientation="vertical"
        className="h-4 bg-[rgb(var(--vborder))] mx-1"
      />

      {/* Page title */}
      <h1 className="text-sm font-medium text-white/85">
        {pageTitle}
      </h1>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-1.5">

        {/* Search */}
        <button
          className="h-8 w-8 rounded-lg flex items-center justify-center
                     text-white/40 hover:text-white
                     border border-[rgb(var(--vborder))]
                     bg-[rgb(var(--surface-3))] hover:bg-white/8
                     transition-all duration-150"
          aria-label="Search"
        >
          <Search className="h-3.5 w-3.5" />
        </button>

        {/* Notifications */}
        <button
          className="relative h-8 w-8 rounded-lg flex items-center justify-center
                     text-white/40 hover:text-white
                     border border-[rgb(var(--vborder))]
                     bg-[rgb(var(--surface-3))] hover:bg-white/8
                     transition-all duration-150"
          aria-label={`Notifications${notificationCount > 0 ? ` (${notificationCount} unread)` : ""}`}
        >
          <Bell className="h-3.5 w-3.5" />
          {notificationCount > 0 && (
            <span
              className="absolute top-[5px] right-[5px] w-[7px] h-[7px]
                         rounded-full bg-red-500
                         border-[1.5px] border-[rgb(var(--surface-2))]"
            />
          )}
        </button>

        {/* Plan pill */}
        <Link
          href="/billing"
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full
                     text-[11px] font-medium border transition-all duration-150
                     ${isPro
                       ? "bg-[rgba(120,62,246,0.15)] text-[rgb(167,139,250)] border-[rgba(120,62,246,0.3)] hover:bg-[rgba(120,62,246,0.25)]"
                       : "bg-[rgba(245,158,11,0.12)] text-amber-400 border-[rgba(245,158,11,0.25)] hover:bg-[rgba(245,158,11,0.2)]"
                     }`}
        >
          <Zap className="h-2.5 w-2.5" />
          {planLabel}
        </Link>

        {/* User avatar dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="rounded-full focus:outline-none focus:ring-2
                         focus:ring-[rgb(var(--accent))] focus:ring-offset-1
                         focus:ring-offset-[rgb(var(--surface-2))]"
              aria-label="User menu"
            >
              <Avatar className="h-7 w-7">
                <AvatarFallback
                  className="bg-[rgba(120,62,246,0.3)]
                             text-[rgb(167,139,250)]
                             text-[10px] font-semibold"
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-52 bg-[#141424] border-[#282846] text-white"
          >
            <DropdownMenuLabel className="py-2 font-normal">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-white">
                  {user.name}
                </span>
                <span className="text-xs text-white/40 truncate">
                  {user.email}
                </span>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="bg-[#282846]" />

            <DropdownMenuItem
              asChild
              className="cursor-pointer text-white/60 hover:text-white
                         hover:bg-white/5 focus:bg-white/5 focus:text-white"
            >
              <Link href="/settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem
              asChild
              className="cursor-pointer text-white/60 hover:text-white
                         hover:bg-white/5 focus:bg-white/5 focus:text-white"
            >
              <Link href="/billing">
                <Zap className="h-4 w-4 mr-2" />
                Upgrade plan
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-[#282846]" />

            <DropdownMenuItem
              onClick={handleSignOut}
              className="cursor-pointer text-red-400 hover:text-red-300
                         hover:bg-red-500/10 focus:bg-red-500/10
                         focus:text-red-300"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </header>
  )
}