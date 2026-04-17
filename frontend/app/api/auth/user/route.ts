import { NextResponse }  from "next/server"
import { getSession }    from "@/lib/auth/session"
import prisma            from "@/lib/auth/prisma"

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ user: null })
  }

  // Plan info সহ user fetch করো
  const subscription = await prisma.subscription.findFirst({
    where:   { userId: session.user.id, status: { in: ["active","trialing"] } },
    include: { plan: { select: { name: true, id: true } } },
    orderBy: { createdAt: "desc" },
  })

  const user = {
    id:            session.user.id,
    name:          session.user.name  ?? "",
    email:         session.user.email ?? "",
    image:         session.user.image ?? null,
    role:          (session.user.role ?? "user") as "user" | "admin",
    emailVerified: session.user.emailVerified ?? false,
    banned:        session.user.banned ?? false,
    plan:          (subscription?.plan.name ?? "Free") as "Free"|"Pro"|"Business",
    planId:        subscription?.plan.id ?? null,
  }

  return NextResponse.json({ user })
}