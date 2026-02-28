
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { i18n, type Locale } from '@/i18n-config';
import { getCookie } from 'cookies-next/server';
import { Role, hasPermission } from '@/lib/rbac';
import { match as matchLocale } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';

function parseJwt(token: string) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
  } catch {
    return null;
  }
}

function getLocale(request: NextRequest): string | undefined {
  const negotiatorHeaders: Record<string, string> = {};
  for (const [key, value] of request.headers.entries())
    negotiatorHeaders[key] = value;
  const locales = [...i18n.locales];
  const languages = new Negotiator({ headers: negotiatorHeaders }).languages(
    locales
  );
  return matchLocale(languages, locales, i18n.defaultLocale);
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/manifest.json'
  ) {
    return NextResponse.next();
  }

  const user = await getCookie('user', { req: request });
  const tokenCookie = await getCookie('token', { req: request });
  const isLoggedIn = !!tokenCookie;

  const pathSegments = pathname.split('/').filter(Boolean);
  const firstSegment = pathSegments[0];
  const isValidLocale =
    firstSegment && i18n.locales.includes(firstSegment as Locale);
  const locale = isValidLocale ? firstSegment : getLocale(request) || 'en';

  const localeStrippedPath = isValidLocale
    ? pathname.replace(`/${locale}`, '') || '/'
    : pathname;


  // RBAC: Protéger les routes selon le rôle
  const rbacRoutes = [
    { prefix: '/admin', roles: [Role.PLATFORM_ADMIN, Role.PLATFORM_OWNER] },
    { prefix: '/dashboard', roles: [Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN] },
    { prefix: '/invoices', roles: [Role.CLIENT, Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN] },
  ];
  const rbacMatch = rbacRoutes.find((r) => localeStrippedPath.startsWith(r.prefix));
  if (rbacMatch) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }
    let role: Role | undefined = undefined;
    try {
      if (typeof tokenCookie === 'string') {
        const tokenValue = JSON.parse(tokenCookie).token;
        const payload = parseJwt(tokenValue);
        if (payload && payload.role) {
          role = payload.role as Role;
        }
      }
    } catch {}
    if (!role || !rbacMatch.roles.includes(role)) {
      return NextResponse.redirect(new URL(`/${locale}/unauthorized`, request.url));
    }
  }

  if (pathname === '/') {
    // Always redirect to preferred locale for both logged-in and non-logged-in users
    const cookieLocale = await getCookie('preferred-locale', { req: request });
    const detectedLocale = getLocale(request);

    const preferredLocale =
      (typeof cookieLocale === 'string' &&
      i18n.locales.includes(cookieLocale as Locale)
        ? cookieLocale
        : undefined) ||
      detectedLocale ||
      i18n.defaultLocale;

    // Redirige vers /[locale] sans slash final
    return NextResponse.redirect(new URL(`/${preferredLocale}`, request.url));
  }

  const lastSegment = pathSegments.at(-1);

  if (lastSegment === 'login' || lastSegment === 'register') {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL(`/${locale}/`, request.url));
    }
    return NextResponse.next();
  }


  const pathnameIsMissingLocale = i18n.locales.every(
    (loc) => !pathname.startsWith(`/${loc}/`) && pathname !== `/${loc}`
  );

  if (pathnameIsMissingLocale) {
    const cookieLocale = await getCookie('preferred-locale', { req: request });
    const detectedLocale = getLocale(request);

    const preferredLocale =
      (typeof cookieLocale === 'string' &&
      i18n.locales.includes(cookieLocale as Locale)
        ? cookieLocale
        : undefined) ||
      detectedLocale ||
      i18n.defaultLocale;

    return NextResponse.redirect(
      new URL(
        `/${preferredLocale}${pathname.startsWith('/') ? '' : '/'}${pathname}`,
        request.url
      )
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|logo.png).*)',
  ],
};
