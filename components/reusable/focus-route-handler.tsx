'use client';

import { useFocusRoute } from '@/hooks/use-focus-route';

/**
 * Component that handles route focus management for accessibility.
 * Should be rendered once at the app root to manage focus on all route changes.
 */
export function FocusRouteHandler() {
  useFocusRoute();
  return <></>;
}
