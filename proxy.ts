import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { i18n, type Locale } from '@/i18n-config';
import { getCookie } from 'cookies-next/server';

import { match as matchLocale } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';

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
  const token = await getCookie('token', { req: request });
  const isLoggedIn = !!(user && token);
  const protectedRoutes = ['/dashboard', '/profile', '/settings'];
  const adminOnlyRoutes = ['/admin'];

  const pathSegments = pathname.split('/').filter(Boolean);
  const firstSegment = pathSegments[0];
  const isValidLocale =
    firstSegment && i18n.locales.includes(firstSegment as Locale);
  const locale = isValidLocale ? firstSegment : getLocale(request) || 'en';

  const localeStrippedPath = isValidLocale
    ? pathname.replace(`/${locale}`, '') || '/'
    : pathname;

  const isProtectedRoute = protectedRoutes.some((route) =>
    localeStrippedPath.startsWith(route)
  );
  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
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

    return NextResponse.redirect(new URL(`/${preferredLocale}/`, request.url));
  }

  const lastSegment = pathSegments.at(-1);

  if (lastSegment === 'login' || lastSegment === 'register') {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL(`/${locale}/`, request.url));
    }
    return NextResponse.next();
  }

  const isAdminRoute = adminOnlyRoutes.some((route) =>
    localeStrippedPath.startsWith(route)
  );
  if (isAdminRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }
    let isAdmin = false;
    try {
      if (typeof user === 'string') {
        const parsed = JSON.parse(user);
        isAdmin =
          parsed.isAdmin === true ||
          (parsed.user && parsed.user.isAdmin === true);
      }
    } catch {}
    if (!isAdmin) {
      return NextResponse.redirect(new URL(`/${locale}/`, request.url));
    }
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
