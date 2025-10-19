'use client';

import { Clock, Package, AlertCircle, AlertTriangle } from 'lucide-react';
import { AnimatedTabs, AnimatedTabsContent } from '@/components/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, getAlertsCounts } from '@/lib/services/alerts.service';
import { AlertsList } from './AlertsList';
import { AlertType } from '@/lib/utils/alerts';

interface AlertsTabsClientProps {
  alerts: Alert[];
  translations: {
    title: string;
    all: string;
    expiring: string;
    stock: string;
    disputes: string;
    noAlertsInCategory: string;
  };
}

/**
 * Client component for tabs and filtering
 * Keeps the interactive tab state on the client while using SSR data
 * Updates title dynamically based on selected tab
 */
export function AlertsTabsClient({ alerts, translations }: AlertsTabsClientProps) {
  const counts = getAlertsCounts(alerts);

  return (
    <AnimatedTabs
      tabs={[
        {
          value: 'all',
          label: translations.all,
          icon: AlertTriangle,
          badge: counts.all > 0 ? (
            <Badge
              variant="secondary"
              className="ml-0.5 h-4 min-w-[16px] flex-shrink-0 px-1 text-[10px] sm:ml-1 sm:h-5 sm:min-w-[20px] sm:px-1.5 sm:text-xs"
            >
              {counts.all}
            </Badge>
          ) : undefined,
        },
        {
          value: 'expiring',
          label: translations.expiring,
          icon: Clock,
          badge: counts.expiring > 0 ? (
            <Badge
              variant="secondary"
              className="ml-0.5 h-4 min-w-[16px] flex-shrink-0 px-1 text-[10px] sm:ml-1 sm:h-5 sm:min-w-[20px] sm:px-1.5 sm:text-xs"
            >
              {counts.expiring}
            </Badge>
          ) : undefined,
        },
        {
          value: 'lowStock',
          label: translations.stock,
          icon: Package,
          badge: counts.lowStock > 0 ? (
            <Badge
              variant="secondary"
              className="ml-0.5 h-4 min-w-[16px] flex-shrink-0 px-1 text-[10px] sm:ml-1 sm:h-5 sm:min-w-[20px] sm:px-1.5 sm:text-xs"
            >
              {counts.lowStock}
            </Badge>
          ) : undefined,
        },
        {
          value: 'dispute',
          label: translations.disputes,
          icon: AlertCircle,
          badge: counts.disputes > 0 ? (
            <Badge
              variant="secondary"
              className="ml-0.5 h-4 min-w-[16px] flex-shrink-0 px-1 text-[10px] sm:ml-1 sm:h-5 sm:min-w-[20px] sm:px-1.5 sm:text-xs"
            >
              {counts.disputes}
            </Badge>
          ) : undefined,
        },
      ]}
      defaultValue="all"
    >
      <div className="scrollbar-thin relative h-[180px] overflow-x-hidden overflow-y-auto">
        <AnimatedTabsContent value="all">
          <AlertsList alerts={alerts} emptyMessage={translations.noAlertsInCategory} />
        </AnimatedTabsContent>

        <AnimatedTabsContent value="expiring">
          <AlertsList
            alerts={alerts.filter((a) => a.type === 'expiring')}
            emptyMessage={translations.noAlertsInCategory}
          />
        </AnimatedTabsContent>

        <AnimatedTabsContent value="lowStock">
          <AlertsList
            alerts={alerts.filter((a) => a.type === 'lowStock')}
            emptyMessage={translations.noAlertsInCategory}
          />
        </AnimatedTabsContent>

        <AnimatedTabsContent value="dispute">
          <AlertsList
            alerts={alerts.filter((a) => a.type === 'dispute')}
            emptyMessage={translations.noAlertsInCategory}
          />
        </AnimatedTabsContent>
      </div>
    </AnimatedTabs>
  );
}
