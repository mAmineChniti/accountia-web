'use client';
import { getToken, clearAuthCookies } from '@/actions/cookies';
import type { AuthCookieData } from '@/types/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AuthService } from '@/lib/requests';

const MAX_TIMEOUT = 2_147_483_647;
const REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes before expiry
const MIN_CHECK_INTERVAL = 3 * 60 * 1000; // Check token every 3 minutes minimum

export const useTokenExpiration = () => {
  const router = useRouter();
  const pathname = usePathname();
  const previousTokenRef = useRef<AuthCookieData | undefined>(undefined);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { refetch: refreshToken } = useQuery({
    queryKey: ['token-refresh'],
    queryFn: () => AuthService.refreshToken(),
    enabled: false,
    staleTime: 60 * 1000, // 1 minute - token refresh is actively managed
  });

  useEffect(() => {
    const checkAndScheduleToken = async () => {
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

        // Parse expiration time
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

        // Token already expired - logout immediately
        if (timeUntilExpiry <= 0) {
          await clearAuthCookies();
          const lang = pathname.split('/')[1] || 'en';
          router.push(`/${lang}/login`);
          previousTokenRef.current = undefined;
          return;
        }

        // Token within 5-minute buffer - refresh NOW
        if (timeUntilExpiry <= REFRESH_BUFFER_MS) {
          try {
            await refreshToken();
            // Recheck immediately after refresh with new token
            void checkAndScheduleToken();
            return;
          } catch {
            await clearAuthCookies();
            const lang = pathname.split('/')[1] || 'en';
            router.push(`/${lang}/login`);
            previousTokenRef.current = undefined;
            return;
          }
        }

        // Schedule next check: either at (expiry - buffer) or in 30 seconds, whichever is sooner
        const timeUntilRefreshNeeded = timeUntilExpiry - REFRESH_BUFFER_MS;
        const delayUntilNextCheck = Math.min(
          timeUntilRefreshNeeded,
          MIN_CHECK_INTERVAL
        );
        const delay = Math.min(delayUntilNextCheck, MAX_TIMEOUT);

        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Schedule the next check
        timeoutRef.current = setTimeout(() => {
          void checkAndScheduleToken();
        }, delay);
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

    void checkAndScheduleToken();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [router, pathname, refreshToken]);
};
