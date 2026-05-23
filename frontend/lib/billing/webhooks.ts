import Stripe from "stripe";
import { stripe, mapStripeStatus, fromUnix } from "./stripe";
import prisma from "@/lib/auth/prisma";

// ── Helper: Stripe v17+ এ current_period_start/end সরাসরি sub এ নেই,
//    item level এ আছে। তাই item থেকে নেওয়া হচ্ছে।
function getPeriods(sub: Stripe.Subscription): {
  currentPeriodStart: number;
  currentPeriodEnd: number;
} {
  const item = sub.items.data[0];
  // v17+ এ item level এ থাকে
  const start = item.current_period_start ?? sub.current_period_start;
  const end = item.current_period_end ?? sub.current_period_end;

  if (!start || !end) {
    throw new Error(`Missing period data on subscription ${sub.id}`);
  }
  return { currentPeriodStart: start, currentPeriodEnd: end };
}

// ── Helper ────────────────────────────────────────────────────────────

function mapStatus(
  s: Stripe.Subscription.Status,
): "active" | "trialing" | "past_due" | "cancelled" | "expired" {
  const map: Record<string, any> = {
    active: "active",
    trialing: "trialing",
    past_due: "past_due",
    canceled: "cancelled",
    incomplete: "past_due",
    incomplete_expired: "expired",
    unpaid: "past_due",
    paused: "cancelled",
  };
  return map[s] ?? "expired";
}

// ── Helper: Invoice এর subscription id safe ভাবে বের করা
function getInvoiceSubId(inv: Stripe.Invoice): string | null {
  const sub = inv.subscription;
  if (!sub) return null;
  if (typeof sub === "string") return sub;
  if (typeof sub === "object" && "id" in sub)
    return (sub as Stripe.Subscription).id;
  return null;
}

// ── checkout.session.completed ────────────────────────────────
export async function handleCheckoutCompleted(session: Stripe.CheckoutSession) {
  if (session.mode !== "subscription") return;

  // metadata check
  const userId = session.metadata?.userId;
  const planSlug = session.metadata?.planSlug;
  const billingCycle = (session.metadata?.billingCycle ?? "monthly") as
    | "monthly"
    | "yearly";

  if (!userId || !planSlug) {
    throw new Error(`Missing metadata on checkout session ${session.id}`);
  }

  // findout the current plan
  const plan = await prisma.plan.findUnique({ where: { slug: planSlug } });
  if (!plan) throw new Error(`Plan not found: ${planSlug}`);

  // find out the stripe subscription data
  const stripeSubId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

  if (!stripeSubId) throw new Error("No subscription ID in checkout session");

  const stripeSubData = await stripe.subscriptions.retrieve(stripeSubId, {
    expand: ["items.data.price"],
  });

  const stripeCustomerId =
    typeof session.customer === "string"
      ? session.customer
      : ((session.customer as Stripe.Customer)?.id ?? null);

  const { currentPeriodStart, currentPeriodEnd } = getPeriods(stripeSubData);

  // Cancel existing active subscriptions
  await prisma.subscription.updateMany({
    where: {
      userId,
      status: { in: ["active", "trialing"] },
    },
    data: {
      status: "cancelled",
      cancelledAt: new Date(),
    },
  });

  // Check if subscription already exists
  const existingSubscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: stripeSubId },
  });

  if (existingSubscription) {
    await prisma.subscription.update({
      where: { id: existingSubscription.id },
      data: {
        planId: plan.id,
        status: mapStripeStatus(stripeSubData.status),
        billingCycle,
        currentPeriodStart: fromUnix(currentPeriodStart)!,
        currentPeriodEnd: fromUnix(currentPeriodEnd)!,
        trialEndsAt: fromUnix(stripeSubData.trial_end),
        stripeCustomerId,
      },
    });
  } else {
    await prisma.subscription.create({
      data: {
        userId,
        planId: plan.id,
        status: mapStripeStatus(stripeSubData.status),
        billingCycle,
        currentPeriodStart: fromUnix(currentPeriodStart)!,
        currentPeriodEnd: fromUnix(currentPeriodEnd)!,
        trialEndsAt: fromUnix(stripeSubData.trial_end),
        stripeSubscriptionId: stripeSubId,
        stripeCustomerId,
      },
    });
  }

  console.log(
    `[billing] subscription created for user ${userId} on plan ${planSlug}`,
  );
}

// ── customer.subscription.created ─────────────────────────────────────
export async function handleSubscriptionCreated(sub: Stripe.Subscription) {
  const existing = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: sub.id },
  });

  // if subscription already exists, skip and update will be handled by subscription.updated event
  if (existing) {
    console.log(
      `[billing] subscription.created: row exists, skipping — ${sub.id}`,
    );
    return;
  }

  // if no existing subscription, create one.
  const userId = sub.metadata?.userId;
  const planSlug = sub.metadata?.planSlug;
  const billingCycle = (sub.metadata?.billingCycle ?? "monthly") as
    | "monthly"
    | "yearly";

  if (!userId || !planSlug) {
    console.warn(
      `[billing] subscription.created: missing metadata — ${sub.id}`,
    );
    return;
  }

  const plan = await prisma.plan.findUnique({ where: { slug: planSlug } });
  if (!plan) {
    console.error(
      `[billing] subscription.created: plan not found — ${planSlug}`,
    );
    return;
  }

  const customerId =
    typeof sub.customer === "string"
      ? sub.customer
      : ((sub.customer as Stripe.Customer)?.id ?? null);

  const { currentPeriodStart, currentPeriodEnd } = getPeriods(sub);

  await prisma.subscription.create({
    data: {
      userId,
      planId: plan.id,
      status: mapStatus(sub.status),
      billingCycle,
      currentPeriodStart: fromUnix(currentPeriodStart)!,
      currentPeriodEnd: fromUnix(currentPeriodEnd)!,
      trialEndsAt: fromUnix(sub.trial_end),
      stripeSubscriptionId: sub.id,
      stripeCustomerId: customerId,
    },
  });

  console.log(
    `[billing] subscription.created: fallback row created — ${sub.id}`,
  );
}

// ── customer.subscription.updated ────────────────────────────
export async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const existing = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: sub.id },
  });

  if (!existing) {
    console.warn(`[billing] subscription.updated: no DB row for ${sub.id}`);
    return;
  }

  // user metadata
  // const userId = sub.metadata?.userId;
  // const planSlug = sub.metadata?.planSlug;
  // const billingCycle = (sub.metadata?.billingCycle ?? "monthly") as
  //   | "monthly"
  //   | "yearly";

  // v17+ এ price সরাসরি item এ আছে
  const priceObj = sub.items.data[0]?.price;
  const stripePriceId = typeof priceObj === "string" ? priceObj : priceObj?.id;
  let planId = existing.planId;

  if (stripePriceId) {
    const newPlan = await prisma.plan.findFirst({
      where: {
        OR: [
          { stripeMonthlyPriceId: stripePriceId },
          { stripeYearlyPriceId: stripePriceId },
        ],
      },
    });
    if (newPlan) planId = newPlan.id;
  }

  const { currentPeriodStart, currentPeriodEnd } = getPeriods(sub);

  await prisma.subscription.update({
    where: { id: existing.id },
    data: {
      planId,
      status: mapStripeStatus(sub.status),
      currentPeriodStart: fromUnix(currentPeriodStart)!,
      currentPeriodEnd: fromUnix(currentPeriodEnd)!,
      trialEndsAt: fromUnix(sub.trial_end),
      cancelledAt: sub.canceled_at ? fromUnix(sub.canceled_at) : null,
    },
  });
}

// ── cancel user subscription when payment expired ────────────────────────────
export async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: sub.id },
    data: {
      status: "expired",
      cancelledAt: new Date(),
    },
  });

  console.log(`[billing] subscription expired: ${sub.id}`);
}

// ── successful payment with monthly renewal ──────────────────────────────────────────────
export async function handleInvoicePaid(inv: Stripe.Invoice) {
  const subId = getInvoiceSubId(inv);
  if (!subId) return; // one-off charge, not a subscription

  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subId },
    select: { id: true, userId: true },
  });
  if (!subscription) return;

  // Idempotency check
  const exists = await prisma.invoice.findFirst({
    where: { stripeInvoiceId: inv.id },
  });
  if (exists) return;

  // trial invoice
  const isTrial = inv.amount_paid === 0;

  await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.create({
      data: {
        subscriptionId: subscription.id,
        userId: subscription.userId,
        status: "paid",
        amountCents: inv.amount_paid, // 0 for trial
        currency: inv.currency.toUpperCase(),
        periodStart: fromUnix(inv.period_start)!,
        periodEnd: fromUnix(inv.period_end)!,
        paidAt: fromUnix(inv.status_transitions?.paid_at),
        stripeInvoiceId: inv.id,
        pdfUrl: inv.invoice_pdf ?? null,
      },
    });

    const items = inv.lines.data.map((line) => {
      const priceObj = (line as any).price as Stripe.Price | null;
      return {
        invoiceId: invoice.id,
        description: isTrial
          ? "7-day free trial"
          : (line.description ?? "Subscription"),
        quantity: (line as any).quantity ?? 1,
        unitPriceCents: priceObj?.unit_amount ?? line.amount,
        totalCents: line.amount,
        type: "plan" as const,
      };
    });

    if (items.length > 0) {
      await tx.invoiceItem.createMany({ data: items });
    }

    // Real payment হলে subscription status active করো
    if (!isTrial) {
      await tx.subscription.updateMany({
        where: { stripeSubscriptionId: subId },
        data: { status: "active" },
      });
    }
  });

  console.log(
    isTrial
      ? `[billing] trial invoice recorded (${inv.id})`
      : `[billing] invoice paid: $${inv.amount_paid / 100} (${inv.id})`
  );
}

// ── invoice payment failed ────────────────────────────────────
export async function handleInvoicePaymentFailed(inv: Stripe.Invoice) {
  const subId = getInvoiceSubId(inv);
  if (!subId) return;

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subId },
    data: { status: "past_due" },
  });

  console.warn(`[billing] payment failed for subscription ${subId}`);
  // TODO: dunning email পাঠাও
}
