import Stripe from "stripe";
import { stripe, mapStripeStatus, fromUnix } from "./stripe";
import  prisma  from "@/lib/auth/prisma";

// ── checkout.session.completed ────────────────────────────────
// Fires when a user completes checkout. Creates the subscription row.
export async function handleCheckoutCompleted(
  event: Stripe.CheckoutSessionCompletedEvent
) {
  const session = event.data.object;
  if (session.mode !== "subscription") return;

  const stripeSubId   = session.subscription as string;
  const stripeSubData = await stripe.subscriptions.retrieve(stripeSubId);

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
      : session.customer?.id ?? null;

  // Cancel any existing active subscription before creating a new one
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
      planId:              plan.id,
      status:              mapStripeStatus(stripeSubData.status),
      billingCycle,
      currentPeriodStart:  fromUnix(stripeSubData.current_period_start)!,
      currentPeriodEnd:    fromUnix(stripeSubData.current_period_end)!,
      trialEndsAt:         fromUnix(stripeSubData.trial_end),
      stripeSubscriptionId: stripeSubId,
      stripeCustomerId,
    },
  });

  console.log(`[billing] subscription created for user ${userId} on plan ${planSlug}`);
}

// ── customer.subscription.updated ────────────────────────────
// Fires on renewals, plan upgrades, payment retries, trial endings.
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

  // Detect plan change (upgrade/downgrade)
  const stripePriceId = sub.items.data[0]?.price.id;
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

  await prisma.subscription.update({
    where: { id: existing.id },
    data: {
      planId,
      status:             mapStripeStatus(sub.status),
      currentPeriodStart: fromUnix(sub.current_period_start)!,
      currentPeriodEnd:   fromUnix(sub.current_period_end)!,
      trialEndsAt:        fromUnix(sub.trial_end),
      cancelledAt:        sub.canceled_at ? fromUnix(sub.canceled_at) : null,
    },
  });
}

// ── customer.subscription.deleted ────────────────────────────
// Fires when a subscription fully expires (after cancellation period ends).
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
// Fires on every successful charge — creates invoice + items rows.
export async function handleInvoicePaid(
  event: Stripe.InvoicePaidEvent
) {
  const inv = event.data.object;
  if (!inv.subscription) return; // one-off charges — not relevant

  const subscription = await prisma.subscription.findFirst({
    where:  { stripeSubscriptionId: inv.subscription as string },
    select: { id: true, userId: true },
  });
  if (!subscription) return;

  // Idempotency: skip if already recorded
  const exists = await prisma.invoice.findFirst({
    where: { stripeInvoiceId: inv.id },
  });
  if (exists) return;

  const invoice = await prisma.invoice.create({
    data: {
      subscriptionId: subscription.id,
      userId:         subscription.userId,
      status:         "paid",
      amountCents:    inv.amount_paid,
      currency:       inv.currency.toUpperCase(),
      periodStart:    fromUnix(inv.period_start)!,
      periodEnd:      fromUnix(inv.period_end)!,
      paidAt:         fromUnix(inv.status_transitions?.paid_at),
      stripeInvoiceId: inv.id,
      pdfUrl:         inv.invoice_pdf,
    },
  });

  // Write line items
  const items = inv.lines.data.map((line) => ({
    invoiceId:     invoice.id,
    description:   line.description ?? "Subscription",
    quantity:      line.quantity ?? 1,
    unitPriceCents: line.price?.unit_amount ?? line.amount,
    totalCents:    line.amount,
    type:          "plan" as const,
  }));

  await prisma.invoiceItem.createMany({ data: items });
}

// ── invoice.payment_failed ────────────────────────────────────
// Stripe retries automatically — we just surface the status.
export async function handleInvoicePaymentFailed(
  event: Stripe.InvoicePaymentFailedEvent
) {
  const inv = event.data.object;
  if (!inv.subscription) return;

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: inv.subscription as string },
    data:  { status: "past_due" },
  });

  console.warn(`[billing] payment failed for subscription ${inv.subscription}`);
  // TODO: send dunning email via your email job queue
}