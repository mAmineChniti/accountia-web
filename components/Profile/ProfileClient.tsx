'use client';

import { type Locale } from '@/i18n-config';
import { type Dictionary } from '@/get-dictionary';
import { useCurrentUserProfile } from '@/hooks/useAuth';
import Profile from './Profile';
import { AlertCircle } from 'lucide-react';

interface ProfileClientProps {
  dictionary: Dictionary;
  lang: Locale;
}

export default function ProfileClient({
  dictionary,
  lang,
}: ProfileClientProps) {
  const { data, isLoading, error } = useCurrentUserProfile();

  if (isLoading) {
    return (
      <main className="container mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground">
          {dictionary.common?.loading || 'Loading...'}
        </p>
      </main>
    );
  }

  if (error || !data?.user) {
    return (
      <main className="container mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-600 dark:text-red-400" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-100">
                Failed to load profile
              </h3>
              <p className="mt-1 text-sm text-red-800 dark:text-red-200">
                An error occurred while loading your profile
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-2xl px-4 py-8">
      <Profile dictionary={dictionary} _lang={lang} user={data.user} />
    </main>
  );
}
