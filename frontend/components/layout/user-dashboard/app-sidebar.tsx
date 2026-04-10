"use client"

import Link        from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { NAV_MAIN, NAV_ACCOUNT } from "@/lib/nav/nav"
import { signOut } from "@/lib/auth/auth-client"
import { useRouter } from "next/navigation"
import {
  ChevronsUpDown,
  LogOut,
  User,
  Zap,
} from "lucide-react"

// ── Logo mark ─────────────────────────────────────────────────────────────
function VoceraLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
      <path
        d="M2 7C2 4 4 2 7 2C10 2 12 4 12 7"
        stroke="rgb(var(--accent-light))"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M2 7C2 10 4 12 7 12"
        stroke="rgb(var(--cyan))"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="7" cy="7" r="1.5" fill="rgb(var(--accent))" />
    </svg>
  )
}

// ── Badge variants ─────────────────────────────────────────────────────────
function NavBadge({
  text,
  variant,
}: {
  text:    string
  variant: "new" | "plan"
}) {
  if (variant === "new") {
    return (
      <span
        className="ml-auto px-1.5 py-0.5 rounded-md text-[9px] font-semibold
                   bg-[rgba(120,62,246,0.2)] text-[rgb(167,139,250)]
                   border border-[rgba(120,62,246,0.3)]"
      >
        {text}
      </span>
    )
  }
  return (
    <span
      className="ml-auto px-1.5 py-0.5 rounded-md text-[9px] font-semibold
                 bg-[rgba(245,158,11,0.15)] text-amber-400
                 border border-[rgba(245,158,11,0.25)]"
    >
      {text}
    </span>
  )
}

// ── Sidebar props ──────────────────────────────────────────────────────────
interface AppSidebarProps {
  user: {
    name:  string
    email: string
    image?: string | null
    plan?: string
  }
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const { state } = useSidebar()   // "expanded" | "collapsed"

  const isCollapsed = state === "collapsed"

  // Initials from name
  const initials = user.name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  async function handleSignOut() {
    await signOut()
    router.push("/")
    router.refresh()
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-[rgb(var(--vborder))] bg-[rgb(var(--surface-2))]"
    >

      {/* ── Header — Logo ────────────────────────────────────────────── */}
      <SidebarHeader className="border-b border-[rgb(var(--vborder))] h-14">
        <SidebarMenu className="p-0">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className="hover:bg-transparent active:bg-transparent"
            >
              <Link href="/dashboard" className="flex items-center gap-2.5">
                {/* Icon */}
                <div
                  className="flex h-8 w-8 items-center justify-center
                             rounded-lg bg-[rgba(120,62,246,0.2)] shrink-0"
                >
                  <VoceraLogo />
                </div>
                {/* Text — hidden when collapsed */}
                <span
                  className="font-semibold text-white text-sm
                             group-data-[collapsible=icon]:hidden"
                >
                  Vocera AI
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* ── Content — Nav items ──────────────────────────────────────── */}
      <SidebarContent className="py-2">

        {/* Main group */}
        <SidebarGroup>
          <SidebarGroupLabel
            className="text-[10px] text-white/25 uppercase tracking-widest
                       group-data-[collapsible=icon]:hidden"
          >
            Main
          </SidebarGroupLabel>

          <SidebarMenu className="p-0">
            {NAV_MAIN.map(item => {
              const active = isActive(item.href)
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={active}
                    tooltip={item.title}
                    className={`
                      relative h-9 rounded-lg transition-all duration-150
                      group-data-[collapsible=icon]:justify-center
                      ${active
                        ? "bg-[rgba(120,62,246,0.15)] text-[rgb(167,139,250)]"
                        : "text-white/50 hover:text-white hover:bg-white/5"
                      }
                    `}
                  >
                    <Link href={item.href}>
                      {/* Active indicator bar */}
                      {active && (
                        <span
                          className="absolute left-0 top-1/2 -translate-y-1/2
                                     w-[3px] h-4 rounded-r-full
                                     bg-[rgb(120,62,246)]"
                        />
                      )}

                      <item.icon
                        className={`h-4 w-4 shrink-0
                          ${active
                            ? "text-[rgb(120,62,246)]"
                            : "text-white/40 group-hover:text-white/60"
                          }`}
                      />

                      <span className="group-data-[collapsible=icon]:hidden">
                        {item.title}
                      </span>

                      {item.badge && item.badgeVariant && (
                        <span className="group-data-[collapsible=icon]:hidden">
                          <NavBadge
                            text={item.badge}
                            variant={item.badgeVariant}
                          />
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>

        {/* Account group */}
        <SidebarGroup className="mt-2">
          <SidebarGroupLabel
            className="text-[10px] text-white/25 uppercase tracking-widest
                       group-data-[collapsible=icon]:hidden"
          >
            Account
          </SidebarGroupLabel>

          <SidebarMenu className="p-0">
            {NAV_ACCOUNT.map(item => {
              const active = isActive(item.href)
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={active}
                    tooltip={item.title}
                    className={`
                      relative h-9 rounded-lg transition-all duration-150
                      group-data-[collapsible=icon]:justify-center
                      ${active
                        ? "bg-[rgba(120,62,246,0.15)] text-[rgb(167,139,250)]"
                        : "text-white/50 hover:text-white hover:bg-white/5"
                      }
                    `}
                  >
                    <Link href={item.href}>
                      {active && (
                        <span
                          className="absolute left-0 top-1/2 -translate-y-1/2
                                     w-[3px] h-4 rounded-r-full
                                     bg-[rgb(120,62,246)]"
                        />
                      )}

                      <item.icon
                        className={`h-4 w-4 shrink-0
                          ${active
                            ? "text-[rgb(120,62,246)]"
                            : "text-white/40 group-hover:text-white/60"
                          }`}
                      />

                      <span className="group-data-[collapsible=icon]:hidden">
                        {item.title}
                      </span>

                      {/* Collapsed state — plan dot indicator */}
                      {item.badgeVariant === "plan" && isCollapsed && (
                        <span
                          className="absolute top-1 right-1 w-1.5 h-1.5
                                     rounded-full bg-amber-400"
                        />
                      )}

                      {item.badge && item.badgeVariant && (
                        <span className="group-data-[collapsible=icon]:hidden">
                          <NavBadge
                            text={item.badge}
                            variant={item.badgeVariant}
                          />
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>

      </SidebarContent>

      {/* ── Footer — User dropdown ────────────────────────────────────── */}
      <SidebarFooter
        className="border-t border-[rgb(var(--vborder))] py-2"
      >
        <SidebarMenu className="p-0">
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  tooltip={user.name}
                  className="h-10 hover:bg-white/5 data-[state=open]:bg-white/5
                             group-data-[collapsible=icon]:justify-center"
                >
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback
                      className="bg-[rgba(120,62,246,0.3)]
                                 text-[rgb(167,139,250)] text-xs font-semibold"
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div
                    className="flex flex-col min-w-0
                               group-data-[collapsible=icon]:hidden"
                  >
                    <span className="text-xs font-medium text-white/85 truncate">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-white/35 truncate">
                      {user.email}
                    </span>
                  </div>

                  <ChevronsUpDown
                    className="ml-auto h-3.5 w-3.5 text-white/25
                               group-data-[collapsible=icon]:hidden"
                  />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                side="top"
                align="start"
                sideOffset={8}
                className="w-52 bg-[#141424] border-[#282846] text-white"
              >
                <DropdownMenuLabel className="font-normal py-2">
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
                    <User className="h-4 w-4 mr-2" />
                    Profile settings
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
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* Rail — collapse toggle handle on the edge */}
      <SidebarRail className="hover:bg-[rgba(120,62,246,0.1)]" />
    </Sidebar>
  )
}