import { NextResponse }        from "next/server"
import { z }                   from "zod"
import { requireSession }      from "@/lib/auth/session"
import { createCheckoutSession } from "@/lib/billing/checkout"

const Schema = z.object({
  planSlug:     z.string(),
  billingCycle: z.enum(["monthly", "yearly"]).default("monthly"),
})

export async function POST(req: Request) {
  const { user } = await requireSession()

  const parsed = Schema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 422 })
  }

  if (parsed.data.planSlug === "free") {
    return NextResponse.json(
      { error: "Manage plan via customer portal." },
      { status: 400 }
    )
  }

  try {
    const url = await createCheckoutSession({
      userId:       user.id,
      userEmail:    user.email,
      planSlug:     parsed.data.planSlug,
      billingCycle: parsed.data.billingCycle,
    })
    return NextResponse.json({ url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Checkout failed"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}