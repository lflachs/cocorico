'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ShoppingBasket, Check, Plus, Minus, X } from 'lucide-react';
import { toast } from 'sonner';

type Product = {
  id: string;
  name: string;
  displayName: string | null;
  quantity: number;
  unit: string;
  category: string | null;
};

type SelectedIngredient = {
  productId: string;
  productName: string;
  quantityPerServing: number;
  unit: string;
};

/**
 * DailyMenuPageContent - Full-screen page for Menu du jour
 *
 * Chef configures today's menu du jour with ingredients
 * Stock is deducted when the menu is sold, not when configured
 */
export function DailyMenuPageContent() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<SelectedIngredient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingMenuId, setExistingMenuId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Load available products from stock and check for existing menu
  useEffect(() => {
    loadProducts();
    checkExistingMenu();
  }, []);

  const checkExistingMenu = async () => {
    try {
      const { getTodaysDailyMenuAction } = await import('@/lib/actions/menu.actions');
      const result = await getTodaysDailyMenuAction();

      if (result.success && result.data) {
        setExistingMenuId(result.data.id);
        setIsEditMode(true);
        setSelectedIngredients(result.data.ingredients);
      }
    } catch (error) {
      console.error('Error checking existing menu:', error);
    }
  };

  // Filter products based on search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProducts(products);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredProducts(
        products.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            (p.displayName && p.displayName.toLowerCase().includes(query)) ||
            (p.category && p.category.toLowerCase().includes(query))
        )
      );
    }
  }, [searchQuery, products]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { getProductsAction } = await import('@/lib/actions/product.actions');
      const result = await getProductsAction();

      if (result.success && result.data) {
        // Only show products with stock > 0 and trackable
        const availableProducts = result.data.filter((p) => p.trackable && p.quantity > 0);
        console.log('Available products:', availableProducts.length);
        setProducts(availableProducts);
        setFilteredProducts(availableProducts);
      } else {
        console.error('Failed to load products:', result.error);
        toast.error(result.error || 'Erreur lors du chargement des produits');
      }
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  const addIngredient = (product: Product) => {
    // Check if already added
    const existing = selectedIngredients.find((i) => i.productId === product.id);
    if (existing) {
      toast.info(`${product.displayName || product.name} déjà ajouté`);
      return;
    }

    const newIngredient: SelectedIngredient = {
      productId: product.id,
      productName: product.displayName || product.name,
      quantityPerServing: 0.1, // Default quantity per serving
      unit: product.unit,
    };

    setSelectedIngredients([...selectedIngredients, newIngredient]);
    toast.success(`${product.displayName || product.name} ajouté`);
  };

  const removeIngredient = (productId: string) => {
    setSelectedIngredients(selectedIngredients.filter((i) => i.productId !== productId));
  };

  const updateIngredientQuantity = (productId: string, quantity: number) => {
    if (quantity < 0) return;
    setSelectedIngredients(
      selectedIngredients.map((i) =>
        i.productId === productId ? { ...i, quantityPerServing: quantity } : i
      )
    );
  };

  const handleSave = async () => {
    if (selectedIngredients.length === 0) {
      toast.error('Veuillez sélectionner au moins un ingrédient');
      return;
    }

    // Check if any ingredient has 0 quantity
    const hasZeroQuantity = selectedIngredients.some((i) => i.quantityPerServing <= 0);
    if (hasZeroQuantity) {
      toast.error('Toutes les quantités doivent être supérieures à 0');
      return;
    }

    setSaving(true);
    try {
      const { recordDailyMenuAction } = await import('@/lib/actions/menu.actions');

      // Save the menu configuration (upsert - creates or updates)
      const result = await recordDailyMenuAction({
        ingredients: selectedIngredients,
      });

      if (result.success) {
        toast.success(
          isEditMode
            ? 'Menu du jour modifié avec succès'
            : 'Menu du jour configuré avec succès'
        );
        router.push('/prep');
        router.refresh();
      } else {
        toast.error(result.error || 'Erreur lors de l\'enregistrement');
      }
    } catch (error) {
      console.error('Error saving daily menu:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/prep');
  };

  return (
    <div className="flex flex-col h-screen bg-background -mx-4 -mt-8 -mb-20">
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-background">
        <div className="flex items-center justify-between px-4 md:px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              className="shrink-0"
              disabled={saving}
            >
              <X className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <ShoppingBasket className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              <div>
                <h1 className="text-xl md:text-2xl font-bold">
                  {isEditMode ? 'Modifier le menu du jour' : 'Menu du jour'}
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground hidden md:block">
                  {isEditMode
                    ? 'Modifiez les ingrédients du menu du jour'
                    : 'Configurez les ingrédients qui composent le menu du jour'}
                </p>
              </div>
            </div>
          </div>

          {selectedIngredients.length > 0 && (
            <div className="text-sm text-muted-foreground">
              <strong>{selectedIngredients.length}</strong> ingrédient{selectedIngredients.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Main content area - full height with two columns */}
      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        {/* Left Column: Ingredient Market */}
        <div className="flex-shrink-0 flex flex-col border-b lg:border-b-0 lg:border-r lg:w-1/2 overflow-hidden">
          <div className="p-4 md:p-6 space-y-4">
            <div>
              <Label className="text-base font-semibold mb-2 block">
                Ingrédients disponibles
              </Label>
              <Input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={loading || saving}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-4 md:pb-6">
            <div className="space-y-2">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chargement des produits...
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'Aucun produit trouvé' : 'Aucun produit en stock'}
                </div>
              ) : (
                filteredProducts.map((product) => {
                  const isSelected = selectedIngredients.some((i) => i.productId === product.id);
                  return (
                    <div
                      key={product.id}
                      className={`flex items-center justify-between p-3 rounded-lg border bg-white hover:shadow-sm transition-shadow ${
                        isSelected ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {product.displayName || product.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Stock: {product.quantity.toFixed(2)} {product.unit}
                          {product.category && ` • ${product.category}`}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addIngredient(product)}
                        disabled={isSelected || saving}
                        className="ml-2"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Selected Ingredients & Portions */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 md:p-6 space-y-4">
            <div>
              <Label className="text-base font-semibold mb-2 flex items-center gap-2">
                Ingrédients sélectionnés
                {selectedIngredients.length > 0 && (
                  <Badge variant="secondary">{selectedIngredients.length}</Badge>
                )}
              </Label>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 md:px-6">
            <div className="space-y-3 pb-4 md:pb-6">
              {selectedIngredients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Cliquez sur + pour ajouter des ingrédients
                </div>
              ) : (
                selectedIngredients.map((ingredient) => (
                  <div
                    key={ingredient.productId}
                    className="bg-blue-50 p-3 rounded-lg border space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{ingredient.productName}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeIngredient(ingredient.productId)}
                        disabled={saving}
                        className="h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          updateIngredientQuantity(
                            ingredient.productId,
                            Math.max(0, ingredient.quantityPerServing - 0.1)
                          )
                        }
                        disabled={saving}
                        className="h-8 w-8"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        value={ingredient.quantityPerServing}
                        onChange={(e) =>
                          updateIngredientQuantity(
                            ingredient.productId,
                            parseFloat(e.target.value) || 0
                          )
                        }
                        disabled={saving}
                        className="flex-1 text-center"
                      />
                      <span className="text-sm text-muted-foreground min-w-[40px]">
                        {ingredient.unit}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          updateIngredientQuantity(
                            ingredient.productId,
                            ingredient.quantityPerServing + 0.1
                          )
                        }
                        disabled={saving}
                        className="h-8 w-8"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Actions Footer */}
          <div className="flex-shrink-0 border-t bg-muted/30">
            <div className="p-4 md:p-6">
              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || selectedIngredients.length === 0}
                  className="flex-1"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      {isEditMode ? 'Modifier le menu' : 'Enregistrer le menu'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
