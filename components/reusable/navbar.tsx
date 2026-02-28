'use client';
import Image from 'next/image';
import Link from 'next/link';
import { type Locale } from '@/i18n-config';
import LocaleSwitcher from '@/components/reusable/locale-switcher';
import { ModeToggle } from '@/components/reusable/theme-toggle';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/lib/requests';
import { deleteCookie, getCookie } from 'cookies-next';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Bot } from 'lucide-react';
import { type Dictionary } from '@/get-dictionary';

type NavbarUser = { userId: string; isAdmin: boolean };

const readUserFromCookies = (): NavbarUser | undefined => {
  const userCookie = getCookie('user');
  const tokenCookie = getCookie('token');
  if (!userCookie || !tokenCookie) return undefined;

  try {
    const parsed = JSON.parse(userCookie as string) as NavbarUser;
    if (parsed && typeof parsed.userId === 'string') return parsed;
  } catch {
    return undefined;
  }

  return undefined;
};

export default function Navbar({
  lang,
  dictionary,
}: {
  lang: Locale;
  dictionary: Dictionary;
}) {
  const router = useRouter();
  const [user, setUser] = useState<NavbarUser | undefined>(undefined);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setUser(readUserFromCookies());
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      const tokenCookie = getCookie('token');
      let refreshToken = '';
      if (tokenCookie) {
        try {
          const parsed = JSON.parse(tokenCookie as string);
          refreshToken = parsed.refreshToken;
        } catch {}
      }
      await AuthService.logout(refreshToken);
    } catch {}
    deleteCookie('token');
    deleteCookie('user');
    setUser(undefined);
    router.push(`/${lang}/login`);
  };

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        <Link href={`/${lang}`} className="flex items-center space-x-3">
          <div className="relative h-10 w-10 flex-shrink-0">
            <Image
              src="/logo.png"
              alt={dictionary.brand.logoAlt}
              fill
              className="object-contain"
              sizes="40px"
              priority
            />
          </div>
          <span className="text-primary text-2xl font-bold tracking-tight">
            {dictionary.brand.name}
          </span>
        </Link>

        <NavigationMenu>
          <NavigationMenuList className="hidden md:flex">
            <NavigationMenuItem>
              <NavigationMenuTrigger>
                {dictionary.pages.home.navigation.features}
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="grid gap-3 p-6 md:w-[400px] lg:w-[500px]">
                  <div className="row-span-3">
                    <NavigationMenuLink asChild>
                      <a
                        className="from-muted/50 to-muted flex h-full w-full flex-col justify-end rounded-md bg-gradient-to-b p-6 no-underline outline-none select-none focus:shadow-md"
                        href={`/${lang}#features`}
                      >
                        <Bot className="h-6 w-6" />
                        <div className="mt-4 mb-2 text-lg font-medium">
                          {dictionary.pages.home.features.title}
                        </div>
                        <p className="text-muted-foreground text-sm leading-tight">
                          {dictionary.pages.home.features.description}
                        </p>
                      </a>
                    </NavigationMenuLink>
                  </div>
                  <NavigationMenuLink asChild>
                    <a
                      href={`/${lang}#features`}
                      className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground block space-y-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none"
                    >
                      <div className="text-sm leading-none font-medium">
                        {dictionary.pages.home.features.aiInsights.title}
                      </div>
                      <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
                        {dictionary.pages.home.features.aiInsights.description}
                      </p>
                    </a>
                  </NavigationMenuLink>
                  <NavigationMenuLink asChild>
                    <a
                      href={`/${lang}#features`}
                      className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground block space-y-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none"
                    >
                      <div className="text-sm leading-none font-medium">
                        {dictionary.pages.home.features.realtimeAnalytics.title}
                      </div>
                      <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
                        {
                          dictionary.pages.home.features.realtimeAnalytics
                            .description
                        }
                      </p>
                    </a>
                  </NavigationMenuLink>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger>
                {dictionary.pages.home.navigation.solutions}
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                  <div className="space-y-2">
                    <h4 className="font-medium">
                      {dictionary.pages.home.solutions.startups.title}
                    </h4>
                    <p className="text-muted-foreground text-sm">
                      {dictionary.pages.home.solutions.startups.description}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">
                      {dictionary.pages.home.solutions.smallBusiness.title}
                    </h4>
                    <p className="text-muted-foreground text-sm">
                      {
                        dictionary.pages.home.solutions.smallBusiness
                          .description
                      }
                    </p>
                  </div>
                  <Separator className="col-span-2" />
                  <NavigationMenuLink asChild>
                    <a
                      href={`/${lang}#solutions`}
                      className="hover:bg-accent hover:text-accent-foreground col-span-2 flex items-center justify-center rounded-md p-2 text-sm font-medium"
                    >
                      {dictionary.pages.home.solutions.viewAllSolutions} →
                    </a>
                  </NavigationMenuLink>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <a
                  href={`/${lang}#pricing`}
                  className="group bg-background hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[active]:bg-accent/50 data-[state=open]:bg-accent/50 inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                >
                  {dictionary.pages.home.navigation.pricing}
                </a>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex items-center gap-2 md:gap-3">
            {/* Empêche l'hydratation côté serveur pour la zone utilisateur */}
            {mounted ? (
              user ? (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={`/${lang}/profile`}
                        className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors"
                      >
                        {dictionary.pages.home.navigation.profile}
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{dictionary.tooltips.profile}</p>
                    </TooltipContent>
                  </Tooltip>
                  {user.isAdmin && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href={`/${lang}/admin`}
                          className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors"
                        >
                          {dictionary.pages.home.navigation.adminDashboard}
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{dictionary.tooltips.adminDashboard}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        className="h-9 px-4"
                        onClick={handleLogout}
                      >
                        {dictionary.pages.home.navigation.logout}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{dictionary.tooltips.logout}</p>
                    </TooltipContent>
                  </Tooltip>
                </>
              ) : (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={`/${lang}/login`}
                        className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors"
                      >
                        {dictionary.pages.home.navigation.login}
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{dictionary.tooltips.signIn}</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={`/${lang}/register`}
                        className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors"
                      >
                        {dictionary.pages.home.navigation.register}
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{dictionary.tooltips.createAccount}</p>
                    </TooltipContent>
                  </Tooltip>
                </>
              )
            ) : null}
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <LocaleSwitcher />
              </TooltipTrigger>
              <TooltipContent>
                <p>{dictionary.tooltips.changeLanguage}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <ModeToggle />
              </TooltipTrigger>
              <TooltipContent>
                <p>{dictionary.tooltips.toggleTheme}</p>
              </TooltipContent>
            </Tooltip>
            {!user && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" className="h-9 px-4">
                    {dictionary.pages.home.navigation.getStarted}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{dictionary.tooltips.getStarted}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
