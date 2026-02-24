'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthService } from '@/lib/requests';
import { logoutUser } from '@/lib/actions';
import type {
  UpdateUserInput,
  ChangePasswordInput,
} from '@/types/RequestSchemas';

// Query keys for React Query
export const authKeys = {
  all: ['auth'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
};

/**
 * Hook to fetch the current user's profile
 * Used to check if user is authenticated and get their data
 */
export function useCurrentUserProfile() {
  return useQuery({
    queryKey: authKeys.profile(),
    queryFn: async () => {
      return AuthService.fetchUser();
    },
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (
        error instanceof Error &&
        (error.message.includes('Token not found') ||
          error.message.toLowerCase().includes('unauthorized'))
      ) {
        return false;
      }
      return failureCount < 3;
    },
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to update user profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateUserInput) => AuthService.patchUser(data),
    onSuccess: () => {
      // Invalidate and refetch profile data
      queryClient.invalidateQueries({ queryKey: authKeys.profile() });
    },
    onError: (error) => {
      console.error('Failed to update profile:', error);
    },
  });
}

/**
 * Hook to change user password
 */
export function useChangePassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ChangePasswordInput) => AuthService.changePassword(data),
    onSuccess: () => {
      // Invalidate profile data after password change
      queryClient.invalidateQueries({ queryKey: authKeys.profile() });
    },
    onError: (error) => {
      console.error('Failed to change password:', error);
    },
  });
}

/**
 * Hook to logout user
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      // Clear all auth-related queries
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
  });
}
