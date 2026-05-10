import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/react';
import { getClerkToken } from '@/lib/api-client';

export function useAuthenticatedApi() {
  const { isSignedIn } = useAuth();
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const checkToken = () => {
      const currentToken = getClerkToken();
      if (isSignedIn && currentToken) {
        setToken(currentToken);
        setReady(true);
      } else if (!isSignedIn) {
        setReady(false);
        setToken(null);
      }
    };

    checkToken();
    const interval = setInterval(checkToken, 200);
    return () => clearInterval(interval);
  }, [isSignedIn]);

  return { ready, token };
}

export function useWaitForToken() {
  const { isSignedIn } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const check = () => {
      if (isSignedIn && getClerkToken()) {
        setReady(true);
      } else if (!isSignedIn) {
        setReady(false);
      }
    };

    check();
    const interval = setInterval(check, 200);
    return () => clearInterval(interval);
  }, [isSignedIn]);

  return ready;
}