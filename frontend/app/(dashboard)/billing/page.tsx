import { requireSession } from "@/lib/auth/session";
import { getBillingData } from "@/lib/billing/queries";
import { UsageCard } from "@/components/billing/usage-card";
import { UpgradeCard } from "@/components/billing/upgrade-card";
import { PlanCards } from "@/components/billing/plan-cards";
import { InvoiceList } from "@/components/billing/invoice-list";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: { success?: string; cancelled?: string };
}) {
  const params = await searchParams
  const { user } = await requireSession();
  const { subscription, invoices, plans, charsUsed } = await getBillingData(
    user.id,
  );

  const isFreePlan = !subscription || subscription.plan.slug === "free";

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl space-y-5">
      {/* Toast messages */}
      {params.success && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl
                        bg-teal-500/10 border border-teal-500/25
                        animate-in slide-in-from-top-2 duration-300"
        >
          <svg
            className="w-4 h-4 text-teal-400 shrink-0"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm3.78 5.78l-4.5 4.5a.75.75 0 0 1-1.06 0l-2-2a.75.75 0 1 1 1.06-1.06L6.75 9.69l3.97-3.97a.75.75 0 1 1 1.06 1.06z" />
          </svg>
          <p className="text-sm text-teal-300 font-medium">
            Plan upgraded successfully! Your new limits are now active.
          </p>
        </div>
      )}

      {params.cancelled && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl
                        bg-[#282846] border border-[rgba(40,40,70,1)]"
        >
          <p className="text-sm text-white/40">
            Checkout was cancelled. You&apos;re still on the Free plan.
          </p>
        </div>
      )}

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">
          Billing
        </h1>
        <p className="text-sm text-white/35 mt-1">
          Manage your plan, usage, and payment history.
        </p>
      </div>

      {/* Usage card — always shown */}
      <UsageCard
        charsUsed={charsUsed}
        charLimit={Number(subscription?.plan.charLimitMonthly ?? 1000)}
        planName={subscription?.plan.name ?? "Free"}
        periodEnd={subscription?.currentPeriodEnd ?? null}
        status={subscription?.status ?? "active"}
        trialEndsAt={subscription?.trialEndsAt ?? null}
      />

      {/*
        Free plan   → UpgradeCard (prominent) + empty InvoiceList
        Paid plan   → PlanCards (manage) + InvoiceList
      */}
      {isFreePlan ? (
        <>
          <UpgradeCard />
          <InvoiceList invoices={[]} />
        </>
      ) : (
        <>
          <PlanCards
            plans={plans}
            currentPlanId={subscription?.planId ?? null}
            currentStatus={subscription?.status ?? null}
            stripeCustomerId={subscription?.stripeCustomerId ?? null}
          />
          <InvoiceList
            invoices={invoices.map((inv) => ({
              id: inv.id,
              amountCents: inv.amountCents,
              currency: inv.currency,
              paidAt: inv.paidAt,
              pdfUrl: inv.pdfUrl,
              periodStart: inv.periodStart,
              periodEnd: inv.periodEnd,
            }))}
          />
        </>
      )}
    </div>
  );
}
