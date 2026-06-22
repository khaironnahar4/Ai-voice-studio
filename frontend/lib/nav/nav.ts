import {
  LayoutDashboard,
  Mic2,
  History,
  CreditCard,
  Settings,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  title:    string
  href:     string
  icon:     LucideIcon
  badge?:   string
  badgeVariant?: "new" | "plan"
}

export const NAV_MAIN: NavItem[] = [
  {
    title: "Dashboard",
    href:  "/dashboard",
    icon:  LayoutDashboard,
  },
  {
    title:        "Studio",
    href:         "/studio",
    icon:         Mic2,
    badge:        "New",
    badgeVariant: "new",
  },
  {
    title: "History",
    href:  "/history",
    icon:  History,
  },
  {
    title: "Voices",
    href: "/voices",
    icon: Mic2,
  }
]

export const NAV_ACCOUNT: NavItem[] = [
  {
    title:        "Billing",
    href:         "/billing",
    icon:         CreditCard,
    badge:        "Free",
    badgeVariant: "plan",
  },
  {
    title: "Settings",
    href:  "/settings",
    icon:  Settings,
  },
]