"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SmartIngredientPicker } from "./SmartIngredientPicker";
import { IngredientPill } from "./IngredientPill";
import { QuickComponentCreator } from "./QuickComponentCreator";
import { RecipeSummary } from "./RecipeSummary";
import { RecipeCategorySelect } from "@/components/cookbook/RecipeCategorySelect";
import { ChefHat, Plus } from "lucide-react";

type IngredientItem = {
  id: string;
  type: "product" | "component";
  name: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  stockStatus?: "good" | "low" | "out";
  isComponent?: boolean;
};

type RecipeBuilderProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (recipe: any) => void;
};

export function RecipeBuilder({ open, onOpenChange, onSave }: RecipeBuilderProps) {
  const [recipeName, setRecipeName] = useState("");
  const [recipeDescription, setRecipeDescription] = useState("");
  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  const [showIngredientPicker, setShowIngredientPicker] = useState(false);
  const [showComponentCreator, setShowComponentCreator] = useState(false);
  const [sellingPrice, setSellingPrice] = useState<number | null>(null);
  const [yields, setYields] = useState<number>(1);
  const [yieldsUnit, setYieldsUnit] = useState("portion");
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);

  // Calculate total cost
  const totalCost = ingredients.reduce((sum, ing) => {
    return sum + (ing.unitPrice || 0) * ing.quantity;
  }, 0);

  // Suggested price (3x markup)
  const suggestedPrice = totalCost * 3;

  // Check if all ingredients are in stock
  const stockStatus = ingredients.some((ing) => ing.stockStatus === "out")
    ? "out"
    : ingredients.some((ing) => ing.stockStatus === "low")
    ? "low"
    : "good";

  const handleAddIngredient = (ingredient: IngredientItem) => {
    setIngredients([...ingredients, ingredient]);
    setShowIngredientPicker(false);
  };

  const handleUpdateIngredient = (id: string, updates: Partial<IngredientItem>) => {
    setIngredients(
      ingredients.map((ing) => (ing.id === id ? { ...ing, ...updates } : ing))
    );
  };

  const handleRemoveIngredient = (id: string) => {
    setIngredients(ingredients.filter((ing) => ing.id !== id));
  };

  const handleCreateComponent = (component: any) => {
    // Add the created component as an ingredient
    handleAddIngredient({
      id: `component-${Date.now()}`,
      type: "component",
      name: component.name,
      quantity: component.quantity || 1,
      unit: component.unit || "unit",
      unitPrice: component.unitPrice || 0,
      stockStatus: "good",
      isComponent: true,
    });
    setShowComponentCreator(false);
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
      categoryId,
    };
    onSave?.(recipe);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
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
                placeholder="Recipe name (e.g., Bœuf Bourguignon)"
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
                <h3 className="text-sm font-medium text-muted-foreground">Ingredients</h3>
                <Badge variant="secondary" className="text-xs">
                  {ingredients.length} {ingredients.length === 1 ? "item" : "items"}
                </Badge>
              </div>

              {/* Ingredient Pills */}
              <div className="space-y-2">
                {ingredients.map((ingredient) => (
                  <IngredientPill
                    key={ingredient.id}
                    ingredient={ingredient}
                    onUpdate={(updates) => handleUpdateIngredient(ingredient.id, updates)}
                    onRemove={() => handleRemoveIngredient(ingredient.id)}
                  />
                ))}

                {/* Add Ingredient Button */}
                <Button
                  variant="outline"
                  className="w-full justify-start text-muted-foreground hover:text-foreground"
                  onClick={() => setShowIngredientPicker(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add ingredient or component
                </Button>
              </div>
            </div>

            {/* Yields */}
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

            {/* Chapter Selection */}
            <RecipeCategorySelect
              value={categoryId}
              onChange={setCategoryId}
              categoryType="DISH"
              label="Chapter"
              placeholder="Select a chapter (optional)"
            />

            {/* Recipe Summary */}
            <RecipeSummary
              totalCost={totalCost}
              sellingPrice={sellingPrice || suggestedPrice}
              stockStatus={stockStatus}
              ingredientCount={ingredients.length}
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

      {/* Smart Ingredient Picker */}
      <SmartIngredientPicker
        open={showIngredientPicker}
        onClose={() => setShowIngredientPicker(false)}
        onSelect={handleAddIngredient}
        onCreateNew={() => {
          setShowIngredientPicker(false);
          setShowComponentCreator(true);
        }}
      />

      {/* Quick Component Creator */}
      <QuickComponentCreator
        open={showComponentCreator}
        onClose={() => setShowComponentCreator(false)}
        onCreate={handleCreateComponent}
      />
    </>
  );
}
