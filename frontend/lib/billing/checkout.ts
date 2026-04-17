import Stripe from "stripe";
import { stripe, getStripePriceId } from "./stripe";
import  prisma  from "@/lib/auth/prisma";

interface CreateCheckoutParams {
  userId:       string;
  userEmail:    string;
  planSlug:     string;
  billingCycle: "monthly" | "yearly";
}

export async function createCheckoutSession({
  userId,
  userEmail,
  planSlug,
  billingCycle,
}: CreateCheckoutParams): Promise<string> {
  const plan = await prisma.plan.findUnique({
    where:  { slug: planSlug, isActive: true },
  });
  if (!plan) throw new Error(`Plan not found: ${planSlug}`);

  const priceId = getStripePriceId(plan, billingCycle);

  // Reuse existing Stripe customer if the user has one
  const existingSub = await prisma.subscription.findFirst({
    where:  { userId, stripeCustomerId: { not: null } },
    select: { stripeCustomerId: true },
    orderBy: { createdAt: "desc" },
  });

  const customerParams: Stripe.Checkout.SessionCreateParams =
    existingSub?.stripeCustomerId
      ? { customer: existingSub.stripeCustomerId }
      : { customer_email: userEmail };

  const session = await stripe.checkout.sessions.create({
    ...customerParams,
    mode:                "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: planSlug === "pro" ? 7 : undefined,
      metadata: {
        userId,
        planSlug,
        billingCycle,
      },
    },
    metadata: { userId, planSlug, billingCycle },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL}/billing?cancelled=true`,
    allow_promotion_codes: true,
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL.");
  return session.url;
}