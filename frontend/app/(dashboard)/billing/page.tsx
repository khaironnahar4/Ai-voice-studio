import { requireSession }    from "@/lib/auth/session"
import { getBillingData }    from "@/lib/billing/queries"
import { UsageCard }         from "@/components/billing/usage-card"
import { InvoiceList }       from "@/components/billing/invoice-list"
import { PlanCards } from "@/components/billing/plan-cards"

export default async function BillingPage() {
  const { user }                            = await requireSession()
  const { subscription, invoices, plans, charsUsed } =
    await getBillingData(user.id)

  // Success/cancel toast — handle via searchParams
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">
          Billing
        </h1>
        <p className="text-sm text-white/35 mt-1">
          Manage your plan, usage, and payment history.
        </p>
      </div>

      {/* Usage + current plan */}
      <UsageCard
        charsUsed={charsUsed}
        charLimit={Number(subscription?.plan.charLimitMonthly ?? BigInt(10000))}
        planName={subscription?.plan.name ?? "Free"}
        periodEnd={subscription?.currentPeriodEnd ?? null}
        status={subscription?.status ?? "active"}
        trialEndsAt={subscription?.trialEndsAt ?? null}
      />

      {/* Plan selection */}
      <PlanCards
        plans={plans.map(p => ({
          ...p,
          priceMonthly: p.priceMonthly,
          priceYearly:  p.priceYearly,
        }))}
        currentPlanId={subscription?.planId ?? null}
        currentStatus={subscription?.status ?? null}
        stripeCustomerId={subscription?.stripeCustomerId ?? null}
      />

      {/* Invoice history */}
      <InvoiceList
        invoices={invoices.map(inv => ({
          id:          inv.id,
          amountCents: inv.amountCents,
          currency:    inv.currency,
          paidAt:      inv.paidAt,
          pdfUrl:      inv.pdfUrl,
          periodStart: inv.periodStart,
          periodEnd:   inv.periodEnd,
        }))}
      />
    </div>
  )
}