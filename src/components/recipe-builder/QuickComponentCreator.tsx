"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ComponentIngredient = {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
};

type QuickComponentCreatorProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (component: any) => void;
};

export function QuickComponentCreator({
  open,
  onClose,
  onCreate,
}: QuickComponentCreatorProps) {
  const [componentName, setComponentName] = useState("");
  const [ingredients, setIngredients] = useState<ComponentIngredient[]>([]);
  const [yields, setYields] = useState<number>(1);
  const [yieldsUnit, setYieldsUnit] = useState("L");
  const [saveToLibrary, setSaveToLibrary] = useState(true);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<any[]>([]);

  // Load products when search opens
  const handleOpenProductSearch = async () => {
    setShowProductSearch(true);
    if (products.length === 0) {
      try {
        const response = await fetch("/api/products");
        if (response.ok) {
          const data = await response.json();
          setProducts(data.filter((p: any) => !p.isComposite));
        }
      } catch (error) {
        console.error("Error loading products:", error);
      }
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addIngredient = (product: any) => {
    setIngredients([
      ...ingredients,
      {
        id: `ing-${Date.now()}`,
        productId: product.id,
        name: product.name,
        quantity: 1,
        unit: product.unit,
        unitPrice: product.unitPrice || 0,
      },
    ]);
    setSearchQuery("");
    setShowProductSearch(false);
  };

  const updateIngredient = (id: string, updates: Partial<ComponentIngredient>) => {
    setIngredients(
      ingredients.map((ing) => (ing.id === id ? { ...ing, ...updates } : ing))
    );
  };

  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter((ing) => ing.id !== id));
  };

  const totalCost = ingredients.reduce((sum, ing) => {
    return sum + ing.unitPrice * ing.quantity;
  }, 0);

  const unitCost = yields > 0 ? totalCost / yields : 0;

  const handleCreate = () => {
    const component = {
      name: componentName,
      ingredients,
      yields,
      yieldsUnit,
      unitPrice: unitCost,
      quantity: yields,
      unit: yieldsUnit,
      saveToLibrary,
    };
    onCreate(component);

    // Reset form
    setComponentName("");
    setIngredients([]);
    setYields(1);
    setYieldsUnit("L");
    setSaveToLibrary(true);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Quick Create Component
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {/* Component Name */}
          <div>
            <label className="text-sm font-medium mb-2 block">Component Name</label>
            <Input
              autoFocus
              placeholder="e.g., Fond de veau maison"
              value={componentName}
              onChange={(e) => setComponentName(e.target.value)}
            />
          </div>

          {/* Ingredients */}
          <div>
            <label className="text-sm font-medium mb-2 block">Ingredients for this component</label>
            <div className="space-y-2">
              {ingredients.map((ingredient) => (
                <div
                  key={ingredient.id}
                  className="flex items-center gap-2 p-2 rounded-lg border bg-background"
                >
                  <div className="flex-1 font-medium text-sm">{ingredient.name}</div>
                  <Input
                    type="number"
                    step="0.01"
                    value={ingredient.quantity}
                    onChange={(e) =>
                      updateIngredient(ingredient.id, {
                        quantity: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-24 h-8"
                  />
                  <span className="text-sm text-muted-foreground w-12">{ingredient.unit}</span>
                  <div className="text-sm text-muted-foreground w-20 text-right">
                    €{(ingredient.quantity * ingredient.unitPrice).toFixed(2)}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeIngredient(ingredient.id)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {/* Add Ingredient Button */}
              {!showProductSearch ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenProductSearch}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add ingredient
                </Button>
              ) : (
                <div className="border rounded-lg p-2 space-y-2">
                  <Input
                    autoFocus
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {filteredProducts.slice(0, 10).map((product) => (
                      <button
                        key={product.id}
                        onClick={() => addIngredient(product)}
                        className="w-full text-left px-3 py-2 rounded hover:bg-accent text-sm"
                      >
                        {product.name} ({product.unit})
                      </button>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowProductSearch(false);
                      setSearchQuery("");
                    }}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Yields */}
          <div>
            <label className="text-sm font-medium mb-2 block">Yields</label>
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={yields}
                onChange={(e) => setYields(parseFloat(e.target.value) || 1)}
                className="w-24"
              />
              <Input
                value={yieldsUnit}
                onChange={(e) => setYieldsUnit(e.target.value)}
                placeholder="unit"
                className="w-24"
              />
              <div className="flex items-center text-sm text-muted-foreground">
                = €{unitCost.toFixed(2)}/{yieldsUnit}
              </div>
            </div>
          </div>

          {/* Cost Summary */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Cost:</span>
              <span className="font-medium">€{totalCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Unit Cost:</span>
              <span className="font-medium">€{unitCost.toFixed(2)}/{yieldsUnit}</span>
            </div>
          </div>

          {/* Save to Library */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="saveToLibrary"
              checked={saveToLibrary}
              onCheckedChange={(checked) => setSaveToLibrary(checked as boolean)}
            />
            <label
              htmlFor="saveToLibrary"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Save to library for reuse in other recipes
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!componentName || ingredients.length === 0}
          >
            Add to Recipe
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
