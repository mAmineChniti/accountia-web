'use client';
import { getToken, clearAuthCookies } from '@/actions/cookies';
import type { AuthCookieData } from '@/types/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AuthService } from '@/lib/requests';

const MAX_TIMEOUT = 2_147_483_647;
const REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes before expiry

export const useTokenExpiration = () => {
  const router = useRouter();
  const pathname = usePathname();
  const previousTokenRef = useRef<AuthCookieData | undefined>(undefined);

  const { refetch: refreshToken } = useQuery({
    queryKey: ['token-refresh'],
    queryFn: () => AuthService.refreshToken(),
    enabled: false,
  });

  useEffect(() => {
    const scheduleRefreshCheck = (
      tokenExpiresAt: Date,
      currentTime: number
    ) => {
      const timeUntilExpiry = tokenExpiresAt.getTime() - currentTime;

      if (timeUntilExpiry <= 0) {
        void checkToken();
        return;
      }

      const refreshTime = timeUntilExpiry - REFRESH_BUFFER_MS;
      const delay = Math.min(
        refreshTime > 0 ? refreshTime : timeUntilExpiry,
        MAX_TIMEOUT
      );

      setTimeout(() => {
        if (refreshTime > 0 && refreshTime > MAX_TIMEOUT) {
          scheduleRefreshCheck(tokenExpiresAt, Date.now());
        } else {
          void checkToken();
        }
      }, delay);
    };

    const checkToken = async () => {
      try {
        const tokenData = await getToken();

        if (!tokenData) {
          if (previousTokenRef.current) {
            await clearAuthCookies();
            const lang = pathname.split('/')[1] || 'en';
            router.push(`/${lang}/login`);
            previousTokenRef.current = undefined;
          }
          return;
        }

        previousTokenRef.current = tokenData;

        let tokenExpiresAt: Date | undefined;
        try {
          let timestampMs: number;
          if (tokenData.expires_at_ts) {
            timestampMs = tokenData.expires_at_ts;
            if (timestampMs < 1e12) {
              timestampMs *= 1000;
            }
          } else if (tokenData.expires_at) {
            timestampMs = new Date(tokenData.expires_at).getTime();
          } else {
            await clearAuthCookies();
            const lang = pathname.split('/')[1] || 'en';
            router.push(`/${lang}/login`);
            return;
          }

          if (
            !Number.isFinite(timestampMs) ||
            new Date(timestampMs).getTime() !== timestampMs
          ) {
            return;
          }

          tokenExpiresAt = new Date(timestampMs);
        } catch {
          return;
        }

        const now = Date.now();
        const timeUntilExpiry = tokenExpiresAt.getTime() - now;

        if (!tokenExpiresAt || timeUntilExpiry <= 0) {
          await clearAuthCookies();
          const lang = pathname.split('/')[1] || 'en';
          router.push(`/${lang}/login`);
          previousTokenRef.current = undefined;
          return;
        }

        if (timeUntilExpiry <= REFRESH_BUFFER_MS) {
          try {
            await refreshToken();
            void checkToken();
            return;
          } catch {
            // Refresh failed, continue with logout flow
          }
        }

        scheduleRefreshCheck(tokenExpiresAt, now);
      } catch {
        const tokenData = await getToken();
        if (tokenData) {
          await clearAuthCookies();
          const lang = pathname.split('/')[1] || 'en';
          router.push(`/${lang}/login`);
          previousTokenRef.current = undefined;
        }
      }
    };

    void checkToken();
  }, [router, pathname, refreshToken]);
};
