import { deleteCookie, getCookie } from 'cookies-next';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

const MAX_TIMEOUT = 2_147_483_647;

export const useTokenExpiration = () => {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | undefined;

    const scheduleTokenCheck = (tokenExpiresAt: Date) => {
      const timeUntilExpiry = tokenExpiresAt.getTime() - Date.now();

      if (timeUntilExpiry <= 0) {
        // Token already expired, check immediately
        void checkToken();
        return;
      }

      const delay = Math.min(timeUntilExpiry, MAX_TIMEOUT);

      timeoutId = setTimeout(() => {
        if (timeUntilExpiry > MAX_TIMEOUT) {
          // For long delays, reschedule when this timeout fires
          scheduleTokenCheck(tokenExpiresAt);
        } else {
          // Final timeout, check token
          void checkToken();
        }
      }, delay);
    };

    const checkToken = async () => {
      try {
        const tokenCookie = getCookie('token');

        if (!tokenCookie) {
          return;
        }

        let tokenExpiresAt: Date | undefined;
        try {
          const tokenObj = JSON.parse(tokenCookie as string) as {
            expires_at?: string;
            expires_at_ts?: number | string;
          };

          // Normalize timestamp to milliseconds
          let timestampMs: number;
          if (tokenObj.expires_at_ts) {
            timestampMs =
              typeof tokenObj.expires_at_ts === 'string'
                ? Number.parseFloat(tokenObj.expires_at_ts)
                : tokenObj.expires_at_ts;

            // If timestamp is in seconds (less than 1e12), convert to milliseconds
            if (timestampMs < 1e12) {
              timestampMs *= 1000;
            }
          } else if (tokenObj.expires_at) {
            timestampMs = new Date(tokenObj.expires_at).getTime();
          } else {
            tokenExpiresAt = undefined;
            return;
          }

          // Validate timestampMs is finite and not NaN
          if (
            !Number.isFinite(timestampMs) ||
            new Date(timestampMs).getTime() !== timestampMs
          ) {
            tokenExpiresAt = undefined;
            return;
          }

          tokenExpiresAt = new Date(timestampMs);
        } catch {
          tokenExpiresAt = undefined;
        }

        if (!tokenExpiresAt || tokenExpiresAt.getTime() <= Date.now()) {
          await deleteCookie('user');
          await deleteCookie('token');
          const lang = pathname.split('/')[1] || 'en';
          router.push(`/${lang}/login`);
          return;
        }

        scheduleTokenCheck(tokenExpiresAt);
      } catch {
        const tokenCookie = getCookie('token');
        if (tokenCookie) {
          await deleteCookie('user');
          await deleteCookie('token');
          const lang = pathname.split('/')[1] || 'en';
          router.push(`/${lang}/login`);
        }
      }
    };

    void checkToken();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [router, pathname]);
};
