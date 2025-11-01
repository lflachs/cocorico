'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Beaker,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Plus,
  Trash2,
  Camera,
  Package
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { IngredientAutocomplete } from '@/components/ui/ingredient-autocomplete';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type FlowState = 'START' | 'PRODUCT_INFO' | 'INGREDIENTS' | 'SCANNING' | 'REVIEW' | 'COMPLETE';

const UNITS = [
  { value: 'KG', label: 'Kilogrammes (KG)' },
  { value: 'G', label: 'Grammes (G)' },
  { value: 'L', label: 'Litres (L)' },
  { value: 'ML', label: 'Millilitres (ML)' },
  { value: 'CL', label: 'Centilitres (CL)' },
  { value: 'PC', label: 'Pièces (PC)' },
  { value: 'BUNCH', label: 'Botte (BUNCH)' },
  { value: 'CLOVE', label: 'Gousse (CLOVE)' },
];

type Ingredient = {
  productName: string;
  quantity: string;
  unit: string;
};

type PreparedData = {
  name: string;
  category: string;
  yieldQuantity: string;
  yieldUnit: string;
  ingredients: Ingredient[];
};

type PreparedQuickCreateFlowProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PreparedQuickCreateFlow({ open, onOpenChange }: PreparedQuickCreateFlowProps) {
  const router = useRouter();
  const [state, setState] = useState<FlowState>('START');
  const [preparedData, setPreparedData] = useState<PreparedData>({
    name: '',
    category: '',
    yieldQuantity: '',
    yieldUnit: 'L',
    ingredients: [],
  });
  const [currentIngredient, setCurrentIngredient] = useState<Ingredient>({
    productName: '',
    quantity: '',
    unit: 'KG',
  });
  const [saving, setSaving] = useState(false);
  const [existingProducts, setExistingProducts] = useState<{ id: string; name: string }[]>([]);

  // Load existing products when dialog opens
  useEffect(() => {
    if (open) {
      loadExistingProducts();
    }
  }, [open]);

  const loadExistingProducts = async () => {
    try {
      const response = await fetch('/api/products?trackable=true');
      if (response.ok) {
        const products = await response.json();
        setExistingProducts(products.map((p: any) => ({
          id: p.id,
          name: p.name,
          displayName: p.displayName,
          aliases: p.aliases || []
        })));
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const celebrateWithConfetti = () => {
    const duration = 2000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: ReturnType<typeof setInterval> = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  };

  const handleStartManual = () => {
    setState('PRODUCT_INFO');
  };

  const handleNextToIngredients = () => {
    if (!preparedData.name.trim()) {
      toast.error('Le nom de la préparation est requis');
      return;
    }
    if (!preparedData.yieldQuantity) {
      toast.error('La quantité produite est requise');
      return;
    }
    setState('INGREDIENTS');
  };

  const handleAddIngredientAndNext = () => {
    if (!currentIngredient.productName || !currentIngredient.quantity) {
      toast.error('Veuillez entrer le nom et la quantité');
      return;
    }

    const qty = parseFloat(currentIngredient.quantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error('La quantité doit être positive');
      return;
    }

    setPreparedData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, currentIngredient],
    }));
    setCurrentIngredient({ productName: '', quantity: '', unit: 'KG' });
    toast.success('Ingrédient ajouté!');
  };

  const handleRemoveIngredient = (index: number) => {
    setPreparedData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const handleFinishIngredients = () => {
    if (preparedData.ingredients.length === 0) {
      toast.error('Ajoutez au moins un ingrédient');
      return;
    }
    setState('REVIEW');
  };

  const handleSavePrepared = async () => {
    setSaving(true);
    try {
      // Create base ingredients/products first
      const ingredientData = await Promise.all(
        preparedData.ingredients.map(async (ing) => {
          const formData = new FormData();
          formData.append('name', ing.productName);
          formData.append('quantity', '0');
          formData.append('unit', ing.unit);
          formData.append('trackable', 'true');

          const { createProductWithoutRedirectAction } = await import('@/lib/actions/product.actions');
          const result = await createProductWithoutRedirectAction(formData);

          if (result.success && result.data) {
            return {
              baseProductId: result.data.id,
              quantity: parseFloat(ing.quantity),
              unit: ing.unit,
            };
          }
          throw new Error(result.error || 'Échec de création de l\'ingrédient');
        })
      );

      // Create the composite product
      const response = await fetch('/api/composite-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: preparedData.name.trim(),
          category: preparedData.category.trim() || null,
          yieldQuantity: parseFloat(preparedData.yieldQuantity),
          yieldUnit: preparedData.yieldUnit,
          ingredients: ingredientData,
        }),
      });

      if (response.ok) {
        setState('COMPLETE');
        celebrateWithConfetti();
        toast.success('Préparation créée avec succès!');

        setTimeout(() => {
          router.refresh();
          resetFlow();
          onOpenChange(false);
        }, 2000);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Error creating prepared product:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  const resetFlow = () => {
    setState('START');
    setPreparedData({
      name: '',
      category: '',
      yieldQuantity: '',
      yieldUnit: 'L',
      ingredients: [],
    });
    setCurrentIngredient({ productName: '', quantity: '', unit: 'KG' });
  };

  const handleBack = () => {
    if (state === 'INGREDIENTS') {
      setState('PRODUCT_INFO');
    } else if (state === 'REVIEW') {
      setState('INGREDIENTS');
    } else if (state === 'PRODUCT_INFO') {
      setState('START');
    }
  };

  const handleClose = () => {
    if (state !== 'START' && state !== 'COMPLETE' && preparedData.name) {
      if (confirm('Vous avez des données non sauvegardées. Quitter quand même ?')) {
        resetFlow();
        onOpenChange(false);
      }
    } else {
      resetFlow();
      onOpenChange(false);
    }
  };

  const renderContent = () => {
    // START state
    if (state === 'START') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 p-6">
          <div className="text-center space-y-3">
            <Beaker className="h-20 w-20 mx-auto text-primary" />
            <h2 className="text-3xl font-bold">Créer une préparation</h2>
            <p className="text-muted-foreground max-w-md">
              Créez un produit composite (crème pâtissière, sauce, fond...) en définissant ses ingrédients de base.
            </p>
          </div>

          <div className="w-full max-w-md space-y-3">
            {/* Scan option */}
            <label htmlFor="scan-prep-file" className="block cursor-pointer">
              <div className="p-6 rounded-lg border-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 transition-all">
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Camera className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-lg">Scanner une recette</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Prenez une photo ou importez une image de votre recette
                    </p>
                  </div>
                </div>
              </div>
              <input
                id="scan-prep-file"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    toast.info('Scan de recette bientôt disponible!');
                  }
                }}
              />
            </label>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Ou</span>
              </div>
            </div>

            {/* Manual option */}
            <Button
              onClick={handleStartManual}
              variant="outline"
              size="lg"
              className="w-full h-auto p-6"
            >
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="p-3 bg-secondary/10 rounded-full">
                  <Plus className="h-8 w-8 text-secondary" />
                </div>
                <div className="text-center">
                  <div className="font-semibold text-lg">Saisie manuelle</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Entrez les informations de la préparation manuellement
                  </p>
                </div>
              </div>
            </Button>
          </div>
        </div>
      );
    }

    // PRODUCT_INFO state
    if (state === 'PRODUCT_INFO') {
      return (
        <div className="flex flex-col h-full">
          {/* Progress */}
          <div className="p-4 border-b bg-muted/30">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                1
              </div>
              <span className="font-medium">Informations</span>
              <span className="text-muted-foreground">→</span>
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-semibold text-muted-foreground">
                2
              </div>
              <span className="text-muted-foreground">Ingrédients</span>
            </div>
          </div>

          {/* Form */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="text-center space-y-2">
                <Beaker className="h-16 w-16 mx-auto text-primary" />
                <h2 className="text-2xl font-bold">Informations de la préparation</h2>
                <p className="text-muted-foreground">Entrez le nom et la quantité produite</p>
              </div>

              {/* Product Name */}
              <div className="space-y-3">
                <label className="text-lg font-semibold block">
                  Nom de la préparation <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Ex: Crème pâtissière, Fond de volaille..."
                  value={preparedData.name}
                  onChange={(e) => setPreparedData({ ...preparedData, name: e.target.value })}
                  className="text-2xl h-16 font-medium"
                  autoFocus
                />
              </div>

              {/* Category */}
              <div className="space-y-3">
                <label className="text-lg font-semibold block">
                  Catégorie <span className="text-muted-foreground text-sm">(Optionnel)</span>
                </label>
                <Input
                  type="text"
                  placeholder="Ex: Crème, Sauce, Fond..."
                  value={preparedData.category}
                  onChange={(e) => setPreparedData({ ...preparedData, category: e.target.value })}
                  className="text-lg h-14"
                />
              </div>

              {/* Yield Quantity */}
              <div className="space-y-3">
                <label className="text-lg font-semibold block">
                  Quantité produite <span className="text-destructive">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 1"
                    value={preparedData.yieldQuantity}
                    onChange={(e) => setPreparedData({ ...preparedData, yieldQuantity: e.target.value })}
                    className="text-2xl h-16 font-mono font-bold text-center"
                  />
                  <Select
                    value={preparedData.yieldUnit}
                    onValueChange={(value) => setPreparedData({ ...preparedData, yieldUnit: value })}
                  >
                    <SelectTrigger className="h-16 text-xl font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map((unit) => (
                        <SelectItem key={unit.value} value={unit.value} className="text-lg">
                          {unit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-sm text-muted-foreground">
                  Ex: Cette recette produit 1 litre de crème pâtissière
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t p-4 bg-muted/30">
            <div className="max-w-2xl mx-auto flex gap-3">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1"
                size="lg"
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Retour
              </Button>
              <Button
                onClick={handleNextToIngredients}
                disabled={!preparedData.name.trim() || !preparedData.yieldQuantity}
                className="flex-2 bg-gradient-to-r from-primary to-secondary"
                size="lg"
              >
                Suivant: Ingrédients
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // INGREDIENTS state - Card-based step by step
    if (state === 'INGREDIENTS') {
      return (
        <div className="flex flex-col h-full">
          {/* Progress */}
          <div className="p-4 border-b bg-muted/30">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-8 h-8 rounded-full bg-success text-success-foreground flex items-center justify-center font-semibold">
                ✓
              </div>
              <span className="text-muted-foreground">Informations</span>
              <span className="text-muted-foreground">→</span>
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                2
              </div>
              <span className="font-medium">Ingrédients</span>
              <Badge variant="secondary" className="ml-2">{preparedData.ingredients.length}</Badge>
            </div>
          </div>

          {/* Current Ingredient Card - BIG */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto">
              <div className="text-center space-y-2 mb-6">
                <Package className="h-16 w-16 mx-auto text-primary" />
                <h2 className="text-2xl font-bold">
                  {preparedData.ingredients.length === 0
                    ? "Premier ingrédient"
                    : preparedData.ingredients.length === 1
                    ? "Deuxième ingrédient"
                    : preparedData.ingredients.length === 2
                    ? "Troisième ingrédient"
                    : `${preparedData.ingredients.length + 1}ème ingrédient`}
                </h2>
                <p className="text-muted-foreground">
                  {preparedData.ingredients.length > 0 && (
                    <Badge variant="secondary" className="text-base px-4 py-1">
                      {preparedData.ingredients.length} déjà ajouté{preparedData.ingredients.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </p>
              </div>

              {/* Big ingredient card */}
              <div className="bg-card border-2 border-primary/20 rounded-2xl p-8 space-y-6 shadow-lg">
                {/* Ingredient Name */}
                <div className="space-y-3">
                  <label className="text-lg font-semibold block">
                    Nom de l'ingrédient <span className="text-destructive">*</span>
                  </label>
                  <IngredientAutocomplete
                    value={currentIngredient.productName}
                    onChange={(value) => setCurrentIngredient({ ...currentIngredient, productName: value })}
                    placeholder="Ex: Lait, Sucre, Œufs..."
                    disabled={saving}
                    className="text-xl h-16"
                    existingProducts={existingProducts}
                    restrictToExisting={true}
                  />
                </div>

                {/* Quantity and Unit */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="text-lg font-semibold block">
                      Quantité <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 500"
                      value={currentIngredient.quantity}
                      onChange={(e) => setCurrentIngredient({ ...currentIngredient, quantity: e.target.value })}
                      className="text-2xl h-16 font-mono font-bold text-center"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-lg font-semibold block">
                      Unité <span className="text-destructive">*</span>
                    </label>
                    <Select
                      value={currentIngredient.unit}
                      onValueChange={(value) => setCurrentIngredient({ ...currentIngredient, unit: value })}
                    >
                      <SelectTrigger className="h-16 text-xl font-semibold">
                        <SelectValue placeholder="Choisir..." />
                      </SelectTrigger>
                      <SelectContent>
                        {UNITS.map((unit) => (
                          <SelectItem key={unit.value} value={unit.value} className="text-lg">
                            {unit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Add button */}
                <Button
                  type="button"
                  onClick={handleAddIngredientAndNext}
                  disabled={!currentIngredient.productName || !currentIngredient.quantity || !currentIngredient.unit}
                  className="w-full h-14 text-lg bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
                  size="lg"
                >
                  <Check className="w-6 h-6 mr-2" />
                  {preparedData.ingredients.length === 0
                    ? "Ajouter et passer au suivant"
                    : "Ajouter un autre ingrédient"}
                </Button>
              </div>

              {/* Added ingredients list - compact */}
              {preparedData.ingredients.length > 0 && (
                <div className="mt-6 space-y-2">
                  <h3 className="font-semibold text-sm text-muted-foreground">Ingrédients ajoutés:</h3>
                  {preparedData.ingredients.map((ing, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                      <div className="flex-1">
                        <div className="font-medium">{ing.productName}</div>
                        <div className="text-sm text-muted-foreground">
                          {ing.quantity} {ing.unit}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveIngredient(index)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t p-4 bg-muted/30">
            <div className="max-w-2xl mx-auto space-y-3">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                  size="lg"
                >
                  <ChevronLeft className="w-5 h-5 mr-2" />
                  Retour
                </Button>
                <Button
                  onClick={handleFinishIngredients}
                  disabled={preparedData.ingredients.length === 0}
                  className="flex-2 bg-gradient-to-r from-primary to-secondary"
                  size="lg"
                >
                  <Check className="w-5 h-5 mr-2" />
                  {preparedData.ingredients.length === 0
                    ? "Terminer (0 ingrédient)"
                    : `Terminer avec ${preparedData.ingredients.length} ingrédient${preparedData.ingredients.length > 1 ? 's' : ''}`}
                </Button>
              </div>
              {preparedData.ingredients.length === 0 ? (
                <p className="text-xs text-center text-orange-600">
                  Ajoutez au moins un ingrédient pour continuer
                </p>
              ) : (
                <p className="text-xs text-center text-green-600">
                  ✓ Vous pouvez terminer ou ajouter d'autres ingrédients
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    // REVIEW state
    if (state === 'REVIEW') {
      return (
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b bg-muted/30">
            <div className="text-center space-y-2">
              <Sparkles className="h-16 w-16 mx-auto text-primary" />
              <h2 className="text-2xl font-bold">Vérifier et créer</h2>
              <p className="text-muted-foreground">Vérifiez les informations avant de créer la préparation</p>
            </div>
          </div>

          {/* Summary */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Product info card */}
              <div className="p-6 rounded-lg border-2 bg-card">
                <h3 className="font-semibold text-lg mb-4">Préparation</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-muted-foreground">Nom</div>
                    <div className="text-xl font-semibold">{preparedData.name}</div>
                  </div>
                  {preparedData.category && (
                    <div>
                      <div className="text-sm text-muted-foreground">Catégorie</div>
                      <div>{preparedData.category}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-muted-foreground">Quantité produite</div>
                    <div className="text-lg font-semibold">
                      {preparedData.yieldQuantity} {preparedData.yieldUnit}
                    </div>
                  </div>
                </div>
              </div>

              {/* Ingredients card */}
              <div className="p-6 rounded-lg border-2 bg-card">
                <h3 className="font-semibold text-lg mb-4">
                  Ingrédients ({preparedData.ingredients.length})
                </h3>
                <div className="space-y-2">
                  {preparedData.ingredients.map((ing, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                      <div className="font-medium">{ing.productName}</div>
                      <div className="text-sm text-muted-foreground">
                        {ing.quantity} {ing.unit}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t p-4 bg-muted/30">
            <div className="max-w-2xl mx-auto flex gap-3">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={saving}
                className="flex-1"
                size="lg"
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Modifier
              </Button>
              <Button
                onClick={handleSavePrepared}
                disabled={saving}
                className="flex-2 bg-gradient-to-r from-primary to-secondary"
                size="lg"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Création...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Créer la préparation
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // COMPLETE state
    if (state === 'COMPLETE') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 p-6">
          <div className="text-center space-y-4">
            <div className="h-20 w-20 mx-auto rounded-full bg-success/10 flex items-center justify-center animate-bounce">
              <Check className="h-10 w-10 text-success" />
            </div>
            <h2 className="text-3xl font-bold">Préparation créée!</h2>
            <p className="text-muted-foreground max-w-md">
              <strong>{preparedData.name}</strong> a été créée avec {preparedData.ingredients.length} ingrédient(s).
            </p>
          </div>

          <div className="w-full max-w-md p-6 rounded-lg border bg-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Préparation</span>
              <span className="font-semibold">{preparedData.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Produit</span>
              <span className="font-semibold">{preparedData.yieldQuantity} {preparedData.yieldUnit}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Ingrédients</span>
              <span className="font-semibold">{preparedData.ingredients.length}</span>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-3xl w-full h-[90vh] p-0 gap-0 overflow-hidden [&>button]:hidden"
        onPointerDownOutside={(e) => {
          if (state !== 'START' && state !== 'COMPLETE' && preparedData.name) {
            e.preventDefault();
          }
        }}
      >
        <VisuallyHidden>
          <DialogTitle>Créer une nouvelle préparation</DialogTitle>
        </VisuallyHidden>

        {/* Custom close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 z-50 rounded-full"
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Content */}
        <div className="h-full overflow-hidden">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
