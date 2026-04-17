'use client';
import Image from 'next/image';
import Link from 'next/link';
import { type Locale } from '@/i18n-config';
import LocaleSwitcher from '@/components/reusable/locale-switcher';
import { Button } from '@/components/ui/button';
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Bot, Menu } from 'lucide-react';
import { type Dictionary } from '@/get-dictionary';
import { ModeToggle } from '@/components/reusable/theme-toggle';
import type { AuthenticatedSession } from '@/types/session';
import * as React from 'react';

export default function Navbar({
  lang,
  dictionary,
  session,
}: {
  lang: Locale;
  dictionary: Dictionary;
  session?: AuthenticatedSession | null;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const isAuthenticated = !!session?.authenticated;
  const dashboardHref = session?.isAdmin
    ? `/${lang}/dashboard/admin`
    : `/${lang}/invoices`;

  const dashboardLabel = session?.isAdmin
    ? dictionary.pages.home.navigation.adminDashboard
    : dictionary.pages.home.navigation.invoices;

  const dashboardTooltip = session?.isAdmin
    ? dictionary.tooltips.adminDashboard
    : dictionary.tooltips.invoices;

  return (
    <header className="bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        <div className="contents">
          <Link href={`/${lang}`} className="flex items-center space-x-3">
            <div className="relative h-10 w-10 shrink-0">
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

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label={dictionary.a11y.toggleMenu}
                aria-expanded={mobileMenuOpen}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="top" className="w-full">
              <SheetHeader>
                <SheetTitle className="text-left">
                  {dictionary.brand.name}
                </SheetTitle>
              </SheetHeader>
              <div
                className="mt-6 flex flex-col gap-4"
                role="navigation"
                aria-label={dictionary.a11y.mobileNav}
              >
                <Link
                  href={`/${lang}#features`}
                  className="text-foreground hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-2 text-sm font-medium transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {dictionary.pages.home.navigation.features}
                </Link>
                <div className="space-y-2">
                  <Link
                    href={`/${lang}#features-ai-insights`}
                    className="text-muted-foreground hover:text-foreground block px-3 py-1 text-sm"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                      {dictionary.pages.home.features.aiInsights.title}
                    </p>
                    <p className="mt-1">
                      {dictionary.pages.home.features.aiInsights.description}
                    </p>
                  </Link>
                  <Link
                    href={`/${lang}#features-realtime-analytics`}
                    className="text-muted-foreground hover:text-foreground block px-3 py-1 text-sm"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                      {dictionary.pages.home.features.realtimeAnalytics.title}
                    </p>
                    <p className="mt-1">
                      {
                        dictionary.pages.home.features.realtimeAnalytics
                          .description
                      }
                    </p>
                  </Link>
                </div>
                <Separator />
                <Link
                  href={`/${lang}#solutions`}
                  className="text-foreground hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-2 text-sm font-medium transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {dictionary.pages.home.navigation.solutions}
                </Link>
                <div className="space-y-2">
                  <Link
                    href={`/${lang}#solutions-startups`}
                    className="text-muted-foreground hover:text-foreground block px-3 py-1 text-sm"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {dictionary.pages.home.solutions.startups.title}
                  </Link>
                  <Link
                    href={`/${lang}#solutions-small-business`}
                    className="text-muted-foreground hover:text-foreground block px-3 py-1 text-sm"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {dictionary.pages.home.solutions.smallBusiness.title}
                  </Link>
                  <Link
                    href={`/${lang}#solutions`}
                    className="text-muted-foreground hover:text-foreground block px-3 py-1 text-sm"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {dictionary.pages.home.solutions.viewAllSolutions}
                  </Link>
                </div>
                <Separator />
                <Link
                  href={`/${lang}#pricing`}
                  className="text-foreground hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-2 text-sm font-medium transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {dictionary.pages.home.navigation.pricing}
                </Link>
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop Navigation */}
          <NavigationMenu
            className="hidden md:block"
            aria-label={dictionary.a11y.mainNav}
          >
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>
                  {dictionary.pages.home.navigation.features}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid gap-3 p-6 md:w-[400px] lg:w-[500px]">
                    <div className="row-span-3">
                      <NavigationMenuLink asChild>
                        <a
                          className="from-muted/50 to-muted flex h-full w-full flex-col justify-end rounded-md bg-linear-to-b p-6 no-underline outline-none select-none focus:shadow-md"
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
                          {
                            dictionary.pages.home.features.aiInsights
                              .description
                          }
                        </p>
                      </a>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <a
                        href={`/${lang}#features`}
                        className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground block space-y-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none"
                      >
                        <div className="text-sm leading-none font-medium">
                          {
                            dictionary.pages.home.features.realtimeAnalytics
                              .title
                          }
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
                    className="group bg-background hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-active:bg-accent/50 data-[state=open]:bg-accent/50 inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                  >
                    {dictionary.pages.home.navigation.pricing}
                  </a>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          <div className="flex items-center gap-2 md:gap-3">
            {isAuthenticated ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" className="h-9 px-4" asChild>
                    <Link href={dashboardHref}>{dashboardLabel}</Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{dashboardTooltip}</p>
                </TooltipContent>
              </Tooltip>
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
          </div>
        </div>
      </div>
    </header>
  );
}
