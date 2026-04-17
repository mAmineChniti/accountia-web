'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Hook to manage focus on route changes for accessibility.
 * Moves focus to the main content area or h1 when navigating.
 */
export function useFocusRoute() {
  const pathname = usePathname();

  useEffect(() => {
    // Small delay to allow DOM to settle after navigation
    const timeout = setTimeout(() => {
      // Try to find h1 first, then fall back to main
      const h1 = document.querySelector('h1') as HTMLElement | null;
      if (h1 && h1.tabIndex === -1) {
        h1.focus();
        return;
      }

      const main = document.querySelector(
        'main, [role="main"]'
      ) as HTMLElement | null;
      if (main && main.tabIndex === -1) {
        main.focus();
        return;
      }

      // Fallback: focus body
      document.body.focus();
    }, 100);

    return () => clearTimeout(timeout);
  }, [pathname]);
}
