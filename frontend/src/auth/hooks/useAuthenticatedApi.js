import { useState, useEffect } from "react"
import { useAuth } from "@clerk/react"
import { getClerkToken, onTokenChange } from "@/lib/api-client"

export function useAuthenticatedApi() {
  const { isSignedIn } = useAuth()
  const [ready, setReady] = useState(() => isSignedIn && !!getClerkToken())
  const [token, setToken] = useState(() => getClerkToken())

  useEffect(() => {
    if (!isSignedIn) return

    const check = (currentToken) => {
      if (currentToken) {
        setToken(currentToken)
        setReady(true)
      }
    }

    check(getClerkToken())

    const unsubscribe = onTokenChange(check)
    return () => {
      unsubscribe()
      setReady(false)
      setToken(null)
    }
  }, [isSignedIn])

  return { ready, token }
}

export function useWaitForToken() {
  const { isSignedIn } = useAuth()
  const [ready, setReady] = useState(() => isSignedIn && !!getClerkToken())

  useEffect(() => {
    if (!isSignedIn) return

    const check = (currentToken) => {
      if (currentToken) setReady(true)
    }

    check(getClerkToken())

    const unsubscribe = onTokenChange(check)
    return () => {
      unsubscribe()
      setReady(false)
    }
  }, [isSignedIn])

  return ready
}
