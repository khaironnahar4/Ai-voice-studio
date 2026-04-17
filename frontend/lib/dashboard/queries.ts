import prisma from "@/lib/auth/prisma"

export async function getDashboardData(userId: string) {
  const now          = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    subscription,
    totalRequests,
    todayRequests,
    audioFiles,
    charUsed,
    recentGenerations,
    usageHistory,
  ] = await Promise.all([

    // Active subscription + plan
    prisma.subscription.findFirst({
      where:   { userId, status: { in: ["active", "trialing"] } },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    }),

    // All-time completed requests
    prisma.ttsRequest.count({
      where: { userId, status: "completed" },
    }),

    // Today's requests
    prisma.ttsRequest.count({
      where: {
        userId,
        status:    "completed",
        createdAt: { gte: startOfToday },
      },
    }),

    // Audio files summary
    prisma.audioFile.aggregate({
      where:  { userId, deletedAt: null },
      _count: { id: true },
      _sum:   { fileSizeBytes: true },
    }),

    // Chars used this billing period
    prisma.ttsRequest.aggregate({
      where: {
        userId,
        status:    { in: ["completed", "processing", "queued"] },
        createdAt: { gte: startOfMonth },
      },
      _sum: { charCount: true },
    }),

    // Last 5 generations for the recent list
    prisma.ttsRequest.findMany({
      where: { userId, status: "completed" },
      include: {
        voiceModel: { select: { name: true, provider: true, edgeVoiceName: true } },
        audioFile:  { select: { signedUrl: true, durationSeconds: true, fileFormat: true } },
      },
      orderBy: { createdAt: "desc" },
      take:    5,
    }),

    // Last 7 days — daily char counts for the mini chart
    prisma.ttsRequest.groupBy({
      by:     ["createdAt"],
      where: {
        userId,
        status:    "completed",
        createdAt: {
          gte: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
        },
      },
      _sum: { charCount: true },
    }),
  ])

  const charLimit  = Number(subscription?.plan.charLimitMonthly ?? 10_000)
  const charUsedN  = Number(charUsed._sum.charCount ?? 0)
  const charPct    = Math.min(Math.round((charUsedN / charLimit) * 100), 100)
  const storageMb  = Number(audioFiles._sum.fileSizeBytes ?? 0) / 1_048_576

  // Build 7-day chart data — fill missing days with 0
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d    = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000)
    const day  = d.toLocaleDateString("en-US", { weekday: "short" })
    const dateStr = d.toDateString()
    const match = usageHistory.find(
      r => new Date(r.createdAt).toDateString() === dateStr
    )
    return { day, chars: Number(match?._sum.charCount ?? 0) }
  })

  return {
    plan:         subscription?.plan ?? null,
    subscription,
    stats: {
      totalRequests,
      todayRequests,
      audioFiles:  audioFiles._count.id,
      storageMb:   Math.round(storageMb * 10) / 10,
    },
    usage: {
      charUsed:  charUsedN,
      charLimit,
      charPct,
    },
    recentGenerations,
    chartData,
  }
}