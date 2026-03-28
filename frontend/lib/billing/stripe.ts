import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-25.basil",
  typescript: true,
});

// ── Helpers ───────────────────────────────────────────────────

// Map your plan slug → Stripe Price ID for a given billing cycle
export function getStripePriceId(
  plan: { stripeMonthlyPriceId: string | null; stripeYearlyPriceId: string | null },
  cycle: "monthly" | "yearly"
): string {
  const priceId =
    cycle === "yearly" ? plan.stripeYearlyPriceId : plan.stripeMonthlyPriceId;
  if (!priceId) throw new Error(`No Stripe price ID for cycle: ${cycle}`);
  return priceId;
}

// Derive SubscriptionStatus from Stripe's status string
export function mapStripeStatus(
  stripeStatus: Stripe.Subscription.Status
): "active" | "trialing" | "past_due" | "cancelled" | "expired" {
  switch (stripeStatus) {
    case "active":             return "active";
    case "trialing":           return "trialing";
    case "past_due":           return "past_due";
    case "canceled":           return "cancelled";
    case "incomplete_expired": return "expired";
    default:                   return "expired";
  }
}

// Safely parse Stripe timestamps → JS Date (or null)
export function fromUnix(ts: number | null | undefined): Date | null {
  return ts ? new Date(ts * 1000) : null;
}