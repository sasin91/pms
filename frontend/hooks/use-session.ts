"use client"

import { useEffect, useState } from "react"

export function useSession() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    fetch("/api/auth/session", { signal: controller.signal })
      .then((response) => setIsAuthenticated(response.ok))
      .catch(() => {
        if (!controller.signal.aborted) setIsAuthenticated(false)
      })

    return () => controller.abort()
  }, [])

  return { isAuthenticated }
}
