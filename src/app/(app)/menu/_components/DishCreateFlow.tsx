'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PageHeader } from '@/components/PageHeader';
import { useLanguage } from '@/providers/LanguageProvider';
import { ChefHat, ArrowLeft, CheckCircle2, AlertCircle, Plus, Trash2, Package, Info } from 'lucide-react';
import { toast } from 'sonner';
import { IngredientAutocomplete } from '@/components/ui/ingredient-autocomplete';
import { InlineIngredientCreator } from './InlineIngredientCreator';
import { QuantityInput } from '@/components/ui/quantity-input';
import { UnitSelector } from '@/components/ui/unit-selector';

/**
 * Dish Create Flow - Full screen, user-friendly dish creation
 * Step-by-step process with clear guidance and validation feedback
 */

type FormData = {
  name: string;
  description: string;
  sellingPrice: string;
  isActive: boolean;
};

type Product = {
  id: string;
  name: string;
  unit: string;
  unitPrice?: number | null;
};

type Ingredient = {
  productId?: string; // Set if using existing product
  productName: string;
  quantity: number;
  unit: string;
};

type FormErrors = {
  name?: string;
  sellingPrice?: string;
};

export function DishCreateFlow() {
  const router = useRouter();
  const { t } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    sellingPrice: '',
    isActive: true,
  });
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [currentIngredient, setCurrentIngredient] = useState<Ingredient>({
    productName: '',
    quantity: 0,
    unit: 'KG',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [showIngredientCreator, setShowIngredientCreator] = useState(false);

  // Load existing products on mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { getProductsAction } = await import('@/lib/actions/product.actions');
      const result = await getProductsAction();
      if (result.success && result.data) {
        setProducts(result.data);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const validateField = (name: keyof FormData, value: any): string | undefined => {
    if (name === 'name') {
      if (!value || value.trim().length === 0) {
        return t('menu.dishWizard.name') + ' is required';
      }
      if (value.trim().length < 2) {
        return 'Name must be at least 2 characters';
      }
    }
    if (name === 'sellingPrice' && value) {
      const price = parseFloat(value);
      if (isNaN(price) || price < 0) {
        return 'Price must be a valid positive number';
      }
    }
    return undefined;
  };

  const handleFieldChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (touched[field]) {
      const error = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const handleFieldBlur = (field: keyof FormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field]);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleAddIngredient = () => {
    if (!currentIngredient.productName || currentIngredient.quantity <= 0) {
      toast.error('Please enter ingredient name and quantity');
      return;
    }

    // Check if product exists
    const existingProduct = products.find(
      (p) => p.name.toLowerCase() === currentIngredient.productName.toLowerCase()
    );

    if (existingProduct) {
      // Use existing product
      setIngredients([
        ...ingredients,
        {
          productId: existingProduct.id,
          productName: existingProduct.name,
          quantity: currentIngredient.quantity,
          unit: existingProduct.unit,
        },
      ]);
      setCurrentIngredient({ productName: '', quantity: 0, unit: 'KG' });
    } else {
      // Show creator for new ingredient
      setShowIngredientCreator(true);
    }
  };

  const handleIngredientCreated = (product: Product) => {
    // Add to products list
    setProducts([...products, product]);

    // Add to ingredients
    setIngredients([
      ...ingredients,
      {
        productId: product.id,
        productName: product.name,
        quantity: currentIngredient.quantity,
        unit: product.unit,
      },
    ]);

    // Reset current ingredient
    setCurrentIngredient({ productName: '', quantity: 0, unit: 'KG' });
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    const nameError = validateField('name', formData.name);
    if (nameError) {
      newErrors.name = nameError;
      isValid = false;
    }

    const priceError = validateField('sellingPrice', formData.sellingPrice);
    if (priceError) {
      newErrors.sellingPrice = priceError;
      isValid = false;
    }

    setErrors(newErrors);
    setTouched({ name: true, sellingPrice: true });
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors before continuing');
      return;
    }

    if (ingredients.length === 0) {
      toast.error('Please add at least one ingredient');
      return;
    }

    // Validate all ingredients have productId (should be set by now)
    const missingProduct = ingredients.find((ing) => !ing.productId);
    if (missingProduct) {
      toast.error(`Ingredient "${missingProduct.productName}" is not properly configured`);
      return;
    }

    setSaving(true);
    try {
      // Map ingredients to the format expected by the API
      const ingredientData = ingredients.map((ing) => ({
        productId: ing.productId!,
        quantityRequired: ing.quantity,
        unit: ing.unit,
      }));

      // Create the dish
      const { createDishAction } = await import('@/lib/actions/dish.actions');
      const dishResult = await createDishAction({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        sellingPrice: formData.sellingPrice ? parseFloat(formData.sellingPrice) : undefined,
        isActive: formData.isActive,
        recipeIngredients: ingredientData,
      });

      if (dishResult.success) {
        toast.success(t('menu.update.success'));
        router.push('/menu');
      } else {
        toast.error(dishResult.error || t('menu.update.error'));
      }
    } catch (error) {
      console.error('Error creating dish:', error);
      toast.error(error instanceof Error ? error.message : t('menu.update.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/menu');
  };

  const isFormValid = !errors.name && !errors.sellingPrice && formData.name.trim().length > 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <PageHeader
        title={t('menu.dishWizard.title')}
        subtitle={t('menu.create.subtitle').replace('menu', 'plat')}
        icon={ChefHat}
      />

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Info Card */}
          <Card>
            <CardContent className="p-8">
              <h3 className="mb-6 text-lg font-semibold">{t('menu.dishWizard.basicInfo')}</h3>
              <div className="space-y-6">
                {/* Dish Name */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="name" className="text-base font-semibold">
                      {t('menu.dishWizard.name')} <span className="text-destructive">*</span>
                    </Label>
                    {touched.name && !errors.name && formData.name && (
                      <CheckCircle2 className="text-success h-5 w-5" />
                    )}
                  </div>
                  <Input
                    id="name"
                    type="text"
                    placeholder={t('menu.dishWizard.namePlaceholder')}
                    value={formData.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    onBlur={() => handleFieldBlur('name')}
                    className={`cursor-text text-base ${
                      errors.name && touched.name
                        ? 'border-destructive focus-visible:ring-destructive'
                        : touched.name && formData.name
                          ? 'border-success focus-visible:ring-success'
                          : ''
                    }`}
                    disabled={saving}
                  />
                  {errors.name && touched.name && (
                    <div className="text-destructive flex items-start gap-2 text-sm">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{errors.name}</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-3">
                  <Label htmlFor="description" className="text-base font-semibold">
                    {t('menu.dishWizard.description')}{' '}
                    <span className="text-muted-foreground text-sm">
                      ({t('menu.create.optional')})
                    </span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder={t('menu.dishWizard.descriptionPlaceholder')}
                    value={formData.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    rows={3}
                    className="cursor-text resize-none text-base"
                    disabled={saving}
                  />
                </div>

                {/* Selling Price */}
                <div className="space-y-3">
                  <Label htmlFor="sellingPrice" className="text-base font-semibold">
                    {t('menu.dishWizard.sellingPrice')}{' '}
                    <span className="text-muted-foreground text-sm">
                      ({t('menu.create.optional')})
                    </span>
                  </Label>
                  <Input
                    id="sellingPrice"
                    type="number"
                    step="0.01"
                    placeholder={t('menu.dishWizard.sellingPricePlaceholder')}
                    value={formData.sellingPrice}
                    onChange={(e) => handleFieldChange('sellingPrice', e.target.value)}
                    onBlur={() => handleFieldBlur('sellingPrice')}
                    className={`cursor-text text-base ${
                      errors.sellingPrice && touched.sellingPrice
                        ? 'border-destructive focus-visible:ring-destructive'
                        : ''
                    }`}
                    disabled={saving}
                  />
                  {errors.sellingPrice && touched.sellingPrice ? (
                    <div className="text-destructive flex items-start gap-2 text-sm">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{errors.sellingPrice}</span>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      {t('menu.dishWizard.sellingPriceOptional')}
                    </p>
                  )}
                </div>

                {/* Active Status */}
                <div className="space-y-3">
                  <Label htmlFor="isActive" className="text-base font-semibold">
                    {t('menu.create.statusTitle')}
                  </Label>
                  <div className="bg-muted/30 flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <div className="font-medium">Active</div>
                      <p className="text-muted-foreground text-sm">Dish is available for sale</p>
                    </div>
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => handleFieldChange('isActive', checked)}
                      disabled={saving}
                      className="cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ingredients Card */}
          <Card>
            <CardContent className="p-8">
              <h3 className="mb-6 text-lg font-semibold">
                {t('menu.dishWizard.ingredients')} <span className="text-destructive">*</span>
              </h3>

              {/* Add Ingredient Form */}
              <div className="bg-muted/30 mb-6 space-y-4 rounded-lg border p-4">
                <div className="space-y-3">
                  <Label htmlFor="ingredientName" className="text-sm font-medium">
                    Nom de l'ingrédient
                  </Label>
                  <IngredientAutocomplete
                    value={currentIngredient.productName}
                    onChange={(value) => {
                      setCurrentIngredient({ ...currentIngredient, productName: value });
                      // Auto-fill unit if existing product
                      const existingProduct = products.find(
                        (p) => p.name.toLowerCase() === value.toLowerCase()
                      );
                      if (existingProduct) {
                        setCurrentIngredient({
                          ...currentIngredient,
                          productName: value,
                          unit: existingProduct.unit,
                        });
                      }
                    }}
                    placeholder="Tapez pour rechercher... (ex: Tomate, Oignon, Poulet)"
                    existingProducts={products}
                    disabled={saving}
                    onCreateNew={() => setShowIngredientCreator(true)}
                  />
                  {currentIngredient.productName && (
                    <div className="mt-2">
                      {products.find(
                        (p) => p.name.toLowerCase() === currentIngredient.productName.toLowerCase()
                      ) ? (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle2 className="w-4 h-4" />
                          Ingrédient existant
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-blue-600">
                          <Info className="w-4 h-4" />
                          Nouvel ingrédient - sera créé avec prix unitaire
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Quantity Input - Reusable component */}
                <QuantityInput
                  value={currentIngredient.quantity}
                  onChange={(value) => setCurrentIngredient({ ...currentIngredient, quantity: value })}
                  label={t('menu.dishWizard.quantity')}
                  disabled={saving}
                />

                {/* Unit Selector - Reusable component */}
                <UnitSelector
                  value={currentIngredient.unit}
                  onChange={(value) => setCurrentIngredient({ ...currentIngredient, unit: value })}
                  label={t('menu.dishWizard.unit')}
                  disabled={saving}
                  locked={!!products.find(
                    (p) => p.name.toLowerCase() === currentIngredient.productName.toLowerCase()
                  )}
                  lockMessage="Unité de l'inventaire"
                />

                <Button
                  type="button"
                  onClick={handleAddIngredient}
                  variant="outline"
                  className="w-full cursor-pointer"
                  disabled={!currentIngredient.productName || !currentIngredient.quantity}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t('menu.dishWizard.addIngredient')}
                </Button>
              </div>

              {/* Ingredients List */}
              {ingredients.length === 0 ? (
                <div className="text-muted-foreground py-8 text-center">
                  <p>{t('menu.dishWizard.noIngredients')}</p>
                  <p className="mt-1 text-sm">Add at least one ingredient to continue</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {ingredients.map((ing, index) => (
                    <div
                      key={index}
                      className="bg-card flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{ing.productName}</div>
                        <div className="text-muted-foreground text-sm">
                          {ing.quantity} {ing.unit}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveIngredient(index)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="mt-8 flex items-center justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={saving}
            className="hover:bg-destructive hover:text-destructive-foreground hover:border-destructive cursor-pointer gap-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('menu.menuForm.cancel')}
          </Button>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    type="submit"
                    disabled={!isFormValid || ingredients.length === 0 || saving}
                    className="from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 cursor-pointer gap-2 bg-gradient-to-br disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        {t('menu.dishWizard.creating')}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        {t('menu.dishWizard.create')}
                      </>
                    )}
                  </Button>
                </span>
              </TooltipTrigger>
              {(!isFormValid || ingredients.length === 0) && !saving && (
                <TooltipContent>
                  <p>
                    {!isFormValid
                      ? t('dish.create.disabledTooltip')
                      : 'Please add at least one ingredient'}
                  </p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </form>

      {/* Inline Ingredient Creator Dialog */}
      <InlineIngredientCreator
        open={showIngredientCreator}
        onOpenChange={setShowIngredientCreator}
        initialName={currentIngredient.productName}
        initialQuantity={currentIngredient.quantity.toString()}
        initialUnit={currentIngredient.unit}
        onSuccess={handleIngredientCreated}
      />
    </div>
  );
}
