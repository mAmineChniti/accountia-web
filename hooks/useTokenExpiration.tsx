import { deleteCookie, getCookie } from 'cookies-next';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export const useTokenExpiration = () => {
  const router = useRouter();

  useEffect(() => {
    let timeoutId: number | undefined;

    const checkToken = async () => {
      try {
        const tokenCookie = getCookie('token');
        if (!tokenCookie) {
          await deleteCookie('user');
          router.push('/login');
          return;
        }
        let tokenExpiresAt: Date | undefined;
        try {
          const tokenObj = JSON.parse(tokenCookie as string) as {
            expires_at: string;
          };
          tokenExpiresAt = new Date(tokenObj.expires_at);
        } catch {
          tokenExpiresAt = undefined;
        }
        if (!tokenExpiresAt || tokenExpiresAt.getTime() <= Date.now()) {
          await deleteCookie('user');
          await deleteCookie('token');
          router.push('/login');
          return;
        }
        const timeUntilExpiry = tokenExpiresAt.getTime() - Date.now();
        timeoutId = setTimeout(() => {
          void checkToken();
        }, timeUntilExpiry) as unknown as number;
      } catch {
        await deleteCookie('user');
        await deleteCookie('token');
        router.push('/login');
      }
    };

    void checkToken();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [router]);
};
