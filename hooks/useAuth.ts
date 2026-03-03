import { useEffect, useState } from 'react';
import { getDefaultRoute, Role } from '@/lib/rbac';
import { getCookie } from 'cookies-next';

function parseJwt(token: string) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

export function useAuth(lang: string) {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const tokenCookie = getCookie('token');
    if (!tokenCookie) {
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }
    try {
      const tokenValue = JSON.parse(tokenCookie as string).token;
      const payload = parseJwt(tokenValue);
      if (payload && payload.role) {
        setUser(payload);
        setRole(payload.role as Role);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    }
    setIsLoading(false);
  }, []);

  const getDashboardUrl = () => {
    if (role) return getDefaultRoute(role, lang);
    return `/${lang}/login`;
  };

  return { user, role, isAuthenticated, isLoading, getDashboardUrl };
}
