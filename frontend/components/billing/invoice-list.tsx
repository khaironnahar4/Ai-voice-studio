import Link from "next/link"

interface Invoice {
  id:         string
  amountCents: number
  currency:   string
  paidAt:     Date | null
  pdfUrl:     string | null
  periodStart: Date
  periodEnd:   Date
}

export function InvoiceList({ invoices }: { invoices: Invoice[] }) {
  if (invoices.length === 0) {
    return (
      <div className="rounded-2xl border border-[#282846] bg-[#141424] p-8
                      text-center">
        <p className="text-sm text-white/30">No invoices yet.</p>
        <p className="text-xs text-white/20 mt-1">
          Invoices appear here after each payment.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-[#282846] bg-[#141424]
                    overflow-hidden">
      <div className="px-6 py-4 border-b border-[#282846]">
        <h2 className="text-sm font-medium text-white/75">Payment history</h2>
      </div>
      <div className="divide-y divide-[#282846]/60">
        {invoices.map(inv => {
          const amount = (inv.amountCents / 100).toLocaleString("en-US", {
            style:    "currency",
            currency: inv.currency,
          })
          const date = inv.paidAt
            ? new Date(inv.paidAt).toLocaleDateString("en-US", {
                month: "long", day: "numeric", year: "numeric",
              })
            : "—"
          const period = `${new Date(inv.periodStart).toLocaleDateString("en-US", { month:"short", day:"numeric" })} — ${new Date(inv.periodEnd).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" })}`

          return (
            <div key={inv.id}
                 className="flex items-center justify-between gap-4
                            px-6 py-4 hover:bg-white/3 transition-colors">
              <div className="flex items-center gap-4">
                {/* Paid icon */}
                <div className="w-8 h-8 rounded-lg bg-teal-500/10
                               border border-teal-500/20
                               flex items-center justify-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                       stroke="rgb(20,184,166)" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M2 7l3 3 7-7"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white/75">{amount}</p>
                  <p className="text-[11px] text-white/30">{period}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right hidden sm:block">
                  <span className="text-xs text-white/25">{date}</span>
                  <div className="flex items-center gap-1 justify-end mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400"/>
                    <span className="text-[10px] text-teal-400">Paid</span>
                  </div>
                </div>
                {inv.pdfUrl && (
                  <Link
                    href={inv.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                               text-xs text-white/40 hover:text-white
                               border border-[#282846] hover:border-white/20
                               transition-all"
                  >
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none"
                         stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M5.5 1v6M2.5 4.5l3 3 3-3"/><path d="M1 9h9"/>
                    </svg>
                    PDF
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}