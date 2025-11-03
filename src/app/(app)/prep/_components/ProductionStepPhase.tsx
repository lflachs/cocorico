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
  Sprout,
  Trash2,
  Soup,
  Recycle,
  X,
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

type ByproductType = 'COMPOST' | 'STOCK' | 'WASTE' | 'REUSE';

type Byproduct = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  byproductType: ByproductType;
};

type ProductionStepPhaseProps = {
  dishId: string;
  dishName: string;
  currentIndex: number;
  totalCount: number;
  onProcess: (
    quantity: number,
    notes?: string,
    preparationIds?: string[],
    byproducts?: Byproduct[]
  ) => Promise<void>;
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
  const hasSubIngredients =
    ingredient.isComposite &&
    ingredient.compositeIngredients &&
    ingredient.compositeIngredients.length > 0;
  const isMissing = ingredient.sufficient === false;

  return (
    <div>
      <div
        className={cn(
          'flex items-start gap-2 rounded-md p-2 text-sm transition-colors',
          isMissing ? 'border border-orange-200 bg-orange-50' : 'bg-white'
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {hasSubIngredients && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleExpand(ingredient.id)}
              className="h-6 w-6 shrink-0 p-0"
            >
              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          )}
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span
                className={cn('text-muted-foreground truncate', hasSubIngredients && 'font-medium')}
              >
                {ingredient.name}
              </span>
              {ingredient.isComposite && (
                <Badge variant="outline" className="h-4 shrink-0 px-1 py-0 text-[10px]">
                  <Package className="mr-0.5 h-2 w-2" />
                  Prep
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-foreground font-medium">
                {ingredient.quantity.toFixed(2)} {ingredient.unit}
              </span>
              <span
                className={cn(isMissing ? 'font-medium text-orange-600' : 'text-muted-foreground')}
              >
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
                  'mt-2 h-7 w-full text-xs',
                  isMissing
                    ? 'border-orange-400 text-orange-700 hover:bg-orange-50'
                    : 'border-gray-300'
                )}
              >
                <Package className="mr-1 h-3 w-3" />
                {isMissing ? 'Préparer maintenant' : 'Préparer aussi'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Nested sub-ingredients */}
      {hasSubIngredients && isExpanded && (
        <div className="mt-2 ml-4 space-y-2 border-l-2 border-orange-100 pl-3">
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
  const [byproducts, setByproducts] = useState<Byproduct[]>([]);
  const [byproductsExpanded, setByproductsExpanded] = useState(false);

  // Reset state when dish changes
  useEffect(() => {
    setQuantity(1);
    setNotes('');
    setPreview(null);
    setExpandedIngredients(new Set());
    setByproducts([]);
    setByproductsExpanded(false);
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
    setExpandedIngredients((prev) => {
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

  const addByproduct = () => {
    const newByproduct: Byproduct = {
      id: `temp-${Date.now()}`,
      name: '',
      quantity: 0,
      unit: 'KG',
      byproductType: 'WASTE',
    };
    setByproducts([...byproducts, newByproduct]);
  };

  const updateByproduct = (id: string, updates: Partial<Byproduct>) => {
    setByproducts(byproducts.map((bp) => (bp.id === id ? { ...bp, ...updates } : bp)));
  };

  const removeByproduct = (id: string) => {
    setByproducts(byproducts.filter((bp) => bp.id !== id));
  };

  const getByproductIcon = (type: ByproductType) => {
    switch (type) {
      case 'COMPOST':
        return <Sprout className="h-3 w-3" />;
      case 'STOCK':
        return <Soup className="h-3 w-3" />;
      case 'WASTE':
        return <Trash2 className="h-3 w-3" />;
      case 'REUSE':
        return <Recycle className="h-3 w-3" />;
    }
  };

  const getByproductLabel = (type: ByproductType) => {
    switch (type) {
      case 'COMPOST':
        return 'Compost';
      case 'STOCK':
        return 'Stock';
      case 'WASTE':
        return 'Déchet';
      case 'REUSE':
        return 'Réutilisation';
    }
  };

  const handleProcess = async () => {
    if (!preview || !preview.canProduce) {
      toast.error('Stock insuffisant pour produire');
      return;
    }

    // Validate byproducts if any are added
    const validByproducts = byproducts.filter((bp) => bp.name.trim() && bp.quantity > 0);

    setProcessing(true);
    try {
      await onProcess(
        quantity,
        notes || undefined,
        undefined,
        validByproducts.length > 0 ? validByproducts : undefined
      );
      toast.success(`${quantity}x ${dishName} produit avec succès!`);
    } catch (error) {
      console.error('Error processing production:', error);
      toast.error('Erreur lors de la production');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Left Column - Dish Info & Quantity */}
      <div className="flex-shrink-0 space-y-6 border-b p-6 lg:w-1/3 lg:border-r lg:border-b-0">
        {/* Progress indicator */}
        <div className="text-muted-foreground flex items-center justify-between text-sm">
          <span>
            Plat {currentIndex + 1} sur {totalCount}
          </span>
          <span>{Math.round(((currentIndex + 1) / totalCount) * 100)}%</span>
        </div>

        {/* Dish name */}
        <div>
          <h3 className="mb-2 text-2xl font-bold text-wrap">{dishName}</h3>
          <div className="flex items-center gap-2">
            <Package className="text-muted-foreground h-4 w-4" />
            <span className="text-muted-foreground text-sm">
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
              className="h-12 flex-1 text-center text-2xl font-bold"
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
          <p className="text-muted-foreground text-sm">Nombre de portions à préparer</p>
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

        {/* Byproducts Section */}
        <div className="space-y-3 border-t pt-4">
          <button
            type="button"
            onClick={() => setByproductsExpanded(!byproductsExpanded)}
            className="flex w-full items-center justify-between text-left"
            disabled={loading || processing}
          >
            <Label className="flex cursor-pointer items-center gap-2 text-base font-semibold">
              <Recycle className="h-4 w-4" />
              Sous-produits
              <span className="text-muted-foreground text-sm font-normal">(optionnel)</span>
              {byproducts.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {byproducts.length}
                </Badge>
              )}
            </Label>
            {byproductsExpanded ? (
              <ChevronUp className="text-muted-foreground h-4 w-4" />
            ) : (
              <ChevronDown className="text-muted-foreground h-4 w-4" />
            )}
          </button>

          {byproductsExpanded && (
            <div className="space-y-3 pl-1">
              <p className="text-muted-foreground text-sm">
                Épluchures, parures, os... Suivez vos sous-produits pour compost ou stock.
              </p>

              {byproducts.length === 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addByproduct}
                  disabled={loading || processing}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un sous-produit
                </Button>
              ) : (
                <div className="space-y-3">
                  {byproducts.map((byproduct) => (
                    <div key={byproduct.id} className="bg-muted/30 space-y-3 rounded-lg border p-3">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 space-y-3">
                          <div>
                            <Label className="text-muted-foreground mb-1 text-xs">Nom</Label>
                            <Input
                              placeholder="ex: Épluchures de carotte"
                              value={byproduct.name}
                              onChange={(e) =>
                                updateByproduct(byproduct.id, { name: e.target.value })
                              }
                              disabled={loading || processing}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-muted-foreground mb-1 text-xs">Quantité</Label>
                              <Input
                                type="number"
                                step="0.1"
                                min="0"
                                placeholder="0"
                                value={byproduct.quantity || ''}
                                onChange={(e) =>
                                  updateByproduct(byproduct.id, {
                                    quantity: parseFloat(e.target.value) || 0,
                                  })
                                }
                                disabled={loading || processing}
                              />
                            </div>
                            <div>
                              <Label className="text-muted-foreground mb-1 text-xs">Unité</Label>
                              <select
                                value={byproduct.unit}
                                onChange={(e) =>
                                  updateByproduct(byproduct.id, { unit: e.target.value })
                                }
                                disabled={loading || processing}
                                className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                              >
                                <option value="KG">kg</option>
                                <option value="G">g</option>
                                <option value="L">L</option>
                                <option value="ML">mL</option>
                                <option value="PC">pièces</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <Label className="text-muted-foreground mb-1 text-xs">Type</Label>
                            <div className="grid grid-cols-2 gap-2">
                              {(['COMPOST', 'STOCK', 'WASTE', 'REUSE'] as ByproductType[]).map(
                                (type) => (
                                  <button
                                    key={type}
                                    type="button"
                                    onClick={() =>
                                      updateByproduct(byproduct.id, { byproductType: type })
                                    }
                                    disabled={loading || processing}
                                    className={cn(
                                      'flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors',
                                      byproduct.byproductType === type
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-background hover:bg-muted'
                                    )}
                                  >
                                    {getByproductIcon(type)}
                                    {getByproductLabel(type)}
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeByproduct(byproduct.id)}
                          disabled={loading || processing}
                          className="shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addByproduct}
                    disabled={loading || processing}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter un autre sous-produit
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status indicator */}
        {preview && !loading && (
          <div
            className={cn(
              'flex items-start gap-3 rounded-lg p-4',
              preview.canProduce
                ? 'border border-green-200 bg-green-50'
                : 'border border-orange-200 bg-orange-50'
            )}
          >
            {preview.canProduce ? (
              <>
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Prêt à produire</p>
                  <p className="mt-1 text-sm text-green-800">
                    Tous les ingrédients sont disponibles en stock.
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
                <div>
                  <p className="font-medium text-orange-900">Stock insuffisant</p>
                  <p className="mt-1 text-sm text-orange-800">
                    {preview.missingIngredients.join(', ')}
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Right Column - Ingredients */}
      <div className="flex flex-1 flex-col">
        <div className="flex-1 overflow-auto p-6">
          <h4 className="mb-4 text-lg font-semibold">Ingrédients requis</h4>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-center">
                <Loader2 className="text-muted-foreground mx-auto mb-3 h-8 w-8 animate-spin" />
                <p className="text-muted-foreground text-sm">Calcul des ingrédients...</p>
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
                            'mt-2 h-2 w-2 shrink-0 rounded-full',
                            ingredient.sufficient ? 'bg-green-500' : 'bg-orange-500'
                          )}
                        />

                        {/* Ingredient info */}
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className="text-base font-medium">{ingredient.productName}</span>
                            {ingredient.isComposite && (
                              <Badge variant="outline" className="text-xs">
                                <Package className="mr-1 h-3 w-3" />
                                Préparation
                              </Badge>
                            )}
                          </div>

                          <div className="text-muted-foreground space-y-1 text-sm">
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
                                'mt-3 w-full',
                                ingredient.sufficient
                                  ? 'border-gray-300'
                                  : 'border-orange-400 font-medium text-orange-700 hover:bg-orange-50'
                              )}
                            >
                              <Package className="mr-2 h-4 w-4" />
                              {ingredient.sufficient
                                ? `Préparer ${ingredient.productName} maintenant`
                                : `Préparer ${ingredient.productName} d'abord`}
                            </Button>
                          )}
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-2">
                          {/* Status icon */}
                          {ingredient.sufficient ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-orange-600" />
                          )}

                          {/* Expand button for composite ingredients */}
                          {ingredient.isComposite &&
                            ingredient.compositeIngredients &&
                            ingredient.compositeIngredients.length > 0 && (
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
                        <div className="mt-3 ml-5 space-y-2 border-l-2 border-orange-200 pl-4">
                          <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase">
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
            <div className="flex h-64 items-center justify-center">
              <p className="text-muted-foreground text-sm">Aucun ingrédient</p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="bg-muted/30 flex-shrink-0 border-t p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-2">
              <Button variant="outline" onClick={onBack} disabled={processing}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>

              <Button variant="outline" onClick={onSkip} disabled={processing}>
                <SkipForward className="mr-2 h-4 w-4" />
                Passer
              </Button>
            </div>

            <Button
              onClick={handleProcess}
              disabled={!preview || !preview.canProduce || processing || loading}
              className="from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 bg-gradient-to-r"
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
