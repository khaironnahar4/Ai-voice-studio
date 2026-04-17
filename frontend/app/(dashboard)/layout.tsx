import { redirect }    from "next/navigation"
import { getSession }  from "@/lib/auth/session"
import prisma          from "@/lib/auth/prisma"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { AppSidebar }  from "@/components/layout/user-dashboard/app-sidebar"
import { Topbar }      from "@/components/layout/user-dashboard/topbar"
import { MobileNav }   from "@/components/layout/user-dashboard/mobile-nav"

// Fetch user + plan in one query
async function getUserWithPlan(userId: string) {
  const sub = await prisma.subscription.findFirst({
    where:   { userId, status: { in: ["active", "trialing"] } },
    include: { plan: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  })
  return sub?.plan.name ?? "Free"
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Server-side auth guard
  const session = await getSession()
  if (!session) redirect("/sign-in")

  const planName = await getUserWithPlan(session.user.id)

  const user = {
    name:  session.user.name  ?? "User",
    email: session.user.email ?? "",
    image: session.user.image ?? null,
    plan:  planName,
  }

  return (
    <SidebarProvider
      defaultOpen={true}
      style={{
        // shadcn CSS variable overrides — match your palette
        "--sidebar-width":          "220px",
        "--sidebar-width-icon":     "56px",
        "--sidebar-background":     "rgb(20, 20, 36)",
        "--sidebar-foreground":     "rgb(255, 255, 255)",
        "--sidebar-border":         "rgb(40, 40, 70)",
        "--sidebar-accent":         "rgba(255,255,255,0.04)",
        "--sidebar-accent-foreground": "rgb(255,255,255)",
        "--sidebar-primary":        "rgb(120, 62, 246)",
        "--sidebar-primary-foreground": "rgb(255,255,255)",
        "--sidebar-ring":           "rgb(120, 62, 246)",
      } as React.CSSProperties}
    >
      {/* Desktop sidebar */}
      <AppSidebar user={user} />

      {/* Main area */}
      <SidebarInset
        className="bg-[rgb(var(--surface))] min-h-svh
                   pb-16 md:pb-0"   /* bottom padding for mobile nav */
      >
        {/* Topbar */}
        <Topbar user={user} notificationCount={0} />

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </SidebarInset>

      {/* Mobile bottom nav — only on small screens */}
      <MobileNav />
    </SidebarProvider>
  )
}