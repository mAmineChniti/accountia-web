'use client';

import { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, githubProvider } from '@/lib/firebase';
import { setCookie } from 'cookies-next/client';

export function useSocialAuth(lang: string) {
  const [loading, setLoading] = useState<'google' | 'github' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    setLoading(provider);
    setError(null);

    try {
      const firebaseProvider = provider === 'google' ? googleProvider : githubProvider;
      const result = await signInWithPopup(auth, firebaseProvider);

      // Get Firebase ID token
      const idToken = await result.user.getIdToken();

      // Send token to your NestJS backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/auth/${provider}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message ?? 'Authentication failed');
      }

      const data = await response.json();

      // Same cookie pattern as your existing login
      const now = Date.now();
      const expiresAtMs = data.accessTokenExpiresAt
        ? new Date(data.accessTokenExpiresAt).getTime()
        : 0;
      const maxAge =
        expiresAtMs > 0
          ? Math.floor((expiresAtMs - now) / 1000)
          : 7 * 24 * 60 * 60;

      if (data.user.profilePicture) {
        try {
          localStorage.setItem('profilePicture', data.user.profilePicture);
        } catch {}
      }

      setCookie(
        'token',
        JSON.stringify({
          token: data.accessToken,
          refreshToken: data.refreshToken,
          expires_at: data.accessTokenExpiresAt,
          expires_at_ts: expiresAtMs,
        }),
        { path: '/', maxAge, sameSite: 'lax' }
      );

      setCookie(
        'user',
        JSON.stringify({
          userId: data.user.id,
          isAdmin: data.user.isAdmin,
          loginTime: new Date().toISOString(),
        }),
        { path: '/', maxAge, sameSite: 'lax' }
      );

      // Redirect
      window.location.href = data.user.isAdmin ? `/${lang}/admin` : `/${lang}`;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(null);
    }
  };

  return { loading, error, handleSocialLogin };
}