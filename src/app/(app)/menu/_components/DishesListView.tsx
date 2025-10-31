'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { toast } from 'sonner';
import { DishEditModal } from './DishEditModal';
import { CreateButton } from '@/components/CreateButton';

/**
 * Dishes List View - Manage all dishes à la carte
 * Shows all dishes with search, create, edit, and delete functionality
 */

type Dish = {
  id: string;
  name: string;
  description?: string | null;
  sellingPrice?: number | null;
  isActive: boolean;
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

export function DishesListView() {
  const router = useRouter();
  const { t } = useLanguage();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [filteredDishes, setFilteredDishes] = useState<Dish[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);

  const loadDishes = async () => {
    setLoading(true);
    try {
      const { getDishesAction } = await import('@/lib/actions/dish.actions');
      const result = await getDishesAction({ includeRecipe: true });
      if (result.success && result.data) {
        setDishes(result.data as Dish[]);
        setFilteredDishes(result.data as Dish[]);
      }
    } catch (error) {
      console.error('Error loading dishes:', error);
      toast.error('Failed to load dishes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDishes();
  }, []);

  // Filter dishes based on search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredDishes(dishes);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredDishes(
        dishes.filter(
          (dish) =>
            dish.name.toLowerCase().includes(query) ||
            dish.description?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, dishes]);

  const handleCreateDish = () => {
    router.push('/menu/create-dish');
  };

  const handleEditDish = (dish: Dish) => {
    setSelectedDish(dish);
    setShowEditModal(true);
  };

  const handleDeleteDish = async (dishId: string, dishName: string) => {
    if (!confirm(`Are you sure you want to delete "${dishName}"?`)) {
      return;
    }

    try {
      const { deleteDishAction } = await import('@/lib/actions/dish.actions');
      const result = await deleteDishAction(dishId);

      if (result.success) {
        toast.success('Dish deleted successfully');
        loadDishes();
      } else {
        toast.error(result.error || 'Failed to delete dish');
      }
    } catch (error) {
      console.error('Error deleting dish:', error);
      toast.error('Failed to delete dish');
    }
  };

  const calculateDishCost = (dish: Dish): number => {
    if (!dish.recipeIngredients || dish.recipeIngredients.length === 0) {
      return 0;
    }
    return dish.recipeIngredients.reduce((total, ing) => {
      const unitPrice = ing.product?.unitPrice || 0;
      return total + ing.quantityRequired * unitPrice;
    }, 0);
  };

  if (loading) {
    return (
      <div className="py-12 text-center">
        <RefreshCw className="text-primary mx-auto h-8 w-8 animate-spin" />
        <p className="text-muted-foreground mt-2 text-sm">Loading dishes...</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Actions Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative max-w-md flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
            <Input
              type="text"
              placeholder={t('menu.search') || 'Search dishes...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="cursor-text pl-10"
            />
          </div>
          <div className="flex gap-2">
            <CreateButton onClick={handleCreateDish}>{t('menu.createDish')}</CreateButton>
          </div>
        </div>

        {/* Dishes Grid */}
        {filteredDishes.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              {searchQuery ? (
                <>
                  <p className="text-muted-foreground mb-4">
                    No dishes found matching "{searchQuery}"
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setSearchQuery('')}
                    className="cursor-pointer"
                  >
                    {t('menu.clearSearch')}
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground mb-4">{t('menu.empty')}</p>
                  <CreateButton onClick={handleCreateDish}>{t('menu.emptyHint')}</CreateButton>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredDishes.map((dish) => {
              const cost = calculateDishCost(dish);
              const sellingPrice = dish.sellingPrice;
              const margin =
                cost > 0 && sellingPrice ? ((sellingPrice - cost) / sellingPrice) * 100 : null;

              return (
                <Card key={dish.id} className="transition-shadow hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold">{dish.name}</h3>
                          {!dish.isActive && (
                            <span className="text-muted-foreground text-xs">Inactive</span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditDish(dish)}
                            className="h-8 w-8 cursor-pointer p-0"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDish(dish.id, dish.name)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 cursor-pointer p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Description */}
                      {dish.description && (
                        <p className="text-muted-foreground line-clamp-2 text-sm">
                          {dish.description}
                        </p>
                      )}

                      {/* Stats */}
                      <div className="space-y-2 border-t pt-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Ingredients</span>
                          <span className="font-medium">{dish.recipeIngredients?.length || 0}</span>
                        </div>

                        {/* Cost - Always show */}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{t('menu.dish.cost')}</span>
                          <span
                            className={`font-medium ${cost === 0 ? 'text-muted-foreground' : ''}`}
                          >
                            €{cost.toFixed(2)}
                          </span>
                        </div>

                        {/* Selling Price - Always show */}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {t('menu.dishWizard.sellingPrice')}
                          </span>
                          <span
                            className={`font-medium ${!sellingPrice ? 'text-muted-foreground' : ''}`}
                          >
                            {sellingPrice ? `€${sellingPrice.toFixed(2)}` : '-'}
                          </span>
                        </div>

                        {/* Margin - Show when both cost and selling price exist */}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {t('menu.dishWizard.margin')}
                          </span>
                          {margin !== null && cost > 0 && sellingPrice ? (
                            <span
                              className={`font-semibold ${
                                margin > 0 ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {margin.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {selectedDish && (
        <DishEditModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          dish={selectedDish}
          onSuccess={() => {
            loadDishes();
            setShowEditModal(false);
          }}
        />
      )}
    </>
  );
}
