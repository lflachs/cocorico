import { User, Bell, Palette, Globe, Database, ChevronRight } from 'lucide-react';
import Link from 'next/link';

/**
 * Settings Page - Notion/Stripe Style
 */

const settingsSections = [
  { id: 'profile', icon: User, title: 'Profil', description: 'Compte et informations', href: '/settings/profile' },
  { id: 'notifications', icon: Bell, title: 'Notifications', description: 'Alertes et préférences', href: '/settings/notifications' },
  { id: 'appearance', icon: Palette, title: 'Apparence', description: 'Thème et affichage', href: '/settings/appearance' },
  { id: 'language', icon: Globe, title: 'Langue', description: 'Français', href: '/settings/language' },
];

export default function SettingsPage() {
  const isDev = process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_VERCEL_ENV !== 'production';

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight mb-8">Paramètres</h1>

      <div className="space-y-1">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.id}
              href={section.href}
              className="flex items-center gap-4 p-3 -mx-3 rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <div className="size-9 rounded-lg bg-muted flex items-center justify-center">
                <Icon className="size-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{section.title}</div>
                <div className="text-sm text-muted-foreground">{section.description}</div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </Link>
          );
        })}

        {isDev && (
          <>
            <div className="h-px bg-border my-4" />
            <Link
              href="/settings/dev-tools"
              className="flex items-center gap-4 p-3 -mx-3 rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <div className="size-9 rounded-lg bg-muted flex items-center justify-center">
                <Database className="size-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">Dev Tools</div>
                <div className="text-sm text-muted-foreground">Outils de développement</div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
