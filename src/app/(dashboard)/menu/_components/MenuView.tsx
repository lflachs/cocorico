'use client';

import { useState } from 'react';
import { MenuList } from './MenuList';
import { MenuDetail } from './MenuDetail';
import { PreparedIngredientsList } from './PreparedIngredientsList';
import { useLanguage } from '@/providers/LanguageProvider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChefHat, Beaker } from 'lucide-react';

/**
 * Menu View
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          {t('recipes.title')}
        </h1>
        <p className="mt-2 text-gray-600">
          {t('recipes.subtitle')}
        </p>
      </div>

      {view === 'list' ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="menus" className="flex items-center gap-2">
              <ChefHat className="w-4 h-4" />
              {t('recipes.tabs.menuItems')}
            </TabsTrigger>
            <TabsTrigger value="prepared" className="flex items-center gap-2">
              <Beaker className="w-4 h-4" />
              {t('recipes.tabs.prepared')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="menus" className="mt-6">
            <MenuList onSelectMenu={handleSelectMenu} />
          </TabsContent>

          <TabsContent value="prepared" className="mt-6">
            <PreparedIngredientsList />
          </TabsContent>
        </Tabs>
      ) : (
        <MenuDetail menuId={selectedMenuId!} onBack={handleBackToList} />
      )}
    </div>
  );
}
