"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChefHat, Plus, Layers, Trash2 } from "lucide-react";
import { MultiSelectIngredientSearch } from "./MultiSelectIngredientSearch";
import { SelectableIngredientPill } from "./SelectableIngredientPill";
import { GroupAsComponentDialog } from "./GroupAsComponentDialog";
import { RecipeSummary } from "./RecipeSummary";

type RecipeIngredient = {
  id: string;
  type: "raw" | "group";
  name: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  stockStatus?: "good" | "low" | "out";
  children?: RecipeIngredient[];
  isExpanded?: boolean;
  componentName?: string; // For groups
  saveToLibrary?: boolean; // For groups
};

type RecipeBuilderV2Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (recipe: any) => void;
};

export function RecipeBuilderV2({ open, onOpenChange, onSave }: RecipeBuilderV2Props) {
  const [recipeName, setRecipeName] = useState("");
  const [recipeDescription, setRecipeDescription] = useState("");
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showIngredientSearch, setShowIngredientSearch] = useState(false);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [sellingPrice, setSellingPrice] = useState<number | null>(null);
  const [yields, setYields] = useState<number>(1);
  const [yieldsUnit, setYieldsUnit] = useState("portion");

  // Calculate total cost recursively
  const calculateCost = (items: RecipeIngredient[]): number => {
    return items.reduce((sum, item) => {
      if (item.type === "group" && item.children) {
        return sum + calculateCost(item.children);
      }
      return sum + (item.unitPrice || 0) * item.quantity;
    }, 0);
  };

  const totalCost = calculateCost(ingredients);
  const suggestedPrice = totalCost * 3;

  // Check stock status
  const hasStockIssues = (items: RecipeIngredient[]): "good" | "low" | "out" => {
    let hasOut = false;
    let hasLow = false;

    const check = (items: RecipeIngredient[]) => {
      items.forEach((item) => {
        if (item.type === "group" && item.children) {
          check(item.children);
        } else {
          if (item.stockStatus === "out") hasOut = true;
          if (item.stockStatus === "low") hasLow = true;
        }
      });
    };

    check(items);
    return hasOut ? "out" : hasLow ? "low" : "good";
  };

  const stockStatus = hasStockIssues(ingredients);

  const handleAddMultipleIngredients = (products: any[]) => {
    const newIngredients: RecipeIngredient[] = products.map((product) => ({
      id: `ing-${Date.now()}-${Math.random()}`,
      type: "raw" as const,
      name: product.name,
      quantity: 1,
      unit: product.unit,
      unitPrice: product.unitPrice || 0,
      stockStatus: product.stockStatus || "good",
    }));
    setIngredients([...ingredients, ...newIngredients]);
    setShowIngredientSearch(false);
  };

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleUpdateIngredient = (id: string, updates: Partial<RecipeIngredient>) => {
    const updateRecursive = (items: RecipeIngredient[]): RecipeIngredient[] => {
      return items.map((item) => {
        if (item.id === id) {
          return { ...item, ...updates };
        }
        if (item.children) {
          return { ...item, children: updateRecursive(item.children) };
        }
        return item;
      });
    };
    setIngredients(updateRecursive(ingredients));
  };

  const handleRemoveIngredient = (id: string) => {
    const removeRecursive = (items: RecipeIngredient[]): RecipeIngredient[] => {
      return items.filter((item) => {
        if (item.id === id) return false;
        if (item.children) {
          item.children = removeRecursive(item.children);
        }
        return true;
      });
    };
    setIngredients(removeRecursive(ingredients));
    selectedIds.delete(id);
    setSelectedIds(new Set(selectedIds));
  };

  const getSelectedIngredients = (): RecipeIngredient[] => {
    const selected: RecipeIngredient[] = [];
    const findSelected = (items: RecipeIngredient[]) => {
      items.forEach((item) => {
        if (selectedIds.has(item.id)) {
          selected.push(item);
        }
        if (item.children) {
          findSelected(item.children);
        }
      });
    };
    findSelected(ingredients);
    return selected;
  };

  const handleGroupAsComponent = (componentName: string, saveToLibrary: boolean) => {
    const selected = getSelectedIngredients();
    if (selected.length < 2) return;

    // Create the group
    const groupId = `group-${Date.now()}`;
    const newGroup: RecipeIngredient = {
      id: groupId,
      type: "group",
      name: componentName,
      componentName,
      quantity: 1,
      unit: "portion",
      children: selected,
      isExpanded: true,
      saveToLibrary,
    };

    // Remove selected ingredients from main list and add group
    const filtered = ingredients.filter((item) => !selectedIds.has(item.id));
    setIngredients([...filtered, newGroup]);
    setSelectedIds(new Set());
    setShowGroupDialog(false);

    // TODO: If saveToLibrary, save to database
  };

  const handleDeleteSelected = () => {
    const filtered = ingredients.filter((item) => !selectedIds.has(item.id));
    setIngredients(filtered);
    setSelectedIds(new Set());
  };

  const handleSave = () => {
    const recipe = {
      name: recipeName,
      description: recipeDescription,
      ingredients,
      sellingPrice: sellingPrice || suggestedPrice,
      yields,
      yieldsUnit,
      totalCost,
    };
    onSave?.(recipe);

    // Reset
    setRecipeName("");
    setRecipeDescription("");
    setIngredients([]);
    setSelectedIds(new Set());
    setSellingPrice(null);
    setYields(1);
    setYieldsUnit("portion");

    onOpenChange(false);
  };

  const countIngredients = (items: RecipeIngredient[]): number => {
    return items.reduce((count, item) => {
      if (item.type === "group" && item.children) {
        return count + countIngredients(item.children);
      }
      return count + 1;
    }, 0);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5" />
              Create Recipe
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
            {/* Recipe Name */}
            <div>
              <Input
                placeholder="Recipe name (e.g., Côte de bœuf grillée)"
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
                className="text-lg font-medium"
              />
            </div>

            {/* Recipe Description */}
            <div>
              <Textarea
                placeholder="Brief description (optional)"
                value={recipeDescription}
                onChange={(e) => setRecipeDescription(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>

            {/* Ingredients Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Build your recipe
                </h3>
                <div className="flex items-center gap-2">
                  {selectedIds.size > 0 && (
                    <>
                      <span className="text-xs text-muted-foreground">
                        {selectedIds.size} selected
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowGroupDialog(true)}
                        disabled={selectedIds.size < 2}
                        className="h-8"
                      >
                        <Layers className="h-3 w-3 mr-2" />
                        Group as component
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDeleteSelected}
                        className="h-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Ingredient Pills */}
              <div className="space-y-2 min-h-[200px] border-2 border-dashed rounded-lg p-4">
                {ingredients.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Start by adding ingredients
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Add ingredients, then select and group them into components
                    </p>
                  </div>
                ) : (
                  ingredients.map((ingredient) => (
                    <SelectableIngredientPill
                      key={ingredient.id}
                      ingredient={ingredient}
                      isSelected={selectedIds.has(ingredient.id)}
                      onToggleSelect={() => handleToggleSelect(ingredient.id)}
                      onUpdate={(updates) => handleUpdateIngredient(ingredient.id, updates)}
                      onRemove={() => handleRemoveIngredient(ingredient.id)}
                      onToggleExpand={() =>
                        handleUpdateIngredient(ingredient.id, {
                          isExpanded: !ingredient.isExpanded,
                        })
                      }
                    />
                  ))
                )}

                {/* Add Ingredient Button */}
                <Button
                  variant="outline"
                  className="w-full justify-start text-muted-foreground hover:text-foreground border-dashed"
                  onClick={() => setShowIngredientSearch(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add ingredient
                </Button>
              </div>
            </div>

            {/* Yields & Price */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Yields</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="1"
                    value={yields}
                    onChange={(e) => setYields(parseInt(e.target.value) || 1)}
                    className="w-24"
                  />
                  <Input
                    value={yieldsUnit}
                    onChange={(e) => setYieldsUnit(e.target.value)}
                    placeholder="unit"
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Selling Price (€)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={sellingPrice || ""}
                  onChange={(e) => setSellingPrice(parseFloat(e.target.value) || null)}
                  placeholder={suggestedPrice.toFixed(2)}
                />
              </div>
            </div>

            {/* Recipe Summary */}
            <RecipeSummary
              totalCost={totalCost}
              sellingPrice={sellingPrice || suggestedPrice}
              stockStatus={stockStatus}
              ingredientCount={countIngredients(ingredients)}
            />
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!recipeName || ingredients.length === 0}>
              Save Recipe
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Multi-Select Ingredient Search */}
      <MultiSelectIngredientSearch
        open={showIngredientSearch}
        onClose={() => setShowIngredientSearch(false)}
        onAddMultiple={handleAddMultipleIngredients}
      />

      {/* Group as Component Dialog */}
      <GroupAsComponentDialog
        open={showGroupDialog}
        onClose={() => setShowGroupDialog(false)}
        selectedCount={selectedIds.size}
        onGroup={handleGroupAsComponent}
      />
    </>
  );
}
