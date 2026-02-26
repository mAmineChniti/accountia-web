'use client';

import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { type ReactNode } from 'react';
import { Toaster } from 'sonner';
import { usePathname } from 'next/navigation';
import { type Locale, i18n } from '@/i18n-config';
import { DirectionProvider } from '@/components/ui/direction';

const queryClient = new QueryClient();

const RTL_LANGUAGES = new Set(['ar']);

function isRtl(locale: Locale): boolean {
  return RTL_LANGUAGES.has(locale);
}

function RtlProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const getCurrentLocale = (): Locale => {
    const segments = pathname.split('/');
    const locale = segments[1] as Locale;
    return i18n.locales.includes(locale) ? locale : i18n.defaultLocale;
  };

  const currentLocale = getCurrentLocale();
  const direction = isRtl(currentLocale) ? 'rtl' : 'ltr';

  return <DirectionProvider dir={direction}>{children}</DirectionProvider>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem={true}
        disableTransitionOnChange
      >
        <RtlProvider>
          <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
          <Toaster
            position="top-center"
            closeButton
            expand={true}
            duration={4000}
            richColors
            theme="system"
            className="toaster group"
            toastOptions={{
              classNames: {
                toast:
                  'group toast group-[.toaster]:bg-white/95 group-[.toaster]:dark:bg-slate-900/95 group-[.toaster]:backdrop-blur-md group-[.toaster]:border-border/70 group-[.toaster]:text-foreground group-[.toaster]:shadow-2xl group-[.toaster]:rounded-2xl group-[.toaster]:min-w-[380px] group-[.toaster]:p-5 group-[.toaster]:text-base group-[.toaster]:font-medium group-[.toaster]:border-2 group-[.toaster]:transform group-[.toaster]:transition-all group-[.toaster]:duration-300 group-[.toaster]:hover:scale-105',
                description:
                  'group-[.toast]:text-muted-foreground group-[.toast]:text-sm group-[.toast]:mt-2 group-[.toast]:font-normal',
                actionButton:
                  'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-lg group-[.toast]:px-4 group-[.toast]:py-2 group-[.toast]:font-semibold group-[.toast]:transition-colors group-[.toast]:hover:opacity-90',
                cancelButton:
                  'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-lg group-[.toast]:px-4 group-[.toast]:py-2 group-[.toast]:font-semibold group-[.toast]:transition-colors group-[.toast]:hover:opacity-90',
                success:
                  'group-[.toaster]:bg-gradient-to-r group-[.toaster]:from-green-50/95 group-[.toaster]:to-emerald-50/95 group-[.toaster]:dark:from-green-900/95 group-[.toaster]:dark:to-emerald-900/95 group-[.toaster]:backdrop-blur-md group-[.toaster]:border-green-300/70 group-[.toaster]:dark:border-green-700/70 group-[.toaster]:text-green-900 group-[.toaster]:dark:text-green-100 group-[.toaster]:border-2',
                error:
                  'group-[.toaster]:bg-gradient-to-r group-[.toaster]:from-red-50/95 group-[.toaster]:to-rose-50/95 group-[.toaster]:dark:from-red-900/95 group-[.toaster]:dark:to-rose-900/95 group-[.toaster]:backdrop-blur-md group-[.toaster]:border-red-300/70 group-[.toaster]:dark:border-red-700/70 group-[.toaster]:text-red-900 group-[.toaster]:dark:text-red-100 group-[.toaster]:border-2',
                warning:
                  'group-[.toaster]:bg-gradient-to-r group-[.toaster]:from-yellow-50/95 group-[.toaster]:to-amber-50/95 group-[.toaster]:dark:from-yellow-900/95 group-[.toaster]:dark:to-amber-900/95 group-[.toaster]:backdrop-blur-md group-[.toaster]:border-yellow-300/70 group-[.toaster]:dark:border-yellow-700/70 group-[.toaster]:text-yellow-900 group-[.toaster]:dark:text-yellow-100 group-[.toaster]:border-2',
                info: 'group-[.toaster]:bg-gradient-to-r group-[.toaster]:from-blue-50/95 group-[.toaster]:to-cyan-50/95 group-[.toaster]:dark:from-blue-900/95 group-[.toaster]:dark:to-cyan-900/95 group-[.toaster]:backdrop-blur-md group-[.toaster]:border-blue-300/70 group-[.toaster]:dark:border-blue-700/70 group-[.toaster]:text-blue-900 group-[.toaster]:dark:text-blue-100 group-[.toaster]:border-2',
              },
            }}
          />
        </RtlProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
