'use client';

import { SidebarHeader } from './SidebarHeader';
import { NavigationMenu } from './NavigationMenu';
import { SidebarFooter } from './SidebarFooter';

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onNavigate?: () => void;
  onToggleCollapsed: () => void;
}

export function Sidebar({ isOpen, isCollapsed, onNavigate, onToggleCollapsed }: SidebarProps) {
  return (
    <div
      className={`bg-sidebar lg:border-sidebar-border fixed top-0 left-0 z-20 h-full w-full shadow-xl transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 lg:border-r lg:shadow-lg ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
    >
      <div className="flex h-full flex-col pt-15">
        <SidebarHeader isCollapsed={isCollapsed} onToggleCollapsed={onToggleCollapsed} />
        <NavigationMenu isCollapsed={isCollapsed} onItemClick={onNavigate} />
        <SidebarFooter isCollapsed={isCollapsed} />
      </div>
    </div>
  );
}
