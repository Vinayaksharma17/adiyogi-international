import { useEffect } from "react";
import { useAuth } from "@clerk/react";
import { setClerkToken } from "@/lib/api-client";

export default function TokenSync() {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    let mounted = true;

    const syncToken = async () => {
      if (!isSignedIn) {
        setClerkToken(null);
        return;
      }

      await new Promise((r) => setTimeout(r, 500));

      if (!mounted) return;

      try {
        const token = await getToken();
        setClerkToken(token);
      } catch (err) {
        console.error("Failed to get Clerk token:", err);
        setClerkToken(null);
      }
    };

    syncToken();

    return () => {
      mounted = false;
    };
  }, [getToken, isSignedIn]);

  return null;
}