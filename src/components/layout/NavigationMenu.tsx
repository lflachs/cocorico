'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { navigationSections, type NavigationItem } from '@/config/navigation';
import { useLanguage } from '@/providers/LanguageProvider';

interface NavigationMenuProps {
  isCollapsed: boolean;
  onItemClick?: () => void;
}

export function NavigationMenu({ isCollapsed, onItemClick }: NavigationMenuProps) {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <nav className={`flex-1 overflow-y-auto ${isCollapsed ? 'p-2' : 'p-6'}`}>
      <div className={isCollapsed ? 'space-y-4' : 'space-y-6'}>
        {navigationSections.map((section, sectionIndex) => (
          <div key={section.id}>
            {/* Visual separator between sections when collapsed */}
            {isCollapsed && sectionIndex > 0 && (
              <div className="border-t border-sidebar-border/50 mb-4" />
            )}

            <div className="space-y-2">
              {/* Section Header - only show if labelKey is not empty and not collapsed */}
              {section.labelKey && !isCollapsed && (
                <div className="px-3 mb-3">
                  <h3 className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
                    {t(section.labelKey)}
                  </h3>
                </div>
              )}

              {/* Section Items */}
              <div className="space-y-1">
                {section.items.map((item: NavigationItem) => {
                  const Icon = item.icon;
                  const isActive = pathname.startsWith(item.href);
                  const itemLabel = t(item.labelKey) || item.labelKey;

                  const buttonContent = (
                    <Button
                      variant={isActive ? 'default' : 'ghost'}
                      className={`h-11 w-full cursor-pointer text-sidebar-foreground ${
                        isActive
                          ? 'bg-sidebar-primary hover:bg-sidebar-primary/90'
                          : 'hover:bg-sidebar-accent'
                      } ${isCollapsed ? 'lg:justify-center lg:px-0' : 'justify-start gap-3'} justify-start gap-3`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className={`font-medium ${isCollapsed ? 'lg:hidden' : ''}`}>{itemLabel}</span>
                    </Button>
                  );

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={onItemClick}
                      className="cursor-pointer block"
                    >
                      {isCollapsed ? (
                        <Tooltip>
                          <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
                          <TooltipContent side="right" sideOffset={8}>
                            {itemLabel}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        buttonContent
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}
