'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
  ChevronDown,
  ChevronUp,
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
  isComposite?: boolean;
  compositeIngredients?: {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    available: number;
  }[];
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
  const [expandedIngredients, setExpandedIngredients] = useState<Set<string>>(new Set());
  const [preparationsToAdd, setPreparationsToAdd] = useState<Set<string>>(new Set());

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

        // Auto-expand and auto-select missing composite ingredients
        const missingComposites = result.data.ingredients.filter(
          (ing: ProductionIngredient) => ing.isComposite && !ing.sufficient
        );

        if (missingComposites.length > 0) {
          setExpandedIngredients(new Set(missingComposites.map((ing: ProductionIngredient) => ing.productId)));
          setPreparationsToAdd(new Set(missingComposites.map((ing: ProductionIngredient) => ing.productId)));
        }
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

  const toggleIngredientExpanded = (productId: string) => {
    setExpandedIngredients(prev => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const togglePreparationToAdd = (productId: string) => {
    setPreparationsToAdd(prev => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
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
            <div className="space-y-3">
              {preview.ingredients.map((ingredient) => {
                const isExpanded = expandedIngredients.has(ingredient.productId);
                const willPrepare = preparationsToAdd.has(ingredient.productId);

                return (
                  <div key={ingredient.productId}>
                    <div
                      className={cn(
                        'rounded-lg border p-4 transition-colors',
                        ingredient.sufficient
                          ? 'border-green-200 bg-green-50/50'
                          : ingredient.isComposite
                          ? 'border-orange-200 bg-orange-50/50'
                          : 'border-red-200 bg-red-50/50'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {/* Stock status dot */}
                        <div
                          className={cn(
                            'w-2 h-2 rounded-full mt-2 shrink-0',
                            ingredient.sufficient ? 'bg-green-500' : 'bg-orange-500'
                          )}
                        />

                        {/* Ingredient info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <span className="font-medium text-base">{ingredient.productName}</span>
                            {ingredient.isComposite && (
                              <Badge variant="outline" className="text-xs">
                                <Package className="h-3 w-3 mr-1" />
                                Préparation
                              </Badge>
                            )}
                          </div>

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
                                  ingredient.sufficient ? 'text-green-600' : 'text-orange-600'
                                )}
                              >
                                {ingredient.availableQuantity.toFixed(2)} {ingredient.unit}
                              </strong>
                            </div>
                          </div>

                          {/* Toggle to prepare composite ingredient */}
                          {ingredient.isComposite && !ingredient.sufficient && (
                            <div className="mt-3 flex items-center gap-3 p-3 bg-white rounded-md border border-orange-200">
                              <Switch
                                checked={willPrepare}
                                onCheckedChange={() => togglePreparationToAdd(ingredient.productId)}
                                id={`prepare-${ingredient.productId}`}
                              />
                              <Label
                                htmlFor={`prepare-${ingredient.productId}`}
                                className="text-sm font-medium cursor-pointer flex-1"
                              >
                                Préparer {ingredient.productName} d'abord
                              </Label>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2 shrink-0">
                          {/* Status icon */}
                          {ingredient.sufficient ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-orange-600" />
                          )}

                          {/* Expand button for composite ingredients */}
                          {ingredient.isComposite && ingredient.compositeIngredients && ingredient.compositeIngredients.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleIngredientExpanded(ingredient.productId)}
                              className="h-8 px-2"
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Sub-ingredients (composite breakdown) */}
                      {ingredient.isComposite && isExpanded && ingredient.compositeIngredients && (
                        <div className="mt-3 ml-5 pl-4 border-l-2 border-orange-200 space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                            Ingrédients de base
                          </p>
                          {ingredient.compositeIngredients.map((subIng) => (
                            <div
                              key={subIng.id}
                              className="flex items-center justify-between text-sm p-2 bg-white rounded-md"
                            >
                              <span className="text-muted-foreground">{subIng.name}</span>
                              <div className="flex items-center gap-3">
                                <span className="font-medium">
                                  {subIng.quantity.toFixed(2)} {subIng.unit}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  (stock: {subIng.available.toFixed(2)} {subIng.unit})
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Summary of preparations to add */}
              {preparationsToAdd.size > 0 && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-2">
                    📋 {preparationsToAdd.size} préparation{preparationsToAdd.size > 1 ? 's' : ''} sera ajoutée à la file
                  </p>
                  <p className="text-xs text-blue-700">
                    Ces préparations seront produites avant ce plat.
                  </p>
                </div>
              )}
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
