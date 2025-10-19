'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, Check, Info, Beaker, Package, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { CompositeProductWizard } from '../../inventory/_components/CompositeProductWizard';
import { Badge } from '@/components/ui/badge';
import { SUPPORTED_UNITS, UNIT_LABELS } from '@/lib/constants/units';
import { IngredientAutocomplete } from '@/components/ui/ingredient-autocomplete';

/**
 * Ingredient Editor
 * Allows adding ingredients to a scanned dish
 */

type Product = {
  id: string;
  name: string;
  unit: string;
  unitPrice?: number | null;
  isComposite?: boolean;
};

type Ingredient = {
  productId?: string; // undefined means creating new
  productName: string;
  quantityRequired: number;
  unit: string;
  unitPrice?: number; // For new products
};

type IngredientEditorProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dishName: string;
  initialIngredients?: Ingredient[];
  onSave: (ingredients: Ingredient[]) => void;
};

export function IngredientEditor({
  open,
  onOpenChange,
  dishName,
  initialIngredients = [],
  onSave,
}: IngredientEditorProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients);

  // Current ingredient being added
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('KG');
  const [unitPrice, setUnitPrice] = useState('');

  // New ingredient creation
  const [showProductTypeChoice, setShowProductTypeChoice] = useState(false);
  const [showCompositeWizard, setShowCompositeWizard] = useState(false);
  const [pendingIngredientName, setPendingIngredientName] = useState('');
  const [pendingIngredientQuantity, setPendingIngredientQuantity] = useState('');
  const [pendingIngredientUnit, setPendingIngredientUnit] = useState('KG');
  const [pendingIngredientUnitPrice, setPendingIngredientUnitPrice] = useState('');

  // Editing existing ingredients
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      loadProducts();
      setIngredients(initialIngredients);
      setEditingIndex(null); // Reset editing state when dialog opens
    }
  }, [open, initialIngredients]);

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

  const handleAddIngredient = () => {
    if (!searchQuery || !quantity) return;

    const selectedProduct = products.find((p) => p.id === selectedProductId);

    // If product exists, add it directly
    if (selectedProduct) {
      setIngredients([
        ...ingredients,
        {
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          quantityRequired: parseFloat(quantity),
          unit: selectedProduct.unit,
        },
      ]);

      // Reset ingredient form
      setSearchQuery('');
      setSelectedProductId('');
      setQuantity('');
      setUnit('KG');
      setUnitPrice('');
    } else {
      // Product doesn't exist - require unit price
      if (!unitPrice) {
        toast.error('Please enter unit price for new ingredient');
        return;
      }
      // Show choice dialog
      setPendingIngredientName(searchQuery);
      setPendingIngredientQuantity(quantity);
      setPendingIngredientUnit(unit);
      setPendingIngredientUnitPrice(unitPrice);
      setShowProductTypeChoice(true);
    }
  };

  const handleCreateAsBase = () => {
    // Add as new base product (inline creation)
    setIngredients([
      ...ingredients,
      {
        productId: undefined,
        productName: pendingIngredientName,
        quantityRequired: parseFloat(pendingIngredientQuantity),
        unit: pendingIngredientUnit,
        unitPrice: parseFloat(pendingIngredientUnitPrice),
      },
    ]);

    // Reset
    setShowProductTypeChoice(false);
    setSearchQuery('');
    setSelectedProductId('');
    setQuantity('');
    setUnit('KG');
    setUnitPrice('');
    setPendingIngredientName('');
    setPendingIngredientQuantity('');
    setPendingIngredientUnit('KG');
    setPendingIngredientUnitPrice('');
  };

  const handleCreateAsComposite = () => {
    setShowProductTypeChoice(false);
    setShowCompositeWizard(true);
  };

  const handleCompositeCreated = async () => {
    // Reload products to get the newly created composite
    const { getProductsAction } = await import('@/lib/actions/product.actions');
    const result = await getProductsAction();

    if (result.success && result.data) {
      setProducts(result.data);

      // Find the composite product we just created and add it
      const newComposite = result.data.find(
        (p: Product) => p.name === pendingIngredientName && p.isComposite
      );
      if (newComposite) {
        setIngredients([
          ...ingredients,
          {
            productId: newComposite.id,
            productName: newComposite.name,
            quantityRequired: parseFloat(pendingIngredientQuantity),
            unit: newComposite.unit,
          },
        ]);
      }
    }

    // Reset
    setSearchQuery('');
    setSelectedProductId('');
    setQuantity('');
    setUnit('KG');
    setUnitPrice('');
    setPendingIngredientName('');
    setPendingIngredientQuantity('');
    setPendingIngredientUnit('KG');
    setPendingIngredientUnitPrice('');
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleUpdateIngredient = (index: number, field: 'quantityRequired' | 'unit', value: any) => {
    const updated = [...ingredients];
    if (field === 'quantityRequired') {
      updated[index] = { ...updated[index], quantityRequired: parseFloat(value) || 0 };
    } else {
      updated[index] = { ...updated[index], unit: value };
    }
    setIngredients(updated);
  };

  const handleSave = () => {
    onSave(ingredients);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Ingredients to {dishName}</DialogTitle>
            <DialogDescription>
              Search for products or create new ones to add as ingredients
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Ingredients */}
            <div className="space-y-4">
              <Label>Ingredients</Label>

              {/* Add Ingredient Form */}
              <div className="border rounded-lg p-4 space-y-3">
                <div>
                  <Label htmlFor="search">Search Ingredient</Label>
                  <IngredientAutocomplete
                    value={searchQuery}
                    onChange={(value) => {
                      setSearchQuery(value);
                      // Auto-select if exact match
                      const match = products.find(
                        (p) => p.name.toLowerCase() === value.toLowerCase()
                      );
                      if (match) {
                        setSelectedProductId(match.id);
                        setUnit(match.unit);
                        setUnitPrice(''); // Reset unit price when selecting existing product
                      } else {
                        setSelectedProductId('');
                      }
                    }}
                    placeholder="Type to search... (e.g., Tomato, Onion, Chicken)"
                    existingProducts={products}
                  />

                  {searchQuery && (
                    <div className="mt-2">
                      {selectedProductId ? (
                        <>
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <Check className="w-4 h-4" />
                            Existing product selected
                          </div>
                          {products.find((p) => p.id === selectedProductId)?.isComposite && (
                            <Badge variant="outline" className="mt-1 text-xs bg-purple-50 text-purple-700 border-purple-200">
                              <Beaker className="w-3 h-3 mr-1" />
                              Composite
                            </Badge>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-blue-600">
                          <Info className="w-4 h-4" />
                          Will create new: &quot;{searchQuery}&quot;
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="0.01"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit">Unit</Label>
                    <Select value={unit} onValueChange={setUnit} disabled={!!selectedProductId}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORTED_UNITS.map((u) => (
                          <SelectItem key={u} value={u}>
                            {u} - {UNIT_LABELS[u]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Unit Price - Only for new products */}
                {!selectedProductId && searchQuery && (
                  <div>
                    <Label htmlFor="unitPrice">
                      Unit Price (€) <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">€</span>
                      <Input
                        id="unitPrice"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={unitPrice}
                        onChange={(e) => setUnitPrice(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Price per {unit} for this new ingredient
                    </p>
                  </div>
                )}

                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddIngredient}
                  disabled={!searchQuery || !quantity}
                >
                  Add Ingredient
                </Button>
              </div>

              {/* Ingredients List */}
              {ingredients.length === 0 ? (
                <p className="text-center py-4 text-gray-500">
                  No ingredients added yet
                </p>
              ) : (
                <div className="space-y-2">
                  {ingredients.map((ing, index) => {
                    const product = products.find((p) => p.id === ing.productId);
                    const isEditing = editingIndex === index;

                    return (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="font-medium">{ing.productName}</div>
                            {product?.isComposite && (
                              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                <Beaker className="w-3 h-3 mr-1" />
                                Composite
                              </Badge>
                            )}
                            {!ing.productId && (
                              <span className="text-blue-600 text-xs">(New)</span>
                            )}
                            {ing.unitPrice && (
                              <span className="text-gray-500 text-xs">
                                @ €{ing.unitPrice.toFixed(2)}/{ing.unit}
                              </span>
                            )}
                          </div>

                          {isEditing ? (
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={ing.quantityRequired}
                                  onChange={(e) => handleUpdateIngredient(index, 'quantityRequired', e.target.value)}
                                  className="h-8 text-sm"
                                  placeholder="Quantity"
                                />
                              </div>
                              <div>
                                <Select
                                  value={ing.unit}
                                  onValueChange={(value) => handleUpdateIngredient(index, 'unit', value)}
                                  disabled={!!product} // Can't change unit if it's an existing product
                                >
                                  <SelectTrigger className="h-8 text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {SUPPORTED_UNITS.map((u) => (
                                      <SelectItem key={u} value={u}>
                                        {u}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-600">
                              {ing.quantityRequired} {ing.unit}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          {isEditing ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingIndex(null)}
                              className="h-8 px-2 text-xs"
                            >
                              Done
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingIndex(index)}
                              className="h-8 px-2 text-xs"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveIngredient(index)}
                            className="h-8 px-2"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSave}>
                Save Ingredients
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Type Choice Dialog */}
      <Dialog open={showProductTypeChoice} onOpenChange={setShowProductTypeChoice}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Choose Product Type</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              &quot;{pendingIngredientName}&quot; doesn&apos;t exist. How would you like to create it?
            </p>

            <div className="space-y-3">
              <Button
                onClick={handleCreateAsBase}
                variant="outline"
                className="w-full h-auto p-4 text-left"
              >
                <div className="flex items-start gap-3 w-full">
                  <Package className="w-5 h-5 mt-0.5 flex-shrink-0 text-blue-600" />
                  <div className="flex-1">
                    <div className="font-semibold">Base Product</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Simple ingredient purchased from supplier
                    </div>
                  </div>
                </div>
              </Button>

              <Button
                onClick={handleCreateAsComposite}
                variant="outline"
                className="w-full h-auto p-4 text-left"
              >
                <div className="flex items-start gap-3 w-full">
                  <Beaker className="w-5 h-5 mt-0.5 flex-shrink-0 text-purple-600" />
                  <div className="flex-1">
                    <div className="font-semibold">Composite Product</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Product made from multiple ingredients
                    </div>
                  </div>
                </div>
              </Button>
            </div>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setShowProductTypeChoice(false)}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Composite Product Wizard */}
      <CompositeProductWizard
        open={showCompositeWizard}
        onOpenChange={setShowCompositeWizard}
        onSuccess={handleCompositeCreated}
      />
    </>
  );
}
