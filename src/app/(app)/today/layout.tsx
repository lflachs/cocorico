import { type ReactNode } from 'react';

/**
 * Today Page Layout
 * Simple wrapper - all content now handled in page.tsx for unified grid
 */

type TodayLayoutProps = {
  children: ReactNode;
};

export default function TodayLayout({ children }: TodayLayoutProps) {
  return (
    <div className="space-y-4 sm:space-y-6 w-full overflow-hidden">
      {children}
    </div>
  );
}
