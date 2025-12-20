'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Globe, Settings, LogOut, User, Building2 } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { PermissionManager } from '@/components/PermissionManager';
import { useSession } from 'next-auth/react';
import { logout } from '@/lib/actions/auth.actions';
import { useRestaurant } from '@/providers/RestaurantProvider';
import { useRouter } from 'next/navigation';

interface SidebarFooterProps {
  isCollapsed: boolean;
}

export function SidebarFooter({ isCollapsed }: SidebarFooterProps) {
  const { language, setLanguage, t } = useLanguage();
  const [showSettings, setShowSettings] = useState(false);
  const { data: session } = useSession();
  const { restaurant } = useRestaurant();
  const router = useRouter();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fr' : 'en');
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleSwitchRestaurant = () => {
    router.push('/select-restaurant');
  };

  return (
    <>
      <div className={`space-y-4 border-t border-sidebar-border ${isCollapsed ? 'p-2' : 'p-6'}`}>
        {/* Restaurant Info */}
        {restaurant && (
          <button
            onClick={handleSwitchRestaurant}
            className={`w-full flex items-center gap-3 rounded-md border border-sidebar-border bg-sidebar-accent/50 p-3 hover:bg-sidebar-accent transition-colors ${isCollapsed ? 'lg:justify-center lg:p-2' : ''}`}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Building2 className="h-4 w-4" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 overflow-hidden text-left">
                <p className="truncate text-sm font-medium text-sidebar-foreground">{restaurant.name}</p>
                <p className="truncate text-xs text-sidebar-foreground/60">Click to switch</p>
              </div>
            )}
          </button>
        )}

        {/* User Info */}
        {session?.user && (
          <div className={`flex items-center gap-3 rounded-md border border-sidebar-border bg-sidebar-accent/50 p-3 ${isCollapsed ? 'lg:justify-center lg:p-2' : ''}`}>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <User className="h-4 w-4" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-sidebar-foreground">{session.user.name}</p>
                <p className="truncate text-xs text-sidebar-foreground/60">{session.user.email}</p>
              </div>
            )}
          </div>
        )}

        {/* Logout Button */}
        {session?.user && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className={`w-full cursor-pointer border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive ${
              isCollapsed ? 'lg:justify-center lg:px-0' : 'justify-start gap-3'
            } justify-start gap-3`}
            title={isCollapsed ? 'Logout' : undefined}
          >
            <LogOut className="h-4 w-4" />
            <span className={isCollapsed ? 'lg:hidden' : ''}>Logout</span>
          </Button>
        )}

        {/* Settings Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSettings(true)}
          className={`w-full cursor-pointer border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground ${
            isCollapsed ? 'lg:justify-center lg:px-0' : 'justify-start gap-3'
          } justify-start gap-3`}
          title={isCollapsed ? t('permissions.settings') : undefined}
        >
          <Settings className="h-4 w-4" />
          <span className={isCollapsed ? 'lg:hidden' : ''}>{t('permissions.settings')}</span>
        </Button>

        {/* Language Switcher */}
        <Button
          variant="outline"
          size="sm"
          onClick={toggleLanguage}
          className={`w-full cursor-pointer border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground ${
            isCollapsed ? 'lg:justify-center lg:px-0' : 'justify-start gap-3'
          } justify-start gap-3`}
          title={isCollapsed ? (language === 'en' ? 'Français' : 'English') : undefined}
        >
          <Globe className="h-4 w-4" />
          <span className={isCollapsed ? 'lg:hidden' : ''}>{language === 'en' ? 'Français' : 'English'}</span>
        </Button>

        <div className={`text-center text-xs text-sidebar-foreground/60 ${isCollapsed ? 'lg:hidden' : ''}`}>
          © 2025 Cocorico
        </div>
      </div>

      {/* Controlled Permission Manager */}
      <PermissionManager open={showSettings} onOpenChange={setShowSettings} />
    </>
  );
}
