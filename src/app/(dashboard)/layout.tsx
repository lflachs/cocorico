'use client';

import { type ReactNode, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, Globe, Home, UtensilsCrossed, Package, AlertOctagon, Upload, Calendar } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LanguageProvider, useLanguage } from '@/providers/LanguageProvider';
import { Toaster } from '@/components/ui/sonner';

/**
 * Dashboard Layout
 * Dark sidebar with mobile-responsive design matching POC
 */

function DashboardContent({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();

  const menuItems = [
    {
      id: 'today',
      href: '/today',
      icon: Home,
      label: t('nav.today'),
    },
    {
      id: 'menu',
      href: '/menu',
      icon: UtensilsCrossed,
      label: t('nav.menu'),
    },
    {
      id: 'inventory',
      href: '/inventory',
      icon: Package,
      label: t('nav.inventory'),
    },
    {
      id: 'dlc',
      href: '/dlc',
      icon: Calendar,
      label: t('nav.dlc') || 'DLC',
    },
    {
      id: 'bills',
      href: '/bills',
      icon: Upload,
      label: t('nav.bills'),
    },
    {
      id: 'disputes',
      href: '/disputes',
      icon: AlertOctagon,
      label: t('nav.disputes'),
    },
  ];

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fr' : 'en');
  };

  const closeSidebar = () => setIsOpen(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-3 left-4 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-white/80 backdrop-blur-sm shadow-sm border"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-10"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 h-full bg-slate-800 shadow-lg z-20 transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0 lg:shadow-none lg:border-r lg:border-slate-700
          w-64
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full pt-15">
          {/* Logo */}
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">Cocorico</h2>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 p-4">
            <div className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);

                return (
                  <Link key={item.id} href={item.href} onClick={closeSidebar}>
                    <Button
                      variant={isActive ? 'default' : 'ghost'}
                      className={`
                        w-full justify-start gap-3 h-12 text-white
                        ${isActive ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-slate-700'}
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-700">
            {/* Language Switcher */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleLanguage}
              className="w-full justify-start gap-3 text-slate-100 border-slate-500 hover:bg-slate-600 hover:text-white bg-slate-700"
            >
              <Globe className="w-4 h-4" />
              <span>{language === 'en' ? 'Français' : 'English'}</span>
            </Button>

            <div className="mt-4 text-xs text-slate-400 text-center">© 2024 Cocorico</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 lg:ml-0">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-center relative flex-shrink-0 z-30">
          <div className="absolute left-4">{/* Space for hamburger */}</div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-gray-900">Cocorico</h1>
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto overscroll-contain pb-20 px-4 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6 min-h-full">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <DashboardContent>{children}</DashboardContent>
      <Toaster />
    </LanguageProvider>
  );
}
