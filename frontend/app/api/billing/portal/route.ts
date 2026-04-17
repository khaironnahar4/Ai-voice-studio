import { NextResponse }     from "next/server"
import { requireSession }   from "@/lib/auth/session"
import { stripe }           from "@/lib/billing/stripe"
import prisma               from "@/lib/auth/prisma"

export async function POST(_req: Request) {
  const { user } = await requireSession()

  const sub = await prisma.subscription.findFirst({
    where:   { userId: user.id, stripeCustomerId: { not: null } },
    select:  { stripeCustomerId: true },
    orderBy: { createdAt: "desc" },
  })

  if (!sub?.stripeCustomerId) {
    return NextResponse.json(
      { error: "No Stripe customer found." },
      { status: 404 }
    )
  }

  const session = await stripe.billingPortal.sessions.create({
    customer:   sub.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
  })

  return NextResponse.json({ url: session.url })
}