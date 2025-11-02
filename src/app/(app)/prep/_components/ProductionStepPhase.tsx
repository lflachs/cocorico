'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ChevronLeft,
  ChevronRight,
  SkipForward,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Plus,
  Minus,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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

type ProductionStepPhaseProps = {
  dishId: string;
  dishName: string;
  currentIndex: number;
  totalCount: number;
  onProcess: (quantity: number, notes?: string) => Promise<void>;
  onSkip: () => void;
  onBack: () => void;
};

export function ProductionStepPhase({
  dishId,
  dishName,
  currentIndex,
  totalCount,
  onProcess,
  onSkip,
  onBack,
}: ProductionStepPhaseProps) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [preview, setPreview] = useState<ProductionPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Load preview when dish or quantity changes
  useEffect(() => {
    if (dishId && quantity > 0) {
      loadPreview();
    }
  }, [dishId, quantity]);

  const loadPreview = async () => {
    setLoading(true);
    try {
      const { calculateProductionIngredientsAction } = await import(
        '@/lib/actions/production.actions'
      );
      const result = await calculateProductionIngredientsAction(dishId, quantity);

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

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity > 0) {
      setQuantity(newQuantity);
    }
  };

  const handleProcess = async () => {
    if (!preview || !preview.canProduce) {
      toast.error('Stock insuffisant pour produire');
      return;
    }

    setProcessing(true);
    try {
      await onProcess(quantity, notes || undefined);
      toast.success(`${quantity}x ${dishName} produit avec succès!`);
    } catch (error) {
      console.error('Error processing production:', error);
      toast.error('Erreur lors de la production');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full lg:flex-row">
      {/* Left Column - Dish Info & Quantity */}
      <div className="flex-shrink-0 lg:w-1/3 border-b lg:border-b-0 lg:border-r p-6 space-y-6">
        {/* Progress indicator */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Plat {currentIndex + 1} sur {totalCount}
          </span>
          <span>{Math.round(((currentIndex + 1) / totalCount) * 100)}%</span>
        </div>

        {/* Dish name */}
        <div>
          <h3 className="text-2xl font-bold mb-2">{dishName}</h3>
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {preview?.ingredients.length || 0} ingrédients requis
            </span>
          </div>
        </div>

        {/* Quantity selector */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">
            Quantité à produire <span className="text-destructive">*</span>
          </Label>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1 || loading || processing}
              className="h-12 w-12"
            >
              <Minus className="h-5 w-5" />
            </Button>
            <Input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
              className="text-center text-2xl font-bold h-12 flex-1"
              disabled={loading || processing}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={loading || processing}
              className="h-12 w-12"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
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
            rows={3}
            className="resize-none"
            disabled={loading || processing}
          />
        </div>

        {/* Status indicator */}
        {preview && !loading && (
          <div
            className={cn(
              'rounded-lg p-4 flex items-start gap-3',
              preview.canProduce
                ? 'bg-green-50 border border-green-200'
                : 'bg-orange-50 border border-orange-200'
            )}
          >
            {preview.canProduce ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">Prêt à produire</p>
                  <p className="text-sm text-green-800 mt-1">
                    Tous les ingrédients sont disponibles en stock.
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-900">Stock insuffisant</p>
                  <p className="text-sm text-orange-800 mt-1">
                    {preview.missingIngredients.join(', ')}
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Right Column - Ingredients */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-auto p-6">
          <h4 className="text-lg font-semibold mb-4">Ingrédients requis</h4>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Calcul des ingrédients...</p>
              </div>
            </div>
          ) : preview ? (
            <div className="space-y-2">
              {preview.ingredients.map((ingredient) => (
                <div
                  key={ingredient.productId}
                  className={cn(
                    'flex items-start gap-4 rounded-lg border p-4 transition-colors',
                    ingredient.sufficient
                      ? 'border-green-200 bg-green-50/50'
                      : 'border-red-200 bg-red-50/50'
                  )}
                >
                  {/* Stock status dot */}
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full mt-2 shrink-0',
                      ingredient.sufficient ? 'bg-green-500' : 'bg-red-500'
                    )}
                  />

                  {/* Ingredient info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-base mb-1">{ingredient.productName}</div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center gap-2">
                        <span>Requis:</span>
                        <strong className="text-foreground">
                          {ingredient.quantityRequired.toFixed(2)} {ingredient.unit}
                        </strong>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>Disponible:</span>
                        <strong
                          className={cn(
                            'font-semibold',
                            ingredient.sufficient ? 'text-green-600' : 'text-red-600'
                          )}
                        >
                          {ingredient.availableQuantity.toFixed(2)} {ingredient.unit}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Status icon */}
                  {ingredient.sufficient ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-1" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-1" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-sm text-muted-foreground">Aucun ingrédient</p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex-shrink-0 border-t p-6 bg-muted/30">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onBack}
                disabled={processing}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>

              <Button
                variant="outline"
                onClick={onSkip}
                disabled={processing}
              >
                <SkipForward className="h-4 w-4 mr-2" />
                Passer
              </Button>
            </div>

            <Button
              onClick={handleProcess}
              disabled={!preview || !preview.canProduce || processing || loading}
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Production en cours...
                </>
              ) : currentIndex < totalCount - 1 ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Produire & Suivant
                  <ChevronRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Produire & Terminer
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
