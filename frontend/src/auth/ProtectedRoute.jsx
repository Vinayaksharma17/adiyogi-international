import { Show, SignIn } from "@clerk/react";

export default function ProtectedRoute({ children }) {
  return (
    <Show when="signed-in" fallback={<SignIn routing="path" path="/admin/sign-in" />}>
      {children}
    </Show>
  );
}