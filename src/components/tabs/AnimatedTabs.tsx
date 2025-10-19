'use client';

import { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface AnimatedTab {
  value: string;
  label: string;
  icon?: LucideIcon;
  badge?: ReactNode;
  className?: string;
}

interface AnimatedTabsProps {
  tabs: AnimatedTab[];
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  tabsListClassName?: string;
  children: ReactNode;
  contentAnimation?: {
    initial?: { x?: number; opacity?: number };
    animate?: { x?: number; opacity?: number };
    exit?: { x?: number; opacity?: number };
    duration?: number;
  };
}

/**
 * AnimatedTabs - Reusable component with smooth sliding indicator
 *
 * Features:
 * - Smooth spring animation for tab indicator
 * - Optional icons and badges
 * - Configurable content animations
 * - Perfectly aligned with grid cells
 *
 * @example
 * ```tsx
 * <AnimatedTabs
 *   tabs={[
 *     { value: 'tab1', label: 'First Tab', icon: HomeIcon },
 *     { value: 'tab2', label: 'Second Tab', icon: SettingsIcon },
 *   ]}
 *   defaultValue="tab1"
 * >
 *   <AnimatedTabsContent value="tab1">
 *     <YourContent />
 *   </AnimatedTabsContent>
 *   <AnimatedTabsContent value="tab2">
 *     <OtherContent />
 *   </AnimatedTabsContent>
 * </AnimatedTabs>
 * ```
 */
export function AnimatedTabs({
  tabs,
  defaultValue,
  onValueChange,
  className,
  tabsListClassName,
  children,
  contentAnimation = {
    initial: { x: -80, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -20, opacity: 0 },
    duration: 0.3,
  },
}: AnimatedTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue || tabs[0]?.value);

  const handleValueChange = (value: string) => {
    setActiveTab(value);
    onValueChange?.(value);
  };

  // Calculate the index of the active tab
  const tabIndex = tabs.findIndex((tab) => tab.value === activeTab);
  const tabCount = tabs.length;
  const tabWidthPercent = 100 / tabCount;

  return (
    <Tabs value={activeTab} onValueChange={handleValueChange} className={cn('w-full', className)}>
      <TabsList className={cn('relative z-10 mb-4 grid w-full p-1.5', tabsListClassName)} style={{ gridTemplateColumns: `repeat(${tabCount}, 1fr)` }}>
        {/* Sliding indicator */}
        <motion.div
          className="absolute inset-1.5 rounded-md bg-background shadow-sm"
          initial={false}
          animate={{
            left: `${tabIndex * tabWidthPercent}%`,
            right: `${(tabCount - 1 - tabIndex) * tabWidthPercent}%`,
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
          }}
        />

        {/* Tab triggers */}
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.value === activeTab;
          return (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn(
                'relative z-10 flex cursor-pointer items-center justify-center gap-0.5 !px-4 !py-3 data-[state=active]:bg-transparent data-[state=active]:shadow-none sm:gap-1',
                tab.className
              )}
            >
              {Icon && <Icon className="h-3 w-3 flex-shrink-0 sm:h-4 sm:w-4" />}
              <span className={cn(
                'truncate text-xs sm:text-sm',
                isActive ? 'inline' : 'hidden sm:inline'
              )}>
                {tab.label}
              </span>
              {tab.badge}
            </TabsTrigger>
          );
        })}
      </TabsList>

      {/* Animated content */}
      <div className="mt-2">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={contentAnimation.initial}
            animate={contentAnimation.animate}
            exit={contentAnimation.exit}
            transition={{ duration: contentAnimation.duration, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </Tabs>
  );
}

/**
 * AnimatedTabsContent - Wrapper for tab content
 * Only renders when the tab is active to optimize performance
 */
interface AnimatedTabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function AnimatedTabsContent({ value, children, className }: AnimatedTabsContentProps) {
  return (
    <TabsContent value={value} className={cn('mt-0', className)}>
      {children}
    </TabsContent>
  );
}
