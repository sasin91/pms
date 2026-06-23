"use client"

import { useEffect, useState } from "react"

export function useSession() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [role, setRole] = useState<"admin" | "user">()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    fetch("/api/auth/session", { signal: controller.signal })
      .then(async (response) => {
        setIsAuthenticated(response.ok)
        if (response.ok) {
          const session = (await response.json()) as {
            role: "admin" | "user"
          }
          setRole(session.role)
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setIsAuthenticated(false)
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [])

  return { isAuthenticated, isLoading, role }
}
