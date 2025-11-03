'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarHeaderProps {
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
}

export function SidebarHeader({ isCollapsed, onToggleCollapsed }: SidebarHeaderProps) {
  return (
    <div className="border-b border-sidebar-border p-6 relative">
      <div className="flex items-center justify-center gap-2">
        <span className="text-4xl" role="img" aria-label="Rooster">
          🐓
        </span>
        <h2 className={`text-center text-4xl font-extralight tracking-wide text-sidebar-foreground ${isCollapsed ? 'lg:hidden' : ''}`}>
          Cocorico
        </h2>
      </div>

      {/* Circular toggle button that overflows the sidebar edge */}
      <Button
        variant="default"
        size="icon"
        onClick={onToggleCollapsed}
        className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full cursor-pointer bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-foreground shadow-lg border border-sidebar-border z-10"
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
