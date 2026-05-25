import { NextResponse }  from "next/server"
import Stripe            from "stripe"
import { stripe }        from "@/lib/billing/stripe"
import {
  handleCheckoutCompleted,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleInvoicePaid,
  handleInvoicePaymentFailed,
  handleSubscriptionCreated,
} from "@/lib/billing/webhooks"


export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// bodyParser disable
export async function POST(req: Request) {
  
  const rawBody = await req.text()
  const sig     = req.headers.get("stripe-signature")

  if (!sig) {
    console.error("[webhook] Missing stripe-signature header")
    return NextResponse.json(
      { error: "Missing signature" },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Signature verification failed"
    console.error("[webhook] Signature failed:", msg)
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  console.log(`[webhook] Received: ${event.type} — ${event.id}`)

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session
        )
        break

      case "customer.subscription.created":
        await handleSubscriptionCreated(
          event.data.object as Stripe.Subscription
        )
        break

       case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        )
        break

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        )
        break

      // invoices
        
      case "invoice.paid":
        await handleInvoicePaid(
          event.data.object as Stripe.Invoice
        )
        break

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(
          event.data.object as Stripe.Invoice
        )
        break

      default:
        console.log(`[webhook] Unhandled event: ${event.type}`)
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[webhook] Handler failed for ${event.type}:`, msg)
    // 500 return করলে Stripe retry করবে
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}