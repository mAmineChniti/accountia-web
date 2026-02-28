import { type Locale } from '@/i18n-config';
import { getDictionary } from '@/get-dictionary';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, FileText, Users, TrendingUp } from 'lucide-react';
import { cookies } from 'next/headers';

function parseJwt(token: string) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
  } catch {
    return null;
  }
}

function getRoleLabel(role: string): string {
  switch (role) {
    case 'PLATFORM_OWNER':   return 'Platform Owner';
    case 'PLATFORM_ADMIN':   return 'Platform Admin';
    case 'BUSINESS_OWNER':   return 'Business Owner';
    case 'BUSINESS_ADMIN':   return 'Business Admin';
    case 'CLIENT':           return 'Client';
    default:                 return role;
  }
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  // Lire le rôle et le nom depuis le JWT
  const cookieStore = await cookies();
  let firstName = '';
  let role = '';

  const tokenCookie = cookieStore.get('token');
  if (tokenCookie) {
    try {
      const parsed = JSON.parse(tokenCookie.value);
      const payload = parseJwt(parsed.token);
      if (payload) {
        firstName = payload.firstName ?? '';
        role = payload.role ?? '';
      }
    } catch {}
  }

  return (
    <main className="flex min-h-[calc(100vh-var(--header-footer-height))] flex-col gap-8 p-8">
      {/* Header avec nom + rôle */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {firstName ? `Welcome, ${firstName}!` : 'Welcome to your business dashboard.'}
          </p>
        </div>
        {role && (
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {getRoleLabel(role)}
          </Badge>
        )}
      </div>

      {/* Cards stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-muted-foreground text-xs">Coming soon</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Invoices</CardTitle>
            <FileText className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-muted-foreground text-xs">Coming soon</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-muted-foreground text-xs">Coming soon</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Analytics</CardTitle>
            <BarChart3 className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-muted-foreground text-xs">Coming soon</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}