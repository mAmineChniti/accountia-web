import {
  getToken,
  clearAuthCookies,
  type AuthCookieData,
} from '@/actions/cookies';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

const MAX_TIMEOUT = 2_147_483_647;

export const useTokenExpiration = () => {
  const router = useRouter();
  const pathname = usePathname();
  const previousTokenRef = useRef<AuthCookieData | undefined>(undefined);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | undefined;

    const scheduleTokenCheck = (tokenExpiresAt: Date) => {
      const timeUntilExpiry = tokenExpiresAt.getTime() - Date.now();

      if (timeUntilExpiry <= 0) {
        void checkToken();
        return;
      }

      const delay = Math.min(timeUntilExpiry, MAX_TIMEOUT);

      timeoutId = setTimeout(() => {
        if (timeUntilExpiry > MAX_TIMEOUT) {
          scheduleTokenCheck(tokenExpiresAt);
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

        if (!tokenExpiresAt || tokenExpiresAt.getTime() <= Date.now()) {
          await clearAuthCookies();
          const lang = pathname.split('/')[1] || 'en';
          router.push(`/${lang}/login`);
          previousTokenRef.current = undefined;
          return;
        }

        scheduleTokenCheck(tokenExpiresAt);
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

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [router, pathname]);
};
