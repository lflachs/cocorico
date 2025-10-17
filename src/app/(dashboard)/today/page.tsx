import { getTranslation } from '@/lib/i18n';
import { cookies } from 'next/headers';

/**
 * Today Page - Main dashboard for daily operations
 */

export default async function TodayPage() {
  const cookieStore = await cookies();
  const language = (cookieStore.get('language')?.value as 'en' | 'fr') || 'en';
  const t = getTranslation(language);

  const today = new Date();
  const locale = language === 'fr' ? 'fr-FR' : 'en-US';
  const formattedDate = today.toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">{t('today.title')}</h1>
      <p className="mt-2 text-gray-600">{formattedDate}</p>
    </div>
  );
}
