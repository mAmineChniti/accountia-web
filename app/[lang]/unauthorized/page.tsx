import { cookies } from 'next/headers';
import { type Locale } from '@/i18n-config';
import { getDefaultRoute, Role } from '@/lib/rbac';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ShieldX } from 'lucide-react';

function parseJwt(token: string) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
  } catch {
    return null;
  }
}

export default async function UnauthorizedPage({
  params,
}: {
  params: Promise<{ lang: Locale }>; // ✅ Promise
}) {
  // ✅ await params
  const { lang } = await params;

  const cookieStore = await cookies();
  let dashboardUrl = `/${lang}/login`;

  const tokenCookie = cookieStore.get('token');
  if (tokenCookie) {
    try {
      const parsed = JSON.parse(tokenCookie.value);
      const payload = parseJwt(parsed.token);
      if (payload?.role) {
        dashboardUrl = getDefaultRoute(payload.role as Role, lang);
      }
    } catch {}
  }

  return (
    <main className="bg-muted/30 flex min-h-[calc(100vh-var(--header-footer-height))] items-center justify-center p-8">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <ShieldX className="text-destructive h-16 w-16" />
          </div>
          <CardTitle className="text-2xl font-bold">Access Denied</CardTitle>
          <CardDescription className="text-base">
            You don&apos;t have permission to access this page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href={dashboardUrl}>Go to my dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}