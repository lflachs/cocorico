'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ChefHat, Info, CalendarDays } from 'lucide-react';
import { ExpiringTodayCard } from './ExpiringTodayCard';
import { TodaysMenuCard } from './TodaysMenuCard';
import { StockStatusCard } from './StockStatusCard';
import { DailyMenuDialog } from './DailyMenuDialog';
import { ProductionHistoryCard } from './ProductionHistoryCard';

type ExpiringProduct = {
  id: string;
  product: {
    name: string;
    unit: string;
  };
  quantity: number;
  expirationDate: Date;
  lotNumber: string | null;
};

type MenuItem = {
  id: string;
  name: string;
  section: string;
  isReady: boolean;
  missingIngredients?: string[];
};

type StockItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  parLevel: number | null;
  status: 'GOOD' | 'LOW' | 'CRITICAL';
};

type ProductionHistoryItem = {
  id: string;
  dishId: string;
  dishName: string;
  quantityProduced: number;
  productionDate: Date;
  notes?: string | null;
};

type PrepPageContentProps = {
  expiringProducts: ExpiringProduct[];
  menuItems: MenuItem[];
  lowStockItems: StockItem[];
  recentProductions: ProductionHistoryItem[];
};

/**
 * PrepPageContent - Main content for Prep Mode
 *
 * Supports chef's preparation workflow:
 * - Production: Batch prepare dishes
 * - Info: What needs attention (expiring, menu, stock)
 */
export function PrepPageContent({ expiringProducts, menuItems, lowStockItems, recentProductions }: PrepPageContentProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('production');
  const [dailyMenuDialogOpen, setDailyMenuDialogOpen] = useState(false);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full max-w-3xl grid-cols-3 mb-6">
        <TabsTrigger value="production" className="gap-2">
          <ChefHat className="w-4 h-4" />
          Production
        </TabsTrigger>
        <TabsTrigger value="daily-menu" className="gap-2">
          <CalendarDays className="w-4 h-4" />
          Menu du jour
        </TabsTrigger>
        <TabsTrigger value="info" className="gap-2">
          <Info className="w-4 h-4" />
          Infos du jour
        </TabsTrigger>
      </TabsList>

      {/* PRODUCTION TAB - Big button to start production */}
      <TabsContent value="production" className="space-y-6">
        <div className="flex flex-col items-center justify-center py-12 space-y-6">
          <ChefHat className="h-20 w-20 text-primary" />
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">Production de plats</h2>
            <p className="text-muted-foreground">
              Préparez vos plats en lot et gérez automatiquement le stock
            </p>
          </div>
          <Button
            onClick={() => router.push('/prep/production')}
            size="lg"
            className="h-16 px-8 text-lg font-semibold"
          >
            <ChefHat className="mr-2 h-6 w-6" />
            Démarrer une production
          </Button>
        </div>

        {/* Production History */}
        <ProductionHistoryCard productions={recentProductions} />
      </TabsContent>

      {/* DAILY MENU TAB - Select today's menu */}
      <TabsContent value="daily-menu" className="space-y-6">
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <CalendarDays className="h-20 w-20 text-primary" />
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">Menu du jour</h2>
            <p className="text-muted-foreground">
              Définissez le menu du jour en sélectionnant entrée, plat et dessert
            </p>
          </div>
          <Button
            onClick={() => setDailyMenuDialogOpen(true)}
            size="lg"
            className="h-16 px-8 text-lg font-semibold"
          >
            <CalendarDays className="mr-2 h-6 w-6" />
            Configurer le menu du jour
          </Button>
        </div>

        {/* Daily Menu Dialog */}
        <DailyMenuDialog
          open={dailyMenuDialogOpen}
          onOpenChange={setDailyMenuDialogOpen}
        />
      </TabsContent>

      {/* INFO TAB - Today's information */}
      <TabsContent value="info" className="space-y-6">
        {/* Priority #1: Use expiring products first */}
        <ExpiringTodayCard products={expiringProducts} />

        {/* Reference: Today's menu and stock status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TodaysMenuCard items={menuItems} />
          <StockStatusCard items={lowStockItems} />
        </div>
      </TabsContent>
    </Tabs>
  );
}
