import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { i18n, type Locale } from '@/i18n-config';
import { match as matchLocale } from '@formatjs/intl-localematcher';

import Negotiator from 'negotiator';
import { isAdminRole } from '@/lib/utils';

function isTokenExpired(tokenCookie: string): boolean {
  try {
    const tokenData = JSON.parse(tokenCookie);

    let timestampMs = tokenData.expires_at_ts;
    if (timestampMs && timestampMs < 1e12) {
      timestampMs = timestampMs * 1000;
    }

    return timestampMs ? timestampMs <= Date.now() : false;
  } catch {
    return true;
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

  const user = request.cookies.get('user')?.value;
  const token = request.cookies.get('token')?.value;
  const isLoggedIn = !!(user && token && !isTokenExpired(token));
  const protectedRoutes = [
    '/dashboard',
    '/profile',
    '/settings',
    '/invoices',
    '/business-application',
  ];
  const adminOnlyRoutes = ['/dashboard/admin', '/dashboard/businesses'];

  const pathSegments = pathname.split('/').filter(Boolean);
  const firstSegment = pathSegments[0];
  const isValidLocale =
    firstSegment && i18n.locales.includes(firstSegment as Locale);
  const locale = isValidLocale ? firstSegment : getLocale(request) || 'en';

  const localeStrippedPath = isValidLocale
    ? pathname.replace(`/${locale}`, '') || '/'
    : pathname;

  const preferredLocaleCookie = request.cookies.get('preferred-locale')?.value;
  if (
    isValidLocale &&
    typeof preferredLocaleCookie === 'string' &&
    i18n.locales.includes(preferredLocaleCookie as Locale) &&
    preferredLocaleCookie !== locale
  ) {
    const newPathname = `/${preferredLocaleCookie}${localeStrippedPath === '/' ? '' : localeStrippedPath}`;
    return NextResponse.redirect(new URL(newPathname, request.url));
  }

  let isAdmin = false;
  if (user) {
    try {
      const parsed = JSON.parse(user) as { role?: string };
      isAdmin = isAdminRole(parsed.role);
    } catch {
      isAdmin = false;
    }
  }

  const isProtectedRoute = protectedRoutes.some((route) =>
    localeStrippedPath.startsWith(route)
  );
  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  const isAdminRoute = adminOnlyRoutes.some(
    (route) =>
      localeStrippedPath === route || localeStrippedPath.startsWith(route + '/')
  );
  if (isAdminRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }
    if (!isAdmin) {
      return NextResponse.redirect(new URL(`/${locale}/`, request.url));
    }
  }

  if (pathname === '/') {
    const cookieLocale = request.cookies.get('preferred-locale')?.value;
    const detectedLocale = getLocale(request);

    const preferredLocale =
      typeof cookieLocale === 'string' &&
      i18n.locales.includes(cookieLocale as Locale)
        ? cookieLocale
        : detectedLocale || i18n.defaultLocale;

    return NextResponse.redirect(new URL(`/${preferredLocale}/`, request.url));
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
    const cookieLocale = request.cookies.get('preferred-locale')?.value;
    const detectedLocale = getLocale(request);

    const preferredLocale =
      typeof cookieLocale === 'string' &&
      i18n.locales.includes(cookieLocale as Locale)
        ? cookieLocale
        : detectedLocale || i18n.defaultLocale;

    return NextResponse.redirect(
      new URL(
        `/${preferredLocale}${pathname.startsWith('/') ? '' : '/'}${pathname}`,
        request.url
      )
    );
  }

  const response = NextResponse.next();
  response.headers.set('x-locale', locale);
  response.headers.set('x-pathname', pathname);
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|logo.png).*)',
  ],
};
