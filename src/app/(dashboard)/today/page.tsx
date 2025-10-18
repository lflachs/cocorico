import { getTranslation } from '@/lib/i18n';
import { cookies } from 'next/headers';
import { UnifiedAlerts } from '@/components/alerts/UnifiedAlerts';
import { TodayDashboard } from './_components/TodayDashboard';

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

  // Get current hour for greeting
  const hour = today.getHours();
  let greetingKey: 'today.greeting.morning' | 'today.greeting.afternoon' | 'today.greeting.evening';
  if (hour < 12) {
    greetingKey = 'today.greeting.morning';
  } else if (hour < 18) {
    greetingKey = 'today.greeting.afternoon';
  } else {
    greetingKey = 'today.greeting.evening';
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary via-primary/95 to-secondary rounded-xl p-6 md:p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-1">
              {t(greetingKey)}, Nico! 👋
            </h1>
            <p className="text-primary-foreground/80 text-sm md:text-base">{formattedDate}</p>
          </div>
        </div>
      </div>

      <UnifiedAlerts />
      <TodayDashboard />
    </div>
  );
}
