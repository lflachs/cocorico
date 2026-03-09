'use client';

import { type ReactNode, useState, useEffect, lazy, Suspense } from 'react';
import { LanguageProvider } from '@/providers/LanguageProvider';
import { RestaurantProvider } from '@/providers/RestaurantProvider';
import { Toaster } from '@/components/ui/sonner';
import { MobileMenuToggle } from '@/components/layout/MobileMenuToggle';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { PermissionManager } from '@/components/PermissionManager';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';
import { useRouter } from 'next/navigation';

// Lazy load VoiceAssistant for better initial page load performance
const VoiceAssistant = lazy(() =>
  import('@/components/voice/VoiceAssistant').then((module) => ({ default: module.VoiceAssistant }))
);

/**
 * App Layout
 * Dark sidebar with mobile-responsive design matching POC
 */

function AppContent({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const router = useRouter();

  // Load collapsed state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-collapsed');
    if (savedState !== null) {
      setIsCollapsed(savedState === 'true');
    }
  }, []);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  const toggleCollapsed = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
  };

  return (
    <div className="bg-layout-background flex h-screen overflow-hidden">
      <MobileMenuToggle isOpen={isOpen} onToggle={toggleSidebar} />
      <Sidebar
        isOpen={isOpen}
        isCollapsed={isCollapsed}
        onNavigate={closeSidebar}
        onToggleCollapsed={toggleCollapsed}
      />

      <div className="flex min-h-0 flex-1 flex-col lg:ml-0">
        <MobileHeader />

        <main className="flex-1 overflow-x-hidden overflow-y-auto overscroll-contain p-8">
          <div className="mx-auto min-h-full max-w-7xl space-y-6">{children}</div>
        </main>
      </div>

      {/* Global Voice Assistant - Lazy loaded for performance */}
      <Suspense fallback={null}>
        <VoiceAssistant onInventoryUpdate={() => router.refresh()} />
      </Suspense>

      {/* Permission Manager for PWA features */}
      <PermissionManager />

      {/* Onboarding tour for demo users */}
      <OnboardingTour />
    </div>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <RestaurantProvider>
        <AppContent>{children}</AppContent>
        <Toaster />
      </RestaurantProvider>
    </LanguageProvider>
  );
}
