import { NextResponse }  from "next/server"
import Stripe            from "stripe"
import { stripe }        from "@/lib/billing/stripe"
import { handleCheckoutCompleted, 
    handleInvoicePaid, 
    handleInvoicePaymentFailed, 
    handleSubscriptionDeleted,
    handleSubscriptionUpdated } from "@/lib/billing/webhooks"


export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const rawBody = await req.text()
  const sig     = req.headers.get("stripe-signature")!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Signature failed"
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event as Stripe.CheckoutSessionCompletedEvent)
        break
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event as Stripe.CustomerSubscriptionUpdatedEvent)
        break
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event as Stripe.CustomerSubscriptionDeletedEvent)
        break
      case "invoice.paid":
        await handleInvoicePaid(event as Stripe.InvoicePaidEvent)
        break
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event as Stripe.InvoicePaymentFailedEvent)
        break
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[webhook] ${event.type} failed:`, msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}