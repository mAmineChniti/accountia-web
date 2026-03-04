'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { getUser, getToken } from '@/actions/cookies';
import type { UserCookieData } from '@/actions/cookies';

export function useAuth() {
  const [user, setUser] = useState<UserCookieData | undefined>();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const latestAuthReqRef = useRef(0);

  const checkAuth = useCallback(async () => {
    const reqId = ++latestAuthReqRef.current;
    try {
      setIsLoading(true);
      const [userData, tokenData] = await Promise.all([getUser(), getToken()]);

      if (reqId !== latestAuthReqRef.current) return;

      if (userData && tokenData) {
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        setUser(undefined);
        setIsAuthenticated(false);
      }
    } catch {
      if (reqId !== latestAuthReqRef.current) return;
      setUser(undefined);
      setIsAuthenticated(false);
    } finally {
      if (reqId === latestAuthReqRef.current) {
        setIsLoading(false);
      }
    }
  }, [setUser, setIsAuthenticated, setIsLoading]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const handleAuthChange = () => {
      checkAuth();
    };

    globalThis.addEventListener('auth:changed', handleAuthChange);
    return () =>
      globalThis.removeEventListener('auth:changed', handleAuthChange);
  }, [checkAuth]);

  return {
    user,
    isAuthenticated,
    isLoading,
    checkAuth,
  };
}
