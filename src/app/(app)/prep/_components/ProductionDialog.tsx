'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DishAutocomplete } from '@/components/ui/dish-autocomplete';
import { CheckCircle2, AlertTriangle, Package, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type Dish = {
  id: string;
  name: string;
};

type ProductionIngredient = {
  productId: string;
  productName: string;
  quantityRequired: number;
  unit: string;
  availableQuantity: number;
  sufficient: boolean;
};

type ProductionPreview = {
  dishId: string;
  dishName: string;
  quantityToProduce: number;
  ingredients: ProductionIngredient[];
  canProduce: boolean;
  missingIngredients: string[];
};

type ProductionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ProductionDialog({ open, onOpenChange }: ProductionDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [producing, setProducing] = useState(false);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [selectedDishId, setSelectedDishId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [preview, setPreview] = useState<ProductionPreview | null>(null);

  // Load dishes when dialog opens
  useEffect(() => {
    if (open) {
      loadDishes();
    }
  }, [open]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedDishId('');
      setQuantity('');
      setNotes('');
      setPreview(null);
    }
  }, [open]);

  const loadDishes = async () => {
    try {
      const { getDishesAction } = await import('@/lib/actions/dish.actions');
      const result = await getDishesAction({ isActive: true, includeRecipe: true });
      if (result.success && result.data) {
        // Filter dishes that have recipes
        const dishesWithRecipes = result.data.filter(
          (dish) => dish.recipeIngredients && dish.recipeIngredients.length > 0
        );
        setDishes(dishesWithRecipes);
      }
    } catch (error) {
      console.error('Error loading dishes:', error);
      toast.error('Erreur lors du chargement des plats');
    }
  };

  const handleCalculate = async () => {
    if (!selectedDishId || !quantity) {
      toast.error('Veuillez sélectionner un plat et entrer une quantité');
      return;
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error('La quantité doit être un nombre positif');
      return;
    }

    setLoading(true);
    try {
      const { calculateProductionIngredientsAction } = await import(
        '@/lib/actions/production.actions'
      );
      const result = await calculateProductionIngredientsAction(selectedDishId, qty);

      if (result.success && result.data) {
        setPreview(result.data);
      } else {
        toast.error(result.error || 'Erreur lors du calcul des ingrédients');
      }
    } catch (error) {
      console.error('Error calculating ingredients:', error);
      toast.error('Erreur lors du calcul des ingrédients');
    } finally {
      setLoading(false);
    }
  };

  const handleProduce = async () => {
    if (!preview || !preview.canProduce) {
      toast.error('Stock insuffisant pour produire');
      return;
    }

    setProducing(true);
    try {
      const { createProductionAction } = await import('@/lib/actions/production.actions');
      const result = await createProductionAction({
        dishId: selectedDishId,
        quantity: parseFloat(quantity),
        notes: notes || undefined,
      });

      if (result.success) {
        toast.success(`${quantity}x ${preview.dishName} produit avec succès!`);
        onOpenChange(false);
        // Refresh server data without full page reload
        router.refresh();
      } else {
        toast.error(result.error || 'Erreur lors de la production');
      }
    } catch (error) {
      console.error('Error creating production:', error);
      toast.error('Erreur lors de la production');
    } finally {
      setProducing(false);
    }
  };

  const handleReset = () => {
    setPreview(null);
    setQuantity('');
  };

  const selectedDish = dishes.find((d) => d.id === selectedDishId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Production de plats</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Selection Form */}
          {!preview && (
            <div className="space-y-4">
              {/* Dish Selection */}
              <div className="space-y-2">
                <Label htmlFor="dish" className="text-base font-semibold">
                  Plat <span className="text-destructive">*</span>
                </Label>
                <DishAutocomplete
                  dishes={dishes}
                  value={selectedDishId}
                  onValueChange={setSelectedDishId}
                  placeholder="Rechercher un plat..."
                  disabled={loading || producing}
                />
                {dishes.length === 0 && (
                  <p className="text-muted-foreground text-sm">
                    Aucun plat avec recette. Créez un plat avec des ingrédients d'abord.
                  </p>
                )}
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-base font-semibold">
                  Quantité <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  step="1"
                  placeholder="ex: 30"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="cursor-text text-lg"
                  disabled={loading || producing}
                />
                <p className="text-muted-foreground text-sm">
                  Nombre de portions à préparer
                </p>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-base font-semibold">
                  Notes <span className="text-muted-foreground text-sm">(optionnel)</span>
                </Label>
                <Textarea
                  id="notes"
                  placeholder="ex: Pour le service du vendredi"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="cursor-text resize-none"
                  disabled={loading || producing}
                />
              </div>

              {/* Calculate Button */}
              <Button
                type="button"
                onClick={handleCalculate}
                disabled={!selectedDishId || !quantity || loading}
                className="w-full h-12 text-base"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Calcul en cours...
                  </>
                ) : (
                  <>
                    <Package className="mr-2 h-5 w-5" />
                    Calculer les ingrédients
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-lg font-semibold">{preview.dishName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {preview.quantityToProduce} portions
                  </p>
                </div>
                {preview.canProduce ? (
                  <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    Prêt à produire
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm font-medium text-orange-600">
                    <AlertTriangle className="h-5 w-5" />
                    Stock insuffisant
                  </div>
                )}
              </div>

              {/* Ingredients List */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {preview.ingredients.map((ingredient) => (
                  <div
                    key={ingredient.productId}
                    className={`flex items-center justify-between rounded-lg border p-3 ${
                      ingredient.sufficient
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{ingredient.productName}</div>
                      <div className="text-sm text-muted-foreground">
                        Requis: <strong>{ingredient.quantityRequired.toFixed(2)}</strong> {ingredient.unit} |
                        Dispo: <strong>{ingredient.availableQuantity.toFixed(2)}</strong> {ingredient.unit}
                      </div>
                    </div>
                    {ingredient.sufficient ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                    )}
                  </div>
                ))}
              </div>

              {/* Warning */}
              {!preview.canProduce && preview.missingIngredients.length > 0 && (
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
                    <div>
                      <h4 className="font-medium text-orange-900">Stock insuffisant</h4>
                      <p className="mt-1 text-sm text-orange-800">
                        {preview.missingIngredients.join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={producing}
                  className="flex-1"
                >
                  Modifier
                </Button>
                <Button
                  type="button"
                  onClick={handleProduce}
                  disabled={!preview.canProduce || producing}
                  className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                >
                  {producing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Production...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Confirmer
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
