"use client"

import Link        from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Mic2, History, User } from "lucide-react"

const MOBILE_NAV = [
  { href: "/dashboard", label: "Home",    icon: LayoutDashboard },
  { href: "/studio",    label: "Studio",  icon: Mic2            },
  { href: "/history",   label: "History", icon: History         },
  { href: "/settings",  label: "Profile", icon: User            },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50
                 border-t border-[rgb(var(--vborder))]
                 bg-[rgb(var(--surface-2))]/95 backdrop-blur-md
                 flex items-center justify-around
                 h-16 px-2
                 md:hidden"           /* hidden on tablet+ */
      aria-label="Mobile navigation"
    >
      {MOBILE_NAV.map(({ href, label, icon: Icon }) => {
        const active =
          pathname === href ||
          (href !== "/dashboard" && pathname.startsWith(href + "/"))

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className="flex flex-col items-center gap-1
                       py-2 px-4 rounded-xl min-w-13
                       transition-all duration-150
                       active:scale-95"
          >
            <Icon
              className={`h-5 w-5 transition-colors duration-150
                ${active
                  ? "text-[rgb(120,62,246)]"
                  : "text-white/35"
                }`}
              strokeWidth={active ? 2 : 1.5}
            />
            <span
              className={`text-[10px] font-medium transition-colors duration-150
                ${active
                  ? "text-[rgb(167,139,250)]"
                  : "text-white/35"
                }`}
            >
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}