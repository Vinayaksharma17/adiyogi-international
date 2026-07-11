import { useEffect } from "react"
import { useSession, useAuth } from "@clerk/react"
import { setClerkToken, setClerkGetToken } from "@/lib/api-client"

export default function TokenSync() {
  const { isSignedIn } = useAuth()
  const { session } = useSession()

  useEffect(() => {
    if (!isSignedIn || !session) {
      setClerkToken(null)
      setClerkGetToken(null)
      return
    }

    const getToken = session.getToken.bind(session)
    setClerkGetToken(getToken)

    let mounted = true

    getToken()
      .then((token) => {
        if (mounted) setClerkToken(token)
      })
      .catch(() => {
        if (mounted) setClerkToken(null)
      })

    return () => {
      mounted = false
    }
  }, [isSignedIn, session])

  return null
}
