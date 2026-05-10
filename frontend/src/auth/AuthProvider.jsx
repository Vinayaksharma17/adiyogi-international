import { ClerkProvider } from "@clerk/react";

export default function AuthProvider({ children }) {
  return (
    <ClerkProvider
      afterSignOutUrl="/"
      signInFallbackRedirectUrl="/admin"
      signUpFallbackRedirectUrl="/admin"
    >
      {children}
    </ClerkProvider>
  );
}