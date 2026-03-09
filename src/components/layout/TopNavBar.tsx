'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import {
  Home,
  PackageCheck,
  ChefHat,
  Receipt,
  ClipboardCheck,
  Trash2,
  ShoppingCart,
  TrendingUp,
  BarChart3,
  DollarSign,
  Settings,
  ChevronDown,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface NavItem {
  id: string;
  href: string;
  icon: typeof Home;
  label: string;
}

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

const navItems: NavItem[] = [
  { id: 'today', href: '/today', icon: Home, label: 'Accueil' },
  { id: 'reception', href: '/reception', icon: PackageCheck, label: 'Livraison' },
  { id: 'prep', href: '/prep', icon: ChefHat, label: 'Cuisine' },
  { id: 'sales', href: '/sales', icon: Receipt, label: 'Ventes' },
];

const moreGroups: NavGroup[] = [
  {
    id: 'management',
    label: 'Gestion',
    items: [
      { id: 'menu', href: '/menu', icon: ChefHat, label: 'Recettes' },
      { id: 'inventory', href: '/inventory', icon: ClipboardCheck, label: 'Inventaire' },
      { id: 'dlc', href: '/dlc', icon: Trash2, label: 'DLC' },
      { id: 'orders', href: '/orders', icon: ShoppingCart, label: 'Commandes' },
    ],
  },
  {
    id: 'analytics',
    label: 'Analyses',
    items: [
      { id: 'food-cost', href: '/food-cost', icon: TrendingUp, label: 'Food Cost' },
      { id: 'price-history', href: '/price-history', icon: DollarSign, label: 'Prix' },
      { id: 'insights', href: '/insights', icon: BarChart3, label: 'Insights' },
    ],
  },
];

function NavDropdown({ label, groups, isActive }: { label: string; groups: NavGroup[]; isActive: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 px-5 py-2 text-sm rounded-full transition-colors",
          isActive || open
            ? "bg-white text-neutral-900 font-medium"
            : "text-neutral-400 hover:text-white hover:bg-neutral-700"
        )}
      >
        {label}
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-52 bg-background/95 backdrop-blur-md border border-border rounded-2xl shadow-soft-lg p-2 z-50"
          >
            {groups.map((group, i) => (
              <div key={group.id}>
                {i > 0 && <div className="h-px bg-border my-2" />}
                <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {group.label}
                </div>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isItemActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 text-sm rounded-xl transition-colors",
                        isItemActive
                          ? "bg-foreground text-background font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <Icon className="size-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function TopNavBar() {
  const pathname = usePathname();

  const isMoreActive = moreGroups.some(group =>
    group.items.some(item => pathname.startsWith(item.href))
  );

  return (
    <motion.header
      className="hidden xl:block fixed top-4 left-0 right-0 z-40 px-8"
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    >
      <div className="flex items-center justify-between h-14 px-6 bg-neutral-800 rounded-full shadow-lg max-w-5xl mx-auto">
        {/* Logo */}
        <Link href="/today" className="flex items-center gap-2">
          <span className="text-xl">🐓</span>
          <span className="font-semibold text-white">Cocorico</span>
        </Link>

        {/* Nav - Centered */}
        <nav className="flex items-center gap-1 bg-neutral-700/50 rounded-full px-1 py-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "px-5 py-1.5 text-sm rounded-full transition-colors",
                  isActive
                    ? "bg-white text-neutral-900 font-medium"
                    : "text-neutral-400 hover:text-white"
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <NavDropdown label="Plus" groups={moreGroups} isActive={isMoreActive} />
        </nav>

        {/* Right */}
        <div className="flex items-center gap-2">
          <Link
            href="/settings"
            className="p-2.5 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-700 transition-colors"
          >
            <Settings className="size-5" />
          </Link>
          <Link
            href="/settings/profile"
            className="size-9 rounded-full bg-neutral-700 flex items-center justify-center text-neutral-300 hover:text-white hover:bg-neutral-600 transition-colors"
          >
            <User className="size-5" />
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
