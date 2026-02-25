'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { type Locale } from '@/i18n-config';
import LocaleSwitcher from '@/components/locale-switcher';
import { ModeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Bot, LogOut, User } from 'lucide-react';
import { type Dictionary } from '@/get-dictionary';
import { getCookie, deleteCookie } from 'cookies-next/client';



interface UserCookie {
  userId: string;
  isAdmin: boolean;
  loginTime: string;
}

export default function Navbar({
  lang,
  dictionary,
}: {
  lang: Locale;
  dictionary: Dictionary;
}) {
  const router = useRouter();
  const [user, setUser] = useState<UserCookie | null>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = getCookie('user');
      if (raw) {
        const parsed: UserCookie =
          typeof raw === 'string' ? JSON.parse(raw) : (raw as UserCookie);
        setUser(parsed);
      }
      const pic = localStorage.getItem('profilePicture');
      if (pic) setProfilePicture(pic);
    } catch {}
  }, []);

  const handleLogout = () => {
    deleteCookie('token', { path: '/' });
    deleteCookie('user', { path: '/' });
    try {
      localStorage.removeItem('profilePicture');
    } catch {}
    setUser(null);
    setProfilePicture(null);
    router.push(`/${lang}/login`);
  };

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">

        {/* Logo */}
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

        {/* Nav links */}
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
                      <Link
                        href={`/${lang}#features`}
                        className="from-muted/50 to-muted flex h-full w-full flex-col justify-end rounded-md bg-gradient-to-b p-6 no-underline outline-none select-none focus:shadow-md"
                      >
                        <Bot className="h-6 w-6" />
                        <div className="mt-4 mb-2 text-lg font-medium">
                          {dictionary.pages.home.features.title}
                        </div>
                        <p className="text-muted-foreground text-sm leading-tight">
                          {dictionary.pages.home.features.description}
                        </p>
                      </Link>
                    </NavigationMenuLink>
                  </div>
                  <NavigationMenuLink asChild>
                    <Link
                      href={`/${lang}#features`}
                      className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground block space-y-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none"
                    >
                      <div className="text-sm leading-none font-medium">
                        {dictionary.pages.home.features.aiInsights.title}
                      </div>
                      <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
                        {dictionary.pages.home.features.aiInsights.description}
                      </p>
                    </Link>
                  </NavigationMenuLink>
                  <NavigationMenuLink asChild>
                    <Link
                      href={`/${lang}#features`}
                      className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground block space-y-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none"
                    >
                      <div className="text-sm leading-none font-medium">
                        {dictionary.pages.home.features.realtimeAnalytics.title}
                      </div>
                      <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
                        {dictionary.pages.home.features.realtimeAnalytics.description}
                      </p>
                    </Link>
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
                      {dictionary.pages.home.solutions.smallBusiness.description}
                    </p>
                  </div>
                  <Separator className="col-span-2" />
                  <NavigationMenuLink asChild>
                    <Link
                      href={`/${lang}#solutions`}
                      className="hover:bg-accent hover:text-accent-foreground col-span-2 flex items-center justify-center rounded-md p-2 text-sm font-medium"
                    >
                      {dictionary.pages.home.solutions.viewAllSolutions} →
                    </Link>
                  </NavigationMenuLink>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link
                  href={`/${lang}#pricing`}
                  className="group bg-background hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[active]:bg-accent/50 data-[state=open]:bg-accent/50 inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                >
                  {dictionary.pages.home.navigation.pricing}
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right side */}
        <div className="flex items-center space-x-3">
          {user ? (
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <button className="focus:ring-primary rounded-full focus:ring-2 focus:ring-offset-2 focus:outline-none">
                      <Avatar className="h-9 w-9 cursor-pointer">
                        <AvatarImage
                          src={profilePicture ?? undefined}
                          alt="Profile"
                        />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Account</p>
                </TooltipContent>
              </Tooltip>

              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">My Account</p>
                    {user.isAdmin && (
                      <span className="text-muted-foreground text-xs">
                        Administrator
                      </span>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link
                    href={`/${lang}/profile`}
                    className="flex cursor-pointer items-center"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>

                {user.isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/${lang}/admin`}
                      className="flex cursor-pointer items-center"
                    >
                      <Bot className="mr-2 h-4 w-4" />
                      Admin Panel
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
          )}

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
                <Button size="sm" className="h-9 px-4" asChild>
                  <Link href={`/${lang}/register`}>
                    {dictionary.pages.home.navigation.getStarted}
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{dictionary.tooltips.getStarted}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </header>
  );
}