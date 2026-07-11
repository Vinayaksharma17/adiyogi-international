import { useAuth } from "@clerk/react"

function AuthSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center pt-20">
      <div className="w-10 h-10 border-4 border-navy-200 border-t-navy-600 rounded-full animate-spin" />
    </div>
  )
}

export default function ProtectedRoute({ children, fallback }) {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) return <AuthSpinner />
  if (!isSignedIn) return fallback ?? null

  return children
}
