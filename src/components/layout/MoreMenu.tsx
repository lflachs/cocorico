'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChefHat,
  ClipboardCheck,
  Trash2,
  ShoppingCart,
  TrendingUp,
  BarChart3,
  DollarSign,
  Settings,
  User,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MoreMenuProps {
  open: boolean;
  onClose: () => void;
}

const menuSections = [
  {
    title: 'Gestion',
    items: [
      { id: 'menu', href: '/menu', icon: ChefHat, label: 'Recettes', description: 'Gérer tes plats' },
      { id: 'inventory', href: '/inventory', icon: ClipboardCheck, label: 'Inventaire', description: 'Stock physique' },
      { id: 'dlc', href: '/dlc', icon: Trash2, label: 'DLC', description: 'Péremptions' },
      { id: 'orders', href: '/orders', icon: ShoppingCart, label: 'Commandes', description: 'Réassort' },
    ],
  },
  {
    title: 'Analyses',
    items: [
      { id: 'food-cost', href: '/food-cost', icon: TrendingUp, label: 'Food Cost', description: 'Rentabilité' },
      { id: 'price-history', href: '/price-history', icon: DollarSign, label: 'Prix', description: 'Évolution' },
      { id: 'insights', href: '/insights', icon: BarChart3, label: 'Insights', description: 'Tendances' },
    ],
  },
];

export function MoreMenu({ open, onClose }: MoreMenuProps) {
  const pathname = usePathname();

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm xl:hidden animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Menu Panel - iOS style sheet */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 z-50 xl:hidden",
        "animate-in slide-in-from-bottom duration-300 ease-out"
      )}>
        <div className={cn(
          "bg-white dark:bg-neutral-900",
          "rounded-t-[20px]",
          "shadow-soft-lg"
        )}>
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-muted-foreground/20 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-3">
            <h2 className="text-lg font-semibold">Plus</h2>
            <button
              onClick={onClose}
              className={cn(
                "flex items-center justify-center size-9 rounded-full",
                "bg-muted hover:bg-muted/80",
                "transition-smooth"
              )}
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Menu Sections */}
          <div className="px-4 pb-8 space-y-6 max-h-[55vh] overflow-y-auto">
            {menuSections.map((section) => (
              <div key={section.title}>
                <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-2 mb-3">
                  {section.title}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "relative flex items-center gap-3 p-4 rounded-2xl",
                          "transition-spring active:scale-[0.98]",
                          isActive
                            ? "bg-muted"
                            : "bg-muted/30 hover:bg-muted/50"
                        )}
                      >
                        <div className={cn(
                          "flex items-center justify-center size-10 rounded-xl",
                          isActive
                            ? "bg-secondary text-white"
                            : "bg-white dark:bg-neutral-800 shadow-soft-sm"
                        )}>
                          <Icon className="size-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{item.label}</div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {item.description}
                          </div>
                        </div>
                        {isActive && (
                          <div className="absolute top-3 right-3 size-1.5 rounded-full bg-secondary" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Account Section */}
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/settings/profile"
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-2xl",
                  "bg-muted/30 hover:bg-muted/50",
                  "transition-spring active:scale-[0.98]"
                )}
              >
                <div className="flex items-center justify-center size-10 rounded-xl bg-white dark:bg-neutral-800 shadow-soft-sm">
                  <User className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">Profil</div>
                  <div className="text-[11px] text-muted-foreground truncate">Mon compte</div>
                </div>
              </Link>

              <Link
                href="/settings"
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-2xl",
                  "bg-muted/30 hover:bg-muted/50",
                  "transition-spring active:scale-[0.98]"
                )}
              >
                <div className="flex items-center justify-center size-10 rounded-xl bg-white dark:bg-neutral-800 shadow-soft-sm">
                  <Settings className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">Paramètres</div>
                  <div className="text-[11px] text-muted-foreground truncate">Configuration</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Safe area padding */}
          <div className="h-6" />
        </div>
      </div>
    </>
  );
}
