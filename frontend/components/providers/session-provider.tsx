"use client"

import { useEffect }    from "react"
import { useAuthStore } from "@/lib/authStore/auth-store"

export function SessionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const initialize = useAuthStore(state => state.initialize)

  // App mount হলে একবারই call হয়
  useEffect(() => {
    initialize()
  }, [initialize])

  return <>{children}</>
}