import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/auth/auth-client";
import prisma from "@/lib/auth/prisma";
import { getSession } from "@/lib/auth/session";
import { Bell, LogOut, Settings, Zap } from "lucide-react";
import Link from "next/link";

// Fetch user + plan in one query
async function getUserWithPlan(userId: string) {
  const sub = await prisma.subscription.findFirst({
    where:   { userId, status: { in: ["active", "trialing"] } },
    include: { plan: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  })
  return sub?.plan.name ?? "Free"
}

export default async function DesktopCTA() {
  const session = await getSession();
  const planName = session?.user.id ? await getUserWithPlan(session.user.id) : "Free";
  const notificationCount = 3; // Placeholder for unread notifications count
  const isPro = planName !== "Free";
  const planLabel = isPro ? planName : "Free";
  const user = {
    name: session?.user.name ?? "User",
    email: session?.user.email ?? "",
    image: session?.user.image ?? null,
    plan: planName,
  };
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div>
      {session ? (
        <div className="hidden md:flex items-center gap-3">
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
                                 ${
                                   isPro
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
                onClick={() => signOut()}
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
      ) : (
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/sign-in"
            className="text-sm font-medium text-vocera-muted hover:text-white transition-colors duration-150 px-3 py-2 rounded-lg hover:bg-white/5"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="relative inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl bg-vocera-purple hover:bg-vocera-violet transition-all duration-200 glow-purple-sm hover:glow-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vocera-violet"
          >
            Get Started Free
          </Link>
        </div>
      )}
    </div>
  );
}
