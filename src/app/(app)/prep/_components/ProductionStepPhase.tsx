'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

type CompositeIngredient = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  available: number;
  sufficient?: boolean;
  isComposite?: boolean;
  compositeIngredients?: CompositeIngredient[];
};

type ProductionIngredient = {
  productId: string;
  productName: string;
  quantityRequired: number;
  unit: string;
  availableQuantity: number;
  sufficient: boolean;
  isComposite?: boolean;
  compositeIngredients?: CompositeIngredient[];
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
  onProcess: (quantity: number, notes?: string, preparationIds?: string[]) => Promise<void>;
  onSkip: () => void;
  onBack: () => void;
  onAddPreparationNow?: (preparationId: string) => void; // New: immediately add prep to queue
};

// Recursive component for sub-ingredients
function SubIngredientItem({
  ingredient,
  expandedIds,
  onToggleExpand,
  onPrepareNow,
  level = 0,
}: {
  ingredient: CompositeIngredient;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onPrepareNow: (id: string) => void;
  level?: number;
}) {
  const isExpanded = expandedIds.has(ingredient.id);
  const hasSubIngredients = ingredient.isComposite && ingredient.compositeIngredients && ingredient.compositeIngredients.length > 0;
  const isMissing = ingredient.sufficient === false;

  return (
    <div>
      <div className={cn(
        "flex items-start gap-2 text-sm p-2 rounded-md transition-colors",
        isMissing ? "bg-orange-50 border border-orange-200" : "bg-white"
      )}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {hasSubIngredients && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleExpand(ingredient.id)}
              className="h-6 w-6 p-0 shrink-0"
            >
              {isExpanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={cn(
                "text-muted-foreground truncate",
                hasSubIngredients && "font-medium"
              )}>
                {ingredient.name}
              </span>
              {ingredient.isComposite && (
                <Badge variant="outline" className="text-[10px] py-0 px-1 h-4 shrink-0">
                  <Package className="h-2 w-2 mr-0.5" />
                  Prep
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="font-medium text-foreground">
                {ingredient.quantity.toFixed(2)} {ingredient.unit}
              </span>
              <span className={cn(
                isMissing ? "text-orange-600 font-medium" : "text-muted-foreground"
              )}>
                (stock: {ingredient.available.toFixed(2)} {ingredient.unit})
              </span>
            </div>

            {/* Button to prepare nested composite ingredient - always show for composite */}
            {ingredient.isComposite && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPrepareNow(ingredient.id)}
                className={cn(
                  "mt-2 w-full text-xs h-7",
                  isMissing
                    ? "border-orange-400 text-orange-700 hover:bg-orange-50"
                    : "border-gray-300"
                )}
              >
                <Package className="h-3 w-3 mr-1" />
                {isMissing ? 'Préparer maintenant' : 'Préparer aussi'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Nested sub-ingredients */}
      {hasSubIngredients && isExpanded && (
        <div className="ml-4 mt-2 pl-3 border-l-2 border-orange-100 space-y-2">
          {ingredient.compositeIngredients!.map((subIng) => (
            <SubIngredientItem
              key={subIng.id}
              ingredient={subIng}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              onPrepareNow={onPrepareNow}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ProductionStepPhase({
  dishId,
  dishName,
  currentIndex,
  totalCount,
  onProcess,
  onSkip,
  onBack,
  onAddPreparationNow,
}: ProductionStepPhaseProps) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [preview, setPreview] = useState<ProductionPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [expandedIngredients, setExpandedIngredients] = useState<Set<string>>(new Set());

  // Reset state when dish changes
  useEffect(() => {
    setQuantity(1);
    setNotes('');
    setPreview(null);
    setExpandedIngredients(new Set());
  }, [dishId]);

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

        // Auto-expand any composite ingredients to show toggles
        const allExpandedIds = new Set<string>();

        const expandComposites = (ingredients: any[]) => {
          for (const ing of ingredients) {
            if (ing.isComposite) {
              allExpandedIds.add(ing.productId || ing.id);

              // Recursively expand
              if (ing.compositeIngredients && ing.compositeIngredients.length > 0) {
                expandComposites(ing.compositeIngredients);
              }
            }
          }
        };

        expandComposites(result.data.ingredients);
        setExpandedIngredients(allExpandedIds);
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

  const handlePrepareNow = (preparationId: string) => {
    // Immediately switch to preparing this item
    if (onAddPreparationNow) {
      onAddPreparationNow(preparationId);
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
            <div className="space-y-3">
              {preview.ingredients.map((ingredient) => {
                const isExpanded = expandedIngredients.has(ingredient.productId);

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

                          {/* Button to prepare composite ingredient immediately */}
                          {ingredient.isComposite && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePrepareNow(ingredient.productId)}
                              className={cn(
                                "mt-3 w-full",
                                ingredient.sufficient
                                  ? "border-gray-300"
                                  : "border-orange-400 text-orange-700 hover:bg-orange-50 font-medium"
                              )}
                            >
                              <Package className="h-4 w-4 mr-2" />
                              {ingredient.sufficient
                                ? `Préparer ${ingredient.productName} maintenant`
                                : `Préparer ${ingredient.productName} d'abord`}
                            </Button>
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

                      {/* Sub-ingredients (composite breakdown) - recursive */}
                      {ingredient.isComposite && isExpanded && ingredient.compositeIngredients && (
                        <div className="mt-3 ml-5 pl-4 border-l-2 border-orange-200 space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                            Ingrédients de base
                          </p>
                          {ingredient.compositeIngredients.map((subIng) => (
                            <SubIngredientItem
                              key={subIng.id}
                              ingredient={subIng}
                              expandedIds={expandedIngredients}
                              onToggleExpand={toggleIngredientExpanded}
                              onPrepareNow={handlePrepareNow}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
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
