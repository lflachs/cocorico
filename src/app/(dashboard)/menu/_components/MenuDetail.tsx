'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowLeft, Plus, Trash2, Pencil, ChefHat, ChevronDown, Search, Loader2, DollarSign, TrendingUp, Edit2, X, Check } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { toast } from 'sonner';
import { DishEditModal } from './DishEditModal';
import { getMenuPricingSummary } from '@/lib/utils/menu-pricing';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Menu Detail
 * Shows menu sections with dishes
 */

type Dish = {
  id: string;
  name: string;
  description?: string | null;
  sellingPrice?: number | null;
  recipeIngredients?: {
    id: string;
    productId: string;
    quantityRequired: number;
    unit: string;
    product: {
      id: string;
      name: string;
      unit: string;
      unitPrice?: number | null;
    };
  }[];
};

type MenuDish = {
  id: string;
  dish: Dish;
};

type MenuSection = {
  id: string;
  name: string;
  displayOrder: number;
  dishes: MenuDish[];
};

type Menu = {
  id: string;
  name: string;
  description?: string | null;
  fixedPrice: number | null;
  pricingType: 'PRIX_FIXE' | 'CHOICE';
  minCourses?: number | null;
  maxCourses?: number | null;
  sections: MenuSection[];
};

type MenuDetailProps = {
  menuId: string;
  onBack: () => void;
};

export function MenuDetail({ menuId, onBack }: MenuDetailProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [menu, setMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [showDishSelector, setShowDishSelector] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [availableDishes, setAvailableDishes] = useState<Dish[]>([]);
  const [filteredDishes, setFilteredDishes] = useState<Dish[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingDishes, setLoadingDishes] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingPricing, setEditingPricing] = useState(false);
  const [pricingFormData, setPricingFormData] = useState({
    pricingType: 'PRIX_FIXE' as 'PRIX_FIXE' | 'CHOICE',
    fixedPrice: 0,
    numberOfCourses: 2,
  });
  const [savingPricing, setSavingPricing] = useState(false);

  const loadMenu = useCallback(async () => {
    setLoading(true);
    try {
      const { getMenuByIdAction } = await import('@/lib/actions/menu.actions');
      const result = await getMenuByIdAction(menuId);
      if (result.success && result.data) {
        const menuData = result.data as Menu;
        setMenu(menuData);
        // Initialize pricing form data
        setPricingFormData({
          pricingType: menuData.pricingType,
          fixedPrice: menuData.fixedPrice || 0,
          numberOfCourses: menuData.minCourses || 2,
        });
      }
    } catch (error) {
      console.error('Error loading menu:', error);
      toast.error(t('menu.update.error'));
    } finally {
      setLoading(false);
    }
  }, [menuId, t]);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  const handleCreateNewDish = (sectionId: string) => {
    router.push('/menu/create-dish');
  };

  const handleSelectExistingDish = async (sectionId: string) => {
    setSelectedSectionId(sectionId);
    setShowDishSelector(true);
    setSearchQuery('');

    // Load dishes
    setLoadingDishes(true);
    try {
      const { getDishesAction } = await import('@/lib/actions/dish.actions');
      const result = await getDishesAction();
      if (result.success && result.data) {
        setAvailableDishes(result.data as Dish[]);
        setFilteredDishes(result.data as Dish[]);
      }
    } catch (error) {
      console.error('Error loading dishes:', error);
      toast.error('Failed to load dishes');
    } finally {
      setLoadingDishes(false);
    }
  };

  const handleEditDish = (dish: Dish) => {
    setSelectedDish(dish);
    setShowEditModal(true);
  };

  const handleAddExistingDish = async (dishId: string) => {
    if (!selectedSectionId) return;

    setAdding(true);
    try {
      const { addDishToSectionAction } = await import('@/lib/actions/menu.actions');
      const result = await addDishToSectionAction(selectedSectionId, dishId);

      if (result.success) {
        toast.success('Dish added to menu');
        loadMenu();
        setShowDishSelector(false);
      } else {
        toast.error(result.error || 'Failed to add dish');
      }
    } catch (error) {
      console.error('Error adding dish:', error);
      toast.error('Failed to add dish');
    } finally {
      setAdding(false);
    }
  };

  // Filter dishes based on search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredDishes(availableDishes);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredDishes(
        availableDishes.filter(
          (dish) =>
            dish.name.toLowerCase().includes(query) ||
            dish.description?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, availableDishes]);

  const handleRemoveDish = async (menuDishId: string) => {
    try {
      const { removeDishFromSectionAction } = await import('@/lib/actions/menu.actions');
      const result = await removeDishFromSectionAction(menuDishId);

      if (result.success) {
        toast.success(t('menu.delete.success'));
        loadMenu();
      } else {
        toast.error(result.error || t('menu.delete.error'));
      }
    } catch (error) {
      console.error('Error removing dish:', error);
      toast.error(t('menu.delete.error'));
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

  if (loading || !menu) {
    return <div className="text-center py-8">Loading...</div>;
  }

  const pricingSummary = getMenuPricingSummary(menu as any);

  return (
    <>
      <Card>
        <CardHeader>
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="w-fit mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t('menu.backToMenus')}
          </Button>
          <CardTitle>{menu.name}</CardTitle>
          {menu.description && (
            <CardDescription>{menu.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pricing Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Pricing Type</p>
                <p className="font-semibold text-sm">{pricingSummary.pricingType}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">{t('menu.pricing.price')}</p>
                <p className="font-semibold text-sm">{pricingSummary.price}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">{t('menu.pricing.margin')}</p>
                <p className="font-semibold text-sm">{pricingSummary.margin}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">{t('menu.pricing.costRange')}</p>
                <p className="font-semibold text-sm">{pricingSummary.costRange}</p>
              </div>
            </div>
          </div>
          {menu.sections.map((section) => (
            <div key={section.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{section.name}</h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      className="cursor-pointer"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      {t('menu.section.addDish')}
                      <ChevronDown className="w-4 h-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleCreateNewDish(section.id)}
                      className="cursor-pointer"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {t('menu.createDish')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleSelectExistingDish(section.id)}
                      className="cursor-pointer"
                    >
                      <ChefHat className="w-4 h-4 mr-2" />
                      {t('menu.selectExisting')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {section.dishes.length === 0 ? (
                <p className="text-center py-6 text-gray-500">
                  {t('menu.section.noDishes')}
                </p>
              ) : (
                <div className="space-y-2">
                  {section.dishes.map((menuDish) => {
                    const cost = calculateDishCost(menuDish.dish);
                    const sellingPrice = menuDish.dish.sellingPrice;
                    const margin = cost > 0 && sellingPrice
                      ? ((sellingPrice - cost) / sellingPrice) * 100
                      : null;

                    return (
                      <div
                        key={menuDish.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{menuDish.dish.name}</div>
                          {menuDish.dish.description && (
                            <div className="text-sm text-gray-600">
                              {menuDish.dish.description}
                            </div>
                          )}
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                            <span>
                              {menuDish.dish.recipeIngredients?.length || 0} {t('menu.dish.ingredients')}
                            </span>
                            {cost > 0 && (
                              <span>
                                {t('menu.dishWizard.estimatedCost')}: €{cost.toFixed(2)}
                              </span>
                            )}
                            {sellingPrice && (
                              <span>
                                {t('menu.dishWizard.sellingPrice')}: €{sellingPrice.toFixed(2)}
                              </span>
                            )}
                            {margin !== null && (
                              <span className={margin > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                                {t('menu.dishWizard.margin')}: {margin.toFixed(1)}%
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditDish(menuDish.dish)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveDish(menuDish.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Dish Selector Dialog */}
      <Dialog open={showDishSelector} onOpenChange={setShowDishSelector}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{t('menu.selectExisting')}</DialogTitle>
            <DialogDescription>
              Select a dish to add to this section
            </DialogDescription>
          </DialogHeader>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 cursor-text"
            />
          </div>

          {/* Dishes List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {loadingDishes ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                <p className="text-sm text-muted-foreground mt-2">Loading dishes...</p>
              </div>
            ) : filteredDishes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? (
                  <>
                    <p>No dishes found matching "{searchQuery}"</p>
                    <Button
                      variant="link"
                      onClick={() => setSearchQuery('')}
                      className="mt-2 cursor-pointer"
                    >
                      Clear search
                    </Button>
                  </>
                ) : (
                  <>
                    <p>No dishes available yet</p>
                    <Button
                      variant="link"
                      onClick={() => {
                        setShowDishSelector(false);
                        router.push('/menu/create-dish');
                      }}
                      className="mt-2 cursor-pointer"
                    >
                      Create your first dish
                    </Button>
                  </>
                )}
              </div>
            ) : (
              filteredDishes.map((dish) => {
                const cost = calculateDishCost(dish);
                const sellingPrice = dish.sellingPrice;

                return (
                  <Card
                    key={dish.id}
                    className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
                    onClick={() => !adding && handleAddExistingDish(dish.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{dish.name}</h4>
                          {dish.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {dish.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                            <span>
                              {dish.recipeIngredients?.length || 0} {t('menu.dish.ingredients')}
                            </span>
                            {cost > 0 && (
                              <span>
                                {t('menu.dish.cost')}: €{cost.toFixed(2)}
                              </span>
                            )}
                            {sellingPrice && (
                              <span>
                                €{sellingPrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                        <Plus className="w-5 h-5 text-primary shrink-0 ml-4" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dish Modal */}
      {selectedDish && (
        <DishEditModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          dish={selectedDish}
          onSuccess={() => {
            loadMenu();
            setShowEditModal(false);
          }}
        />
      )}
    </>
  );
}
