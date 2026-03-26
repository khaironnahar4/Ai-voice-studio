import prisma from "../auth/prisma";

export type QuotaCheckResult =
  | { allowed: true }
  | {
      allowed: false;
      reason: string;
      code: "NO_SUBSCRIPTION" | "CHAR_LIMIT" | "REQUEST_LIMIT" | "BANNED";
    };

export async function checkUserQuota(
  userId: string,
  incomingCharCount: number,
): Promise<QuotaCheckResult> {

  // Banned user check. This is separate from subscription status, and should be checked first to avoid leaking info about subscription status to banned users.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { banned: true, banExpires: true },
  });

  if (user?.banned) {
    const isExpired = user.banExpires && user.banExpires < new Date();
    if (!isExpired) {
      return { allowed: false, reason: "Account is banned.", code: "BANNED" };
    }
  }

  // Load active subscription + plan in one query. If no active subscription, we can exit early before doing any of the usage queries.
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: ["active", "trialing"] },
    },
    include: { plan: true },
  });

  if (!subscription) {
    return {
      allowed: false,
      reason: "No active subscription.",
      code: "NO_SUBSCRIPTION",
    };
  }

  const { plan } = subscription;

  // ── Character quota. It count total used characters. ─────────────────────────────────────────
  if (plan.charLimitMonthly !== null) {
    // Sum chars used this calendar month
    const periodStart = new Date(subscription.currentPeriodStart);

    const used = await prisma.ttsRequest.aggregate({
      where: {
        userId,
        status: { in: ["completed", "processing", "queued"] },
        createdAt: { gte: periodStart },
      },
      _sum: { charCount: true },
    });

    const totalUsed = Number(used._sum.charCount ?? 0);
    const limit = Number(plan.charLimitMonthly);

    if (totalUsed + incomingCharCount > limit) {
      return {
        allowed: false,
        reason: `Character limit reached (${totalUsed.toLocaleString()} / ${limit.toLocaleString()}).`,
        code: "CHAR_LIMIT",
      };
    }
  }

  // ── Request quota. Total request per month. ───────────────────────────────────────────
  if (plan.requestLimitMonthly !== null) {
    const count = await prisma.ttsRequest.count({
      where: {
        userId,
        createdAt: { gte: subscription.currentPeriodStart },
        status: { not: "cancelled" },
      },
    });

    if (count >= plan.requestLimitMonthly) {
      return {
        allowed: false,
        reason: `Monthly request limit reached (${plan.requestLimitMonthly}).`,
        code: "REQUEST_LIMIT",
      };
    }
  }

  return { allowed: true };
}
