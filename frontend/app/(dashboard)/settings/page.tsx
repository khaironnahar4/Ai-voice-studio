import { requireSession }         from "@/lib/auth/session"
import prisma                     from "@/lib/auth/prisma"
import { SettingsTabs }           from "@/components/settings/settings-tabs"

async function getSettingsData(userId: string) {
  const [user, subscription] = await Promise.all([
    prisma.user.findUnique({
      where:  { id: userId },
      select: {
        id:            true,
        name:          true,
        email:         true,
        emailVerified: true,
        image:         true,
      },
    }),
    prisma.subscription.findFirst({
      where:   { userId, status: { in: ["active", "trialing"] } },
      include: { plan: { select: { name: true, hasApiAccess: true } } },
    }),
  ])
  return { user, subscription }
}

export default async function SettingsPage() {
  const { user: sessionUser } = await requireSession()
  const { user, subscription } = await getSettingsData(sessionUser.id)

  if (!user) return null

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white tracking-tight">
          Settings
        </h1>
        <p className="text-sm text-white/35 mt-1">
          Manage your profile, API keys, and preferences.
        </p>
      </div>

      <SettingsTabs
        user={user}
        hasApiAccess={subscription?.plan.hasApiAccess ?? false}
      />
    </div>
  )
}