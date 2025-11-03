'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Globe, Settings } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { PermissionManager } from '@/components/PermissionManager';

interface SidebarFooterProps {
  isCollapsed: boolean;
}

export function SidebarFooter({ isCollapsed }: SidebarFooterProps) {
  const { language, setLanguage, t } = useLanguage();
  const [showSettings, setShowSettings] = useState(false);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fr' : 'en');
  };

  return (
    <>
      <div className={`space-y-4 border-t border-sidebar-border ${isCollapsed ? 'p-2' : 'p-6'}`}>
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
