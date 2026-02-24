import { redirect } from 'next/navigation';
import { i18n } from '@/i18n-config';

export default function RootPage() {
  // Redirect to the default language
  redirect(`/${i18n.defaultLocale}`);
}
