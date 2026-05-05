'use client';

import type * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function ThemeProvider({
  children,
  ...properties
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...properties}>{children}</NextThemesProvider>;
}
