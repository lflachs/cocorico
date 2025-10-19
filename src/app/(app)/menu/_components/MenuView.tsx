'use client';

import { useState } from 'react';
import { MenuList } from './MenuList';
import { MenuDetail } from './MenuDetail';
import { PreparedIngredientsList } from './PreparedIngredientsList';
import { DishesListView } from './DishesListView';
import { useLanguage } from '@/providers/LanguageProvider';
import { AnimatedTabs, AnimatedTabsContent } from '@/components/tabs';
import { PageHeader } from '@/components/PageHeader';
import { MissingPriceAlert } from '@/components/MissingPriceAlert';
import { ChefHat, Beaker, UtensilsCrossed } from 'lucide-react';

/**
 * Menu View - Redesigned
 * Main component that manages different menu views with tabs
 */

export type View = 'list' | 'detail';

export function MenuView() {
  const { t } = useLanguage();
  const [view, setView] = useState<View>('list');
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('menus');

  const handleSelectMenu = (menuId: string) => {
    setSelectedMenuId(menuId);
    setView('detail');
  };

  const handleBackToList = () => {
    setSelectedMenuId(null);
    setView('list');
  };

  return (
    <div className="space-y-6">
      {/* Header with gradient background */}
      <PageHeader
        title={t('recipes.title')}
        subtitle={t('recipes.subtitle')}
        icon={ChefHat}
      />

      <MissingPriceAlert />

      {view === 'list' ? (
        <>
          {/* Tabs */}
          <AnimatedTabs
            tabs={[
              { value: 'menus', label: t('recipes.tabs.menuItems'), icon: ChefHat },
              { value: 'dishes', label: t('recipes.tabs.dishes'), icon: UtensilsCrossed },
              { value: 'prepared', label: t('recipes.tabs.prepared'), icon: Beaker },
            ]}
            defaultValue={activeTab}
            onValueChange={setActiveTab}
            tabsListClassName="max-w-2xl shadow-md"
          >
            <AnimatedTabsContent value="menus">
              <MenuList onSelectMenu={handleSelectMenu} />
            </AnimatedTabsContent>

            <AnimatedTabsContent value="dishes">
              <DishesListView />
            </AnimatedTabsContent>

            <AnimatedTabsContent value="prepared">
              <PreparedIngredientsList />
            </AnimatedTabsContent>
          </AnimatedTabs>
        </>
      ) : (
        <MenuDetail menuId={selectedMenuId!} onBack={handleBackToList} />
      )}
    </div>
  );
}
