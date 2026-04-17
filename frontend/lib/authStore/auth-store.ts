import { create } from "zustand"
import { devtools } from "zustand/middleware"

// ── Types ──────────────────────────────────────────────────────────────
export interface AuthUser {
  id:            string
  name:          string
  email:         string
  image?:        string | null
  role:          "user" | "admin"
  emailVerified: boolean
  banned?:       boolean
  plan:          "Free" | "Pro" | "Business"
  planId?:       string | null
}

interface AuthState {
  // Data
  user:          AuthUser | null
  isLoading:     boolean
  isInitialized: boolean   // first fetch done?
  error:         string | null

  // Actions
  initialize:    () => Promise<void>
  setUser:       (user: AuthUser | null) => void
  updateUser:    (patch: Partial<AuthUser>) => void
  signOut:       () => Promise<void>
  refresh:       () => Promise<void>

  // Derived helpers (computed)
  isAuthenticated: () => boolean
  isAdmin:         () => boolean
  isPaid:          () => boolean
}

// ── Store ──────────────────────────────────────────────────────────────
export const useAuthStore = create<AuthState>()(
  devtools(
    (set, get) => ({
      user:          null,
      isLoading:     false,
      isInitialized: false,
      error:         null,

      // ── initialize — call once on app mount ───────────────────────
      initialize: async () => {
        // Already initialized? Skip
        if (get().isInitialized) return

        set({ isLoading: true, error: null })
        try {
          const res  = await fetch("/api/auth/user")
          if (res.ok) {
            const data = await res.json()
            set({ user: data.user ?? null })
          } else {
            set({ user: null })
          }
        } catch {
          set({ user: null, error: "Failed to load session." })
        } finally {
          set({ isLoading: false, isInitialized: true })
        }
      },

      // ── setUser — replace entire user object ──────────────────────
      setUser: (user) => set({ user }),

      // ── updateUser — partial update (e.g. after profile save) ─────
      updateUser: (patch) => {
        const current = get().user
        if (!current) return
        set({ user: { ...current, ...patch } })
      },

      // ── signOut ───────────────────────────────────────────────────
      signOut: async () => {
        try {
          await fetch("/api/auth/sign-out", { method: "POST" })
        } finally {
          set({ user: null, isInitialized: false })
          window.location.href = "/"
        }
      },

      // ── refresh — force re-fetch (after plan upgrade etc.) ────────
      refresh: async () => {
        set({ isLoading: true, isInitialized: false })
        await get().initialize()
      },

      // ── Derived helpers ───────────────────────────────────────────
      isAuthenticated: () => !!get().user,
      isAdmin:         () => get().user?.role === "admin",
      isPaid:          () => get().user?.plan !== "Free" && !!get().user,
    }),
    { name: "AuthStore" }
  )
)

// ── Convenience hook (most common usage) ──────────────────────────────
export function useAuth() {
  return useAuthStore(state => ({
    user:            state.user,
    isLoading:       state.isLoading,
    isInitialized:   state.isInitialized,
    isAuthenticated: state.isAuthenticated(),
    isAdmin:         state.isAdmin(),
    isPaid:          state.isPaid(),
    setUser:         state.setUser,
    updateUser:      state.updateUser,
    signOut:         state.signOut,
    refresh:         state.refresh,
  }))
}