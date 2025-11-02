"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChefHat, Plus, Layers, Trash2, ArrowLeft, Save } from "lucide-react";
import { MultiSelectIngredientSearch } from "@/components/recipe-builder/MultiSelectIngredientSearch";
import { SelectableIngredientPill } from "@/components/recipe-builder/SelectableIngredientPill";
import { GroupAsComponentDialog } from "@/components/recipe-builder/GroupAsComponentDialog";
import { RecipeSummary } from "@/components/recipe-builder/RecipeSummary";
import { toast } from "sonner";

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
  componentName?: string;
  saveToLibrary?: boolean;
};

// Yield units for recipes
const YIELD_UNITS = [
  { value: "Portion", label: "Portion" },
  { value: "Pers.", label: "Pers." },
  { value: "kg", label: "kg" },
  { value: "g", label: "g" },
  { value: "litre", label: "Litre" },
  { value: "ml", label: "ml" },
  { value: "pièce", label: "Pièce" },
] as const;

export function RecipeBuilderFullScreen() {
  const router = useRouter();
  const [recipeName, setRecipeName] = useState("");
  const [recipeDescription, setRecipeDescription] = useState("");
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showIngredientSearch, setShowIngredientSearch] = useState(false);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [sellingPrice, setSellingPrice] = useState<number | null>(null);
  const [yields, setYields] = useState<number>(1);
  const [yieldsUnit, setYieldsUnit] = useState("Portion");
  const [isSaving, setIsSaving] = useState(false);

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

  const handleSave = async () => {
    if (!recipeName || ingredients.length === 0) {
      toast.error("Veuillez remplir tous les champs requis");
      return;
    }

    setIsSaving(true);
    try {
      const recipe = {
        name: recipeName,
        description: recipeDescription,
        ingredients,
        sellingPrice: sellingPrice || suggestedPrice,
        yields,
        yieldsUnit,
        totalCost,
      };

      // TODO: Save to database
      console.log("Recipe to save:", recipe);
      toast.success("Recette créée avec succès");

      // Navigate back to recipes list
      router.push("/menu");
    } catch (error) {
      console.error("Error saving recipe:", error);
      toast.error("Erreur lors de la création de la recette");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (recipeName || ingredients.length > 0) {
      if (confirm("Êtes-vous sûr de vouloir annuler ? Toutes les modifications seront perdues.")) {
        router.push("/menu");
      }
    } else {
      router.push("/menu");
    }
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
    <div className="min-h-screen lg:h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-background">
        <div className="px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Retour</span>
              </Button>
              <div className="h-6 w-px bg-border hidden sm:block" />
              <div className="flex items-center gap-2">
                <ChefHat className="h-5 w-5 text-muted-foreground" />
                <h1 className="text-lg md:text-xl font-bold">Créer une recette</h1>
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={!recipeName || ingredients.length === 0 || isSaving}
              className="gap-2"
              size="default"
            >
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">Enregistrer</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden">
        {/* Left Column - Recipe Info & Details - Shows SECOND on mobile */}
        <div className="w-full lg:w-[440px] lg:border-r border-t lg:border-t-0 bg-muted/30 lg:overflow-y-auto p-4 md:p-6 order-2 lg:order-1 flex-shrink-0">
          <div className="space-y-4 md:space-y-6 lg:sticky lg:top-0">
            {/* Mobile Section Header */}
            <div className="lg:hidden mb-4">
              <h2 className="text-lg font-bold">Informations de la recette</h2>
              <p className="text-sm text-muted-foreground">Complétez les détails de votre recette</p>
            </div>

            {/* Recipe Name */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Nom de la recette <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="Ex: Côte de bœuf grillée"
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
                className="text-lg font-semibold h-12 px-4 bg-background"
              />
            </div>

            {/* Recipe Description */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Description (optionnel)
              </label>
              <Textarea
                placeholder="Ajoutez une brève description de votre recette..."
                value={recipeDescription}
                onChange={(e) => setRecipeDescription(e.target.value)}
                rows={4}
                className="resize-none bg-background"
              />
            </div>

            <div className="h-px bg-border" />

            {/* Yields & Price Section */}
            <div>
              <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">
                Détails de la recette
              </h3>

              {/* Yields */}
              <div className="space-y-2 mb-4">
                <label className="text-sm font-medium">Rendement</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="1"
                    value={yields}
                    onChange={(e) => setYields(parseInt(e.target.value) || 1)}
                    className="w-24 bg-background"
                  />
                  <Select value={yieldsUnit} onValueChange={setYieldsUnit}>
                    <SelectTrigger className="flex-1 bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {YIELD_UNITS.map((unit) => (
                        <SelectItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Price */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Prix de vente (€)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={sellingPrice || ""}
                  onChange={(e) => setSellingPrice(parseFloat(e.target.value) || null)}
                  placeholder={`Suggéré: ${suggestedPrice.toFixed(2)} €`}
                  className="bg-background"
                />
                <p className="text-xs text-muted-foreground">
                  Prix suggéré basé sur un coefficient de 3x
                </p>
              </div>
            </div>

            {/* Recipe Summary */}
            {ingredients.length > 0 && (
              <>
                <div className="h-px bg-border" />
                <div>
                  <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">
                    Résumé
                  </h3>
                  <RecipeSummary
                    totalCost={totalCost}
                    sellingPrice={sellingPrice || suggestedPrice}
                    stockStatus={stockStatus}
                    ingredientCount={countIngredients(ingredients)}
                  />
                </div>
              </>
            )}

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
              <div className="font-medium mb-2">💡 Conseil</div>
              <ul className="space-y-1 text-xs">
                <li>• Sélectionnez plusieurs ingrédients pour les regrouper</li>
                <li>• Visez une marge de 60% ou plus</li>
                <li>• Vérifiez la disponibilité en stock</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column - Recipe Builder - Shows FIRST on mobile */}
        <div className="flex-1 lg:overflow-y-auto p-4 md:p-6 order-1 lg:order-2">
          <div className="max-w-5xl mx-auto">
            {/* Ingredients Section */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-xl md:text-2xl font-bold">
                    Ingrédients <span className="text-destructive">*</span>
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {ingredients.length === 0
                      ? "Aucun ingrédient ajouté"
                      : `${countIngredients(ingredients)} ingrédient${countIngredients(ingredients) > 1 ? "s" : ""}`
                    }
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedIds.size > 0 && (
                    <>
                      <span className="text-xs sm:text-sm text-muted-foreground bg-muted px-2 sm:px-3 py-1 sm:py-1.5 rounded-md font-medium">
                        {selectedIds.size} sélectionné{selectedIds.size > 1 ? "s" : ""}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowGroupDialog(true)}
                        disabled={selectedIds.size < 2}
                        className="gap-2"
                      >
                        <Layers className="h-4 w-4" />
                        <span className="hidden sm:inline">Grouper</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDeleteSelected}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Ingredient Pills */}
              <div className="space-y-2 border-2 border-dashed rounded-xl p-4 md:p-8 bg-muted/20">
                {ingredients.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[300px] md:h-[500px] text-center px-4">
                    <div className="rounded-full bg-gradient-to-br from-purple-100 to-blue-100 p-6 md:p-8 mb-4 md:mb-6">
                      <ChefHat className="h-12 w-12 md:h-16 md:w-16 text-purple-600" />
                    </div>
                    <h3 className="text-lg md:text-xl font-semibold mb-2">
                      Construisez votre recette
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground max-w-lg mb-4 md:mb-6">
                      Ajoutez des ingrédients, ajustez les quantités, puis sélectionnez-les et regroupez-les en composants pour organiser votre recette
                    </p>
                    <Button
                      onClick={() => setShowIngredientSearch(true)}
                      size="lg"
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Ajouter des ingrédients
                    </Button>
                  </div>
                ) : (
                  <>
                    {ingredients.map((ingredient) => (
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
                    ))}

                    {/* Add Ingredient Button */}
                    <Button
                      variant="outline"
                      className="w-full justify-start text-muted-foreground hover:text-foreground border-dashed h-12 md:h-14 mt-2 text-sm md:text-base"
                      onClick={() => setShowIngredientSearch(true)}
                    >
                      <Plus className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                      Ajouter un ingrédient
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

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
    </div>
  );
}
