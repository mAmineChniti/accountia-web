import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * This lightweight route exposes the JWT token to the client-side NotificationBell
 * component ONLY, so it can pass it as a query param to the SSE endpoint.
 * The token is HttpOnly so JS can't read it directly from the browser.
 */
export async function GET() {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get('token');

  if (!tokenCookie?.value) {
    return NextResponse.json({ token: null });
  }

  try {
    const parsed = JSON.parse(tokenCookie.value) as { token?: string };
    return NextResponse.json({ token: parsed.token ?? null });
  } catch {
    return NextResponse.json({ token: null });
  }
}
