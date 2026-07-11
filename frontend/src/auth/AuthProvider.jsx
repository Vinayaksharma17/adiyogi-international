// AuthProvider is removed — ClerkProvider is mounted directly in main.jsx.
// This file exists only to prevent import resolution errors if stale references remain.
export default function AuthProvider({ children }) {
  return children
}
