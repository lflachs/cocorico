'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PackageCheck, ChefHat, Receipt, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { MoreMenu } from './MoreMenu';
import { motion } from 'framer-motion';

const tabs = [
  { id: 'today', href: '/today', icon: Home, label: 'Accueil' },
  { id: 'reception', href: '/reception', icon: PackageCheck, label: 'Livraison' },
  { id: 'prep', href: '/prep', icon: ChefHat, label: 'Cuisine' },
  { id: 'sales', href: '/sales', icon: Receipt, label: 'Ventes' },
];

export function BottomTabBar() {
  const pathname = usePathname();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const isMoreActive = ['/menu', '/inventory', '/dlc', '/orders', '/food-cost', '/insights', '/price-history', '/settings'].some(
    path => pathname.startsWith(path)
  );

  return (
    <>
      <motion.nav
        className="fixed bottom-4 left-4 right-4 z-50 xl:hidden"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
      >
        <div className="flex items-center justify-around h-14 px-2 bg-neutral-800 rounded-full shadow-lg max-w-md mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname.startsWith(tab.href);

            return (
              <Link
                key={tab.id}
                href={tab.href}
                className="relative flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-full"
              >
                {isActive && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute inset-0 bg-white/10 rounded-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  />
                )}
                <Icon
                  className={cn(
                    "size-5 relative z-10",
                    isActive ? "text-white" : "text-neutral-400"
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className={cn(
                  "text-[10px] relative z-10",
                  isActive ? "text-white font-medium" : "text-neutral-400"
                )}>
                  {tab.label}
                </span>
              </Link>
            );
          })}

          <motion.button
            onClick={() => setMoreMenuOpen(true)}
            className={cn(
              "relative flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-full",
              isMoreActive && "bg-white/10"
            )}
            whileTap={{ scale: 0.95 }}
          >
            <MoreHorizontal
              className={cn(
                "size-5",
                isMoreActive ? "text-white" : "text-neutral-400"
              )}
              strokeWidth={isMoreActive ? 2.5 : 2}
            />
            <span className={cn(
              "text-[10px]",
              isMoreActive ? "text-white font-medium" : "text-neutral-400"
            )}>
              Plus
            </span>
          </motion.button>
        </div>
      </motion.nav>

      <MoreMenu open={moreMenuOpen} onClose={() => setMoreMenuOpen(false)} />
    </>
  );
}
