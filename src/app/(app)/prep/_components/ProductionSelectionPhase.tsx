'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, ChefHat, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RecipeCard } from '@/components/cookbook/RecipeCard';
import { RecipeCategorySidebar } from '@/components/cookbook/RecipeCategorySidebar';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { toast } from 'sonner';
import type { CategoryType } from '@/components/cookbook/RecipeCategorySidebar';

type RecipeCategory = {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  order: number;
  parentId?: string | null;
  categoryType: CategoryType;
  isPredefined: boolean;
  children?: RecipeCategory[];
  _count?: {
    dishes?: number;
  };
};

type Dish = {
  id: string;
  name: string;
  description?: string | null;
  sellingPrice?: number | null;
  isActive?: boolean;
  categoryId?: string | null;
  category?: {
    id: string;
    name: string;
  } | null;
  recipeIngredients?: {
    id: string;
    quantityRequired: number;
    unit: string;
    product: {
      id: string;
      name: string;
      unitPrice?: number | null;
    };
  }[];
};

type PreparedIngredient = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  yieldQuantity: number | null;
  category: string | null;
  categoryId?: string | null;
  compositeIngredients: {
    id: string;
    baseProductId: string;
    quantity: number;
    unit: string;
    baseProduct: {
      id: string;
      name: string;
      unit: string;
      unitPrice?: number | null;
    };
  }[];
  calculatedUnitPrice?: number;
};

type RecipeItem = Dish | PreparedIngredient;

type ProductionSelectionPhaseProps = {
  items: RecipeItem[];
  loading: boolean;
  selectedItemIds: string[];
  onSelectedItemIdsChange: (ids: string[]) => void;
  onContinue: (selectedIds: string[]) => void;
  onCancel: () => void;
};

export function ProductionSelectionPhase({
  items,
  loading,
  selectedItemIds,
  onSelectedItemIdsChange,
  onContinue,
  onCancel,
}: ProductionSelectionPhaseProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [categories, setCategories] = useState<RecipeCategory[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load categories
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { getRecipeCategoriesAction } = await import('@/lib/actions/recipe-category.actions');
      // Load both DISH and PREPARED_INGREDIENT categories
      const [dishResult, preparedResult] = await Promise.all([
        getRecipeCategoriesAction('DISH'),
        getRecipeCategoriesAction('PREPARED_INGREDIENT'),
      ]);

      const allCategories = [];
      if (dishResult.success && dishResult.data) {
        allCategories.push(...(dishResult.data as RecipeCategory[]));
      }
      if (preparedResult.success && preparedResult.data) {
        allCategories.push(...(preparedResult.data as RecipeCategory[]));
      }

      setCategories(allCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // Filter items based on search and category
  const filteredItems = useMemo(() => {
    // Ensure items is always an array
    let filtered = items || [];

    // Filter by category
    if (selectedCategoryId) {
      filtered = filtered.filter((item) => item.categoryId === selectedCategoryId);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((item) => {
        const description = 'description' in item ? item.description : null;
        const category = 'category' in item && typeof item.category === 'object' ? item.category : null;

        return (
          item.name.toLowerCase().includes(query) ||
          description?.toLowerCase().includes(query) ||
          category?.name?.toLowerCase().includes(query)
        );
      });
    }

    return filtered;
  }, [items, searchQuery, selectedCategoryId]);

  // Calculate item metrics for display
  const calculateItemMetrics = (item: RecipeItem) => {
    // Check if it's a Dish
    if ('recipeIngredients' in item && item.recipeIngredients) {
      const cost = item.recipeIngredients.reduce((sum, ing) => {
        const unitPrice = ing.product.unitPrice ?? 0;
        return sum + unitPrice * ing.quantityRequired;
      }, 0);

      const ingredientCount = item.recipeIngredients.length;

      const margin = 'sellingPrice' in item && item.sellingPrice && cost > 0
        ? ((item.sellingPrice - cost) / item.sellingPrice) * 100
        : undefined;

      return { cost, ingredientCount, margin, sellingPrice: 'sellingPrice' in item ? item.sellingPrice : undefined };
    }

    // It's a PreparedIngredient
    if ('compositeIngredients' in item && item.compositeIngredients) {
      const cost = item.compositeIngredients.reduce((sum, ing) => {
        const unitPrice = ing.baseProduct.unitPrice ?? 0;
        return sum + unitPrice * ing.quantity;
      }, 0);

      const ingredientCount = item.compositeIngredients.length;

      return { cost, ingredientCount, margin: undefined, sellingPrice: undefined };
    }

    return { cost: 0, ingredientCount: 0, margin: undefined, sellingPrice: undefined };
  };

  const handleToggleSelection = (itemId: string, selected: boolean) => {
    if (selected) {
      onSelectedItemIdsChange([...selectedItemIds, itemId]);
    } else {
      onSelectedItemIdsChange(selectedItemIds.filter((id) => id !== itemId));
    }
  };

  const handleSelectAll = () => {
    onSelectedItemIdsChange(filteredItems.map((item) => item.id));
  };

  const handleDeselectAll = () => {
    onSelectedItemIdsChange([]);
  };

  const handleContinue = () => {
    if (selectedItemIds.length === 0) return;
    onContinue(selectedItemIds);
  };

  const getCurrentCategoryName = () => {
    if (!selectedCategoryId) {
      return 'Toutes les recettes';
    }
    const category = categories.find((c) => c.id === selectedCategoryId);
    return category?.name ?? 'Catégorie inconnue';
  };

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden lg:block lg:w-64 flex-shrink-0 border-r">
        <RecipeCategorySidebar
          categories={categories}
          categoryType="BOTH"
          selectedCategoryId={selectedCategoryId}
          onCategorySelect={setSelectedCategoryId}
          showManageButton={false}
        />
      </div>

      {/* Mobile Sidebar - Sheet/Drawer */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <RecipeCategorySidebar
            categories={categories}
            categoryType="BOTH"
            selectedCategoryId={selectedCategoryId}
            onCategorySelect={(categoryId) => {
              setSelectedCategoryId(categoryId);
              setSidebarOpen(false); // Close sidebar after selection on mobile
            }}
            showManageButton={false}
          />
        </SheetContent>
      </Sheet>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header with search and actions */}
        <div className="flex-shrink-0 md:px-6 py-4 px-0 md:py-4 py-3 border-b space-y-3 md:space-y-4">
          {/* Mobile: Category button + title */}
          <div className="flex items-center gap-3 mb-2 lg:hidden px-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="flex-shrink-0"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold truncate">{getCurrentCategoryName()}</h2>
              <p className="text-xs text-muted-foreground">
                {filteredItems.length} recette{filteredItems.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Desktop: Title */}
          <div className="hidden lg:block px-0">
            <h2 className="text-xl font-bold">{getCurrentCategoryName()}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {filteredItems.length} recette{filteredItems.length !== 1 ? 's' : ''}
              {selectedItemIds.length > 0 && ` • ${selectedItemIds.length} sélectionné${selectedItemIds.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Search */}
          <div className="relative px-4 md:px-0">
            <Search className="absolute left-7 md:left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher un plat, sauce ou préparation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Selection actions */}
          {filteredItems.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap px-4 md:px-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                Tout sélectionner
              </Button>
              {selectedItemIds.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeselectAll}
                >
                  Tout désélectionner
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Dishes grid */}
        <div className="flex-1 overflow-auto md:px-6 py-4 px-0 md:py-4 py-3 pb-24 md:pb-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <ChefHat className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
              <p className="text-sm text-muted-foreground">Chargement des plats...</p>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <ChefHat className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                {searchQuery
                  ? 'Aucune recette trouvée pour cette recherche'
                  : 'Aucune recette disponible'}
              </p>
              {!searchQuery && (
                <p className="text-xs text-muted-foreground">
                  Créez des plats ou préparations avec des recettes pour commencer.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-4 md:px-0">
            {filteredItems.map((item) => {
              const { cost, ingredientCount, margin, sellingPrice } = calculateItemMetrics(item);
              const isSelected = selectedItemIds.includes(item.id);
              const description = 'description' in item ? item.description : null;
              const isActive = 'isActive' in item ? item.isActive : true;

              return (
                <RecipeCard
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  description={description}
                  ingredientCount={ingredientCount}
                  cost={cost}
                  sellingPrice={sellingPrice}
                  margin={margin}
                  isActive={isActive}
                  selected={isSelected}
                  onSelect={(selected) => handleToggleSelection(item.id, selected)}
                />
              );
            })}
          </div>
        )}
      </div>

        {/* Footer with actions - Fixed at bottom on mobile */}
        <div className="flex-shrink-0 md:px-6 py-4 px-0 md:py-4 py-3 border-t bg-background md:bg-muted/30 fixed md:relative bottom-0 left-0 right-0 md:bottom-auto md:left-auto md:right-auto shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:shadow-none z-10">
          <div className="flex items-center justify-between gap-4 px-4 md:px-0">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1 md:flex-none"
            >
              Annuler
            </Button>

            <Button
              onClick={handleContinue}
              disabled={selectedItemIds.length === 0}
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 flex-1 md:flex-none"
            >
              Continuer ({selectedItemIds.length})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
