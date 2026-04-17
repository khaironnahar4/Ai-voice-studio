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
  const start =
    item.current_period_start ??
    sub.current_period_start;
  const end =
    item.current_period_end ??
    sub.current_period_end;

  if (!start || !end) {
    throw new Error(`Missing period data on subscription ${sub.id}`);
  }
  return { currentPeriodStart: start, currentPeriodEnd: end };
}

// ── Helper: Invoice এর subscription id safe ভাবে বের করা
function getInvoiceSubId(inv: Stripe.Invoice): string | null {
  const sub = inv.subscription;
  if (!sub) return null;
  if (typeof sub === "string") return sub;
  if (typeof sub === "object" && "id" in sub) return (sub as Stripe.Subscription).id;
  return null;
}

// ── checkout.session.completed ────────────────────────────────
export async function handleCheckoutCompleted(
  event: Stripe.CheckoutSessionCompletedEvent
) {
  const session = event.data.object;
  if (session.mode !== "subscription") return;

  const stripeSubId = session.subscription as string;
  const stripeSubData = await stripe.subscriptions.retrieve(stripeSubId, {
    expand: ["items.data.price"],
  });

  const userId       = session.metadata?.userId;
  const planSlug     = session.metadata?.planSlug;
  const billingCycle = session.metadata?.billingCycle as "monthly" | "yearly";

  if (!userId || !planSlug) {
    throw new Error(`Missing metadata on checkout session ${session.id}`);
  }

  const plan = await prisma.plan.findUnique({ where: { slug: planSlug } });
  if (!plan) throw new Error(`Plan not found: ${planSlug}`);

  const stripeCustomerId =
    typeof session.customer === "string"
      ? session.customer
      : (session.customer as Stripe.Customer)?.id ?? null;

  const { currentPeriodStart, currentPeriodEnd } = getPeriods(stripeSubData);

  // Cancel existing active subscriptions
  await prisma.subscription.updateMany({
    where: {
      userId,
      status: { in: ["active", "trialing"] },
    },
    data: {
      status:      "cancelled",
      cancelledAt: new Date(),
    },
  });

  await prisma.subscription.create({
    data: {
      userId,
      planId:               plan.id,
      status:               mapStripeStatus(stripeSubData.status),
      billingCycle,
      currentPeriodStart:   fromUnix(currentPeriodStart)!,
      currentPeriodEnd:     fromUnix(currentPeriodEnd)!,
      trialEndsAt:          fromUnix(stripeSubData.trial_end),
      stripeSubscriptionId: stripeSubId,
      stripeCustomerId,
    },
  });

  console.log(`[billing] subscription created for user ${userId} on plan ${planSlug}`);
}

// ── customer.subscription.updated ────────────────────────────
export async function handleSubscriptionUpdated(
  event: Stripe.CustomerSubscriptionUpdatedEvent
) {
  const sub = event.data.object;

  const existing = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: sub.id },
  });

  if (!existing) {
    console.warn(`[billing] subscription.updated: no DB row for ${sub.id}`);
    return;
  }

  // v17+ এ price সরাসরি item এ আছে (expanded হলে)
  const priceObj = sub.items.data[0]?.price;
  const stripePriceId = typeof priceObj === "string" ? priceObj : priceObj?.id;
  let planId = existing.planId;

  if (stripePriceId) {
    const newPlan = await prisma.plan.findFirst({
      where: {
        OR: [
          { stripeMonthlyPriceId: stripePriceId },
          { stripeYearlyPriceId:  stripePriceId },
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
      status:             mapStripeStatus(sub.status),
      currentPeriodStart: fromUnix(currentPeriodStart)!,
      currentPeriodEnd:   fromUnix(currentPeriodEnd)!,
      trialEndsAt:        fromUnix(sub.trial_end),
      cancelledAt:        sub.canceled_at ? fromUnix(sub.canceled_at) : null,
    },
  });
}

// ── customer.subscription.deleted ────────────────────────────
export async function handleSubscriptionDeleted(
  event: Stripe.CustomerSubscriptionDeletedEvent
) {
  const sub = event.data.object;

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: sub.id },
    data: {
      status:      "expired",
      cancelledAt: new Date(),
    },
  });

  console.log(`[billing] subscription expired: ${sub.id}`);
}

// ── invoice.paid ──────────────────────────────────────────────
export async function handleInvoicePaid(
  event: Stripe.InvoicePaidEvent
) {
  const inv = event.data.object;
  const subId = getInvoiceSubId(inv);
  if (!subId) return; // one-off charge, not a subscription

  const subscription = await prisma.subscription.findFirst({
    where:  { stripeSubscriptionId: subId },
    select: { id: true, userId: true },
  });
  if (!subscription) return;

  // Idempotency check
  const exists = await prisma.invoice.findFirst({
    where: { stripeInvoiceId: inv.id },
  });
  if (exists) return;

  const invoice = await prisma.invoice.create({
    data: {
      subscriptionId:  subscription.id,
      userId:          subscription.userId,
      status:          "paid",
      amountCents:     inv.amount_paid,
      currency:        inv.currency.toUpperCase(),
      periodStart:     fromUnix(inv.period_start)!,
      periodEnd:       fromUnix(inv.period_end)!,
      paidAt:          fromUnix(inv.status_transitions?.paid_at),
      stripeInvoiceId: inv.id,
      pdfUrl:          inv.invoice_pdf,
    },
  });

  // Line items — v17+ এ price আলাদা object
  const items = inv.lines.data.map((line) => {
    const priceObj = (line as any).price as Stripe.Price | null;
    const unitPrice = priceObj?.unit_amount ?? line.amount;

    return {
      invoiceId:      invoice.id,
      description:    line.description ?? "Subscription",
      quantity:       (line as any).quantity ?? 1,
      unitPriceCents: unitPrice,
      totalCents:     line.amount,
      type:           "plan" as const,
    };
  });

  await prisma.invoiceItem.createMany({ data: items });
}

// ── invoice.payment_failed ────────────────────────────────────
export async function handleInvoicePaymentFailed(
  event: Stripe.InvoicePaymentFailedEvent
) {
  const inv = event.data.object;
  const subId = getInvoiceSubId(inv);
  if (!subId) return;

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subId },
    data:  { status: "past_due" },
  });

  console.warn(`[billing] payment failed for subscription ${subId}`);
  // TODO: dunning email পাঠাও
}