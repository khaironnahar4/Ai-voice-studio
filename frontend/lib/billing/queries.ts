import prisma from "@/lib/auth/prisma"

export async function getBillingData(userId: string) {
  const [subscription, invoices, plans, charUsage] = await Promise.all([

    prisma.subscription.findFirst({
      where:   { userId, status: { in: ["active", "trialing", "past_due"] } },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    }),

    prisma.invoice.findMany({
      where:   { userId, status: "paid" },
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take:    12,
    }),

    prisma.plan.findMany({
      where:   { isActive: true },
      orderBy: { priceMonthly: "asc" },
    }),

    // Chars used this period
    prisma.subscription.findFirst({
      where:   { userId, status: { in: ["active", "trialing"] } },
      orderBy: { createdAt: "desc" },
    }).then(sub =>
      prisma.ttsRequest.aggregate({
        where: {
          userId,
          status:    { in: ["completed", "processing", "queued"] },
          createdAt: { gte: sub?.currentPeriodStart ?? new Date(0) },
        },
        _sum: { charCount: true },
      })
    ),
  ])

  return {
    subscription,
    invoices,
    plans,
    charsUsed: Number(charUsage._sum.charCount ?? 0),
  }
}