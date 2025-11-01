'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ChefHat,
  X,
  Check,
  Scan,
  Upload,
  Sparkles,
  Plus,
  Trash2,
  Camera,
  ChevronLeft,
  ChevronRight,
  Package
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { IngredientAutocomplete } from '@/components/ui/ingredient-autocomplete';
import { QuantityInput } from '@/components/ui/quantity-input';
import { UnitSelector } from '@/components/ui/unit-selector';
import { InlineIngredientCreator } from './InlineIngredientCreator';

type FlowState = 'START' | 'DISH_INFO' | 'INGREDIENTS' | 'SCANNING' | 'REVIEW' | 'COMPLETE';

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

type Product = {
  id: string;
  name: string;
  unit: string;
  unitPrice?: number | null;
};

type Ingredient = {
  productId?: string;
  productName: string;
  quantity: number;
  unit: string;
};

type DishData = {
  name: string;
  description: string;
  sellingPrice: string;
  ingredients: Ingredient[];
};

type DishQuickCreateFlowProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DishQuickCreateFlow({ open, onOpenChange }: DishQuickCreateFlowProps) {
  const router = useRouter();
  const [state, setState] = useState<FlowState>('START');
  const [dishData, setDishData] = useState<DishData>({
    name: '',
    description: '',
    sellingPrice: '',
    ingredients: [],
  });
  const [currentIngredient, setCurrentIngredient] = useState<Ingredient>({
    productName: '',
    quantity: 0,
    unit: 'KG',
  });
  const [saving, setSaving] = useState(false);
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [existingProducts, setExistingProducts] = useState<Product[]>([]);
  const [showIngredientCreator, setShowIngredientCreator] = useState(false);

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
    setState('DISH_INFO');
  };

  const handleNextToDishInfo = () => {
    setState('DISH_INFO');
  };

  const handleNextToIngredients = () => {
    if (!dishData.name.trim()) {
      toast.error('Le nom du plat est requis');
      return;
    }
    setState('INGREDIENTS');
  };

  const handleAddIngredientAndNext = () => {
    if (!currentIngredient.productName || currentIngredient.quantity <= 0) {
      toast.error('Veuillez entrer le nom et la quantité');
      return;
    }

    // Check if product exists
    const existingProduct = existingProducts.find(
      (p) => p.name.toLowerCase() === currentIngredient.productName.toLowerCase()
    );

    if (existingProduct) {
      // Use existing product
      setDishData(prev => ({
        ...prev,
        ingredients: [
          ...prev.ingredients,
          {
            productId: existingProduct.id,
            productName: existingProduct.name,
            quantity: currentIngredient.quantity,
            unit: existingProduct.unit,
          },
        ],
      }));
      setCurrentIngredient({ productName: '', quantity: 0, unit: 'KG' });
      toast.success('Ingrédient ajouté!');
    } else {
      // Show creator for new ingredient
      setShowIngredientCreator(true);
    }
  };

  const handleFinishIngredients = () => {
    if (dishData.ingredients.length === 0) {
      toast.error('Ajoutez au moins un ingrédient');
      return;
    }
    setState('REVIEW');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScanFile(file);
      handleScanRecipe(file);
    }
  };

  const handleScanRecipe = async (file: File) => {
    setScanning(true);
    setState('SCANNING');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/dishes/scan', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Échec du scan');
      }

      if (result.success && result.data) {
        // Populate dish data from scan
        setDishData({
          name: result.data.name || '',
          description: result.data.description || '',
          sellingPrice: result.data.sellingPrice?.toString() || '',
          ingredients: result.data.ingredients || [],
        });

        setState('REVIEW');
        toast.success('Recette scannée avec succès!');
      }
    } catch (error) {
      console.error('Scan error:', error);
      toast.error('Erreur lors du scan. Passez en mode manuel.');
      setState('MANUAL');
    } finally {
      setScanning(false);
    }
  };

  const handleAddIngredient = () => {
    if (!currentIngredient.productName || currentIngredient.quantity <= 0) {
      toast.error('Veuillez entrer le nom et la quantité');
      return;
    }

    // Check if product exists
    const existingProduct = existingProducts.find(
      (p) => p.name.toLowerCase() === currentIngredient.productName.toLowerCase()
    );

    if (existingProduct) {
      // Use existing product
      setDishData(prev => ({
        ...prev,
        ingredients: [
          ...prev.ingredients,
          {
            productId: existingProduct.id,
            productName: existingProduct.name,
            quantity: currentIngredient.quantity,
            unit: existingProduct.unit,
          },
        ],
      }));
      setCurrentIngredient({ productName: '', quantity: 0, unit: 'KG' });
    } else {
      // Show creator for new ingredient
      setShowIngredientCreator(true);
    }
  };

  const handleIngredientCreated = (product: Product) => {
    // Add to products list
    setExistingProducts([...existingProducts, product]);

    // Add to ingredients
    setDishData(prev => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        {
          productId: product.id,
          productName: product.name,
          quantity: currentIngredient.quantity,
          unit: product.unit,
        },
      ],
    }));

    // Reset current ingredient
    setCurrentIngredient({ productName: '', quantity: 0, unit: 'KG' });
    toast.success('Ingrédient créé et ajouté!');
  };

  const handleRemoveIngredient = (index: number) => {
    setDishData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const handleSaveDish = async () => {
    if (!dishData.name.trim()) {
      toast.error('Le nom du plat est requis');
      return;
    }

    if (dishData.ingredients.length === 0) {
      toast.error('Ajoutez au moins un ingrédient');
      return;
    }

    setSaving(true);
    try {
      // Create ingredients/products
      const ingredientData = await Promise.all(
        dishData.ingredients.map(async (ing) => {
          const formData = new FormData();
          formData.append('name', ing.productName);
          formData.append('quantity', '0');
          formData.append('unit', ing.unit);
          formData.append('trackable', 'true');

          const { createProductWithoutRedirectAction } = await import('@/lib/actions/product.actions');
          const result = await createProductWithoutRedirectAction(formData);

          if (result.success && result.data) {
            return {
              productId: result.data.id,
              quantityRequired: parseFloat(ing.quantity),
              unit: ing.unit,
            };
          }
          throw new Error(result.error || 'Échec de création de l\'ingrédient');
        })
      );

      // Create the dish
      const { createDishAction } = await import('@/lib/actions/dish.actions');
      const dishResult = await createDishAction({
        name: dishData.name.trim(),
        description: dishData.description.trim() || undefined,
        sellingPrice: dishData.sellingPrice ? parseFloat(dishData.sellingPrice) : undefined,
        isActive: true,
        recipeIngredients: ingredientData,
      });

      if (dishResult.success) {
        setState('COMPLETE');
        celebrateWithConfetti();
        toast.success('Plat créé avec succès!');

        // Refresh and close after a delay
        setTimeout(() => {
          router.refresh();
          resetFlow();
          onOpenChange(false);
        }, 2000);
      } else {
        toast.error(dishResult.error || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Error creating dish:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  const resetFlow = () => {
    setState('START');
    setDishData({
      name: '',
      description: '',
      sellingPrice: '',
      ingredients: [],
    });
    setCurrentIngredient({ productName: '', quantity: '', unit: 'KG' });
    setScanFile(null);
    setScanning(false);
  };

  const handleBack = () => {
    if (state === 'INGREDIENTS') {
      setState('DISH_INFO');
    } else if (state === 'REVIEW') {
      setState('INGREDIENTS');
    } else if (state === 'DISH_INFO') {
      setState('START');
    }
  };

  const handleClose = () => {
    if (state !== 'START' && state !== 'COMPLETE' && dishData.name) {
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
            <ChefHat className="h-20 w-20 mx-auto text-primary" />
            <h2 className="text-3xl font-bold">Créer un nouveau plat</h2>
            <p className="text-muted-foreground max-w-md">
              Créez rapidement un plat en scannant une recette ou en saisissant les informations manuellement.
            </p>
          </div>

          <div className="w-full max-w-md space-y-3">
            {/* Scan option */}
            <label htmlFor="scan-file" className="block cursor-pointer">
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
                id="scan-file"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
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
                    Entrez les informations du plat manuellement
                  </p>
                </div>
              </div>
            </Button>
          </div>
        </div>
      );
    }

    // SCANNING state
    if (state === 'SCANNING') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 p-6">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Scan en cours...</h2>
            <p className="text-muted-foreground">
              Analyse de votre recette avec l'IA
            </p>
          </div>
        </div>
      );
    }

    // DISH_INFO state
    if (state === 'DISH_INFO') {
      return (
        <div className="flex flex-col h-full">
          {/* Progress */}
          <div className="p-4 border-b bg-muted/30">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                1
              </div>
              <span className="font-medium">Informations du plat</span>
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
                <ChefHat className="h-16 w-16 mx-auto text-primary" />
                <h2 className="text-2xl font-bold">Informations du plat</h2>
                <p className="text-muted-foreground">Commencez par entrer le nom et les détails</p>
              </div>

              {/* Dish Name */}
              <div className="space-y-3">
                <label className="text-lg font-semibold block">
                  Nom du plat <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Ex: Poulet rôti aux herbes"
                  value={dishData.name}
                  onChange={(e) => setDishData({ ...dishData, name: e.target.value })}
                  className="text-2xl h-16 font-medium"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div className="space-y-3">
                <label className="text-lg font-semibold block">
                  Description <span className="text-muted-foreground text-sm">(Optionnel)</span>
                </label>
                <Input
                  type="text"
                  placeholder="Ex: Poulet juteux avec des herbes fraîches"
                  value={dishData.description}
                  onChange={(e) => setDishData({ ...dishData, description: e.target.value })}
                  className="text-lg h-14"
                />
              </div>

              {/* Selling Price */}
              <div className="space-y-3">
                <label className="text-lg font-semibold block">
                  Prix de vente (€) <span className="text-muted-foreground text-sm">(Optionnel)</span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 18.50"
                  value={dishData.sellingPrice}
                  onChange={(e) => setDishData({ ...dishData, sellingPrice: e.target.value })}
                  className="text-lg h-14"
                />
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
                disabled={!dishData.name.trim()}
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
              <Badge variant="secondary" className="ml-2">{dishData.ingredients.length}</Badge>
            </div>
          </div>

          {/* Current Ingredient Card - BIG */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto">
              <div className="text-center space-y-2 mb-6">
                <Package className="h-16 w-16 mx-auto text-primary" />
                <h2 className="text-2xl font-bold">
                  {dishData.ingredients.length === 0
                    ? "Premier ingrédient"
                    : dishData.ingredients.length === 1
                    ? "Deuxième ingrédient"
                    : dishData.ingredients.length === 2
                    ? "Troisième ingrédient"
                    : `${dishData.ingredients.length + 1}ème ingrédient`}
                </h2>
                <p className="text-muted-foreground">
                  {dishData.ingredients.length > 0 && (
                    <Badge variant="secondary" className="text-base px-4 py-1">
                      {dishData.ingredients.length} déjà ajouté{dishData.ingredients.length > 1 ? 's' : ''}
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
                    placeholder="Ex: Tomate, Poulet, Huile d'olive..."
                    disabled={saving}
                    className="text-xl h-16"
                    existingProducts={existingProducts}
                    onCreateNew={() => setShowIngredientCreator(true)}
                  />
                </div>

                {/* Quantity Input - Reusable component */}
                <QuantityInput
                  value={currentIngredient.quantity}
                  onChange={(value) => setCurrentIngredient({ ...currentIngredient, quantity: value })}
                  label="Quantité *"
                />

                {/* Unit Selector - Reusable component */}
                <UnitSelector
                  value={currentIngredient.unit}
                  onChange={(value) => setCurrentIngredient({ ...currentIngredient, unit: value })}
                  label="Unité *"
                  locked={!!existingProducts.find(
                    (p) => p.name.toLowerCase() === currentIngredient.productName.toLowerCase()
                  )}
                  lockMessage="Unité de l'inventaire"
                />

                {/* Add button */}
                <Button
                  type="button"
                  onClick={handleAddIngredientAndNext}
                  disabled={!currentIngredient.productName || currentIngredient.quantity <= 0 || !currentIngredient.unit}
                  className="w-full h-14 text-lg bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
                  size="lg"
                >
                  <Check className="w-6 h-6 mr-2" />
                  {dishData.ingredients.length === 0
                    ? "Ajouter et passer au suivant"
                    : "Ajouter un autre ingrédient"}
                </Button>
              </div>

              {/* Added ingredients list - compact */}
              {dishData.ingredients.length > 0 && (
                <div className="mt-6 space-y-2">
                  <h3 className="font-semibold text-sm text-muted-foreground">Ingrédients ajoutés:</h3>
                  {dishData.ingredients.map((ing, index) => (
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
                  disabled={dishData.ingredients.length === 0}
                  className="flex-2 bg-gradient-to-r from-primary to-secondary"
                  size="lg"
                >
                  <Check className="w-5 h-5 mr-2" />
                  {dishData.ingredients.length === 0
                    ? "Terminer (0 ingrédient)"
                    : `Terminer avec ${dishData.ingredients.length} ingrédient${dishData.ingredients.length > 1 ? 's' : ''}`}
                </Button>
              </div>
              {dishData.ingredients.length === 0 ? (
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

    // REVIEW state - Summary before saving
    if (state === 'REVIEW') {
      return (
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b bg-muted/30">
            <div className="text-center space-y-2">
              <Sparkles className="h-16 w-16 mx-auto text-primary" />
              <h2 className="text-2xl font-bold">Vérifier et créer</h2>
              <p className="text-muted-foreground">Vérifiez les informations avant de créer le plat</p>
            </div>
          </div>

          {/* Summary */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Dish info card */}
              <div className="p-6 rounded-lg border-2 bg-card">
                <h3 className="font-semibold text-lg mb-4">Plat</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-muted-foreground">Nom</div>
                    <div className="text-xl font-semibold">{dishData.name}</div>
                  </div>
                  {dishData.description && (
                    <div>
                      <div className="text-sm text-muted-foreground">Description</div>
                      <div>{dishData.description}</div>
                    </div>
                  )}
                  {dishData.sellingPrice && (
                    <div>
                      <div className="text-sm text-muted-foreground">Prix</div>
                      <div className="text-lg font-semibold">€{parseFloat(dishData.sellingPrice).toFixed(2)}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Ingredients card */}
              <div className="p-6 rounded-lg border-2 bg-card">
                <h3 className="font-semibold text-lg mb-4">
                  Ingrédients ({dishData.ingredients.length})
                </h3>
                <div className="space-y-2">
                  {dishData.ingredients.map((ing, index) => (
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
                onClick={handleSaveDish}
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
                    Créer le plat
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
            <h2 className="text-3xl font-bold">Plat créé!</h2>
            <p className="text-muted-foreground max-w-md">
              <strong>{dishData.name}</strong> a été ajouté à votre menu avec {dishData.ingredients.length} ingrédient(s).
            </p>
          </div>

          <div className="w-full max-w-md p-6 rounded-lg border bg-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Plat</span>
              <span className="font-semibold">{dishData.name}</span>
            </div>
            {dishData.sellingPrice && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Prix</span>
                <span className="font-semibold">€{parseFloat(dishData.sellingPrice).toFixed(2)}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Ingrédients</span>
              <span className="font-semibold">{dishData.ingredients.length}</span>
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
          if (state !== 'START' && state !== 'COMPLETE' && dishData.name) {
            e.preventDefault();
          }
        }}
      >
        <VisuallyHidden>
          <DialogTitle>Créer un nouveau plat</DialogTitle>
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

      {/* Inline Ingredient Creator Dialog */}
      <InlineIngredientCreator
        open={showIngredientCreator}
        onOpenChange={setShowIngredientCreator}
        initialName={currentIngredient.productName}
        initialQuantity={currentIngredient.quantity.toString()}
        initialUnit={currentIngredient.unit}
        onSuccess={handleIngredientCreated}
      />
    </Dialog>
  );
}
