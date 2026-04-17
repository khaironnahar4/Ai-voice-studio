"use client"

import { useState }              from "react"
import { ProfileSection }        from "./profile-section"
import { ApiKeysSection }        from "./api-keys-section"
import { PreferencesSection }    from "./preferences-section"
import { User, Key, Sliders }    from "lucide-react"

const TABS = [
  { id: "profile",     label: "Profile",     icon: User    },
  { id: "api-keys",    label: "API keys",    icon: Key     },
  { id: "preferences", label: "Preferences", icon: Sliders },
] as const

type TabId = (typeof TABS)[number]["id"]

interface SettingsTabsProps {
  user: {
    id:            string
    name:          string
    email:         string
    emailVerified: boolean
    image?:        string | null
  }
  hasApiAccess: boolean
}

export function SettingsTabs({ user, hasApiAccess }: SettingsTabsProps) {
  const [active, setActive] = useState<TabId>("profile")

  return (
    <div>
      {/* Tab bar */}
      <div
        className="flex gap-1 p-1 rounded-xl bg-[#141424]
                   border border-[#282846] mb-6"
      >
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2
                       py-2 px-3 rounded-lg text-sm font-medium
                       transition-all duration-150
                       ${active === tab.id
                         ? "bg-[rgb(120,62,246)] text-white"
                         : "text-white/40 hover:text-white/70"
                       }`}
          >
            <tab.icon className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {active === "profile"     && <ProfileSection user={user} />}
      {active === "api-keys"    && <ApiKeysSection hasPlan={hasApiAccess} />}
      {active === "preferences" && <PreferencesSection />}
    </div>
  )
}