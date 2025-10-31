'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Globe, Settings } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { PermissionManager } from '@/components/PermissionManager';

export function SidebarFooter() {
  const { language, setLanguage, t } = useLanguage();
  const [showSettings, setShowSettings] = useState(false);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fr' : 'en');
  };

  return (
    <>
      <div className="space-y-4 border-t border-sidebar-border p-6">
        {/* Settings Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSettings(true)}
          className="w-full cursor-pointer justify-start gap-3 border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <Settings className="h-4 w-4" />
          <span>{t('permissions.settings')}</span>
        </Button>

        {/* Language Switcher */}
        <Button
          variant="outline"
          size="sm"
          onClick={toggleLanguage}
          className="w-full cursor-pointer justify-start gap-3 border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <Globe className="h-4 w-4" />
          <span>{language === 'en' ? 'Français' : 'English'}</span>
        </Button>

        <div className="text-center text-xs text-sidebar-foreground/60">© 2025 Cocorico</div>
      </div>

      {/* Controlled Permission Manager */}
      <PermissionManager open={showSettings} onOpenChange={setShowSettings} />
    </>
  );
}
