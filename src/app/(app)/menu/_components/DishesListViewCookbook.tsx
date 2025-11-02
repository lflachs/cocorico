"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Zap, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { RecipeCategorySidebar } from "@/components/cookbook/RecipeCategorySidebar";
import { RecipeCard } from "@/components/cookbook/RecipeCard";
import { CategoryManagementDialog } from "@/components/cookbook/CategoryManagementDialog";
import { DishQuickCreateFlow } from "./DishQuickCreateFlow";
import { DishQuickEditDialog } from "./DishQuickEditDialog";
import type { CategoryType } from "@/components/cookbook/RecipeCategorySidebar";

/**
 * Cookbook-style Dishes List View
 * Displays dishes organized by hierarchical categories like a cookbook
 */

type RecipeCategory = {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  order: number;
  parentId?: string | null;
  categoryType: CategoryType;
  isPredefined: boolean;
  children?: RecipeCategory[];
  _count?: {
    dishes?: number;
  };
};

type Dish = {
  id: string;
  name: string;
  description?: string | null;
  sellingPrice?: number | null;
  isActive: boolean;
  categoryId?: string | null;
  category?: RecipeCategory | null;
  recipeIngredients?: {
    id: string;
    quantityRequired: number;
    unit: string;
    product: {
      id: string;
      name: string;
      unitPrice?: number | null;
    };
  }[];
};

export function DishesListViewCookbook() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<RecipeCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [selectedDishIds, setSelectedDishIds] = useState<Set<string>>(new Set());
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showManageCategories, setShowManageCategories] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);

  // Load dishes from the database
  const loadDishes = async () => {
    setLoading(true);
    try {
      const { getDishesAction } = await import("@/lib/actions/dish.actions");
      const result = await getDishesAction({ includeRecipe: true });
      if (result.success && result.data) {
        setDishes(result.data as Dish[]);
      }
    } catch (error) {
      console.error("Error loading dishes:", error);
      toast.error("Échec du chargement des recettes");
    } finally {
      setLoading(false);
    }
  };

  // Load categories from the database
  const loadCategories = async () => {
    try {
      const { getRecipeCategoriesAction } = await import("@/lib/actions/recipe-category.actions");
      const result = await getRecipeCategoriesAction("DISH");
      if (result.success && result.data) {
        setCategories(result.data as RecipeCategory[]);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  useEffect(() => {
    loadDishes();
    loadCategories();
  }, []);

  // Calculate dish cost and margin
  const calculateDishMetrics = (dish: Dish) => {
    const cost = dish.recipeIngredients?.reduce((sum, ing) => {
      const unitPrice = ing.product.unitPrice ?? 0;
      return sum + unitPrice * ing.quantityRequired;
    }, 0) ?? 0;

    const ingredientCount = dish.recipeIngredients?.length ?? 0;

    const margin = dish.sellingPrice && cost > 0
      ? ((dish.sellingPrice - cost) / dish.sellingPrice) * 100
      : undefined;

    return { cost, ingredientCount, margin };
  };

  // Filter and organize dishes
  const filteredDishes = useMemo(() => {
    let filtered = dishes;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (dish) =>
          dish.name.toLowerCase().includes(query) ||
          dish.description?.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategoryId) {
      filtered = filtered.filter((dish) => dish.categoryId === selectedCategoryId);
    }

    return filtered;
  }, [dishes, searchQuery, selectedCategoryId]);

  // Group dishes by category for display
  const dishesByCategory = useMemo(() => {
    const groups = new Map<string, Dish[]>();

    filteredDishes.forEach((dish) => {
      const categoryId = dish.categoryId ?? "uncategorized";
      if (!groups.has(categoryId)) {
        groups.set(categoryId, []);
      }
      groups.get(categoryId)!.push(dish);
    });

    return groups;
  }, [filteredDishes]);

  const handleDelete = async (dishId: string, dishName: string) => {
    if (!confirm(`Supprimer la recette "${dishName}" ?`)) {
      return;
    }

    try {
      const { deleteDishAction } = await import("@/lib/actions/dish.actions");
      const result = await deleteDishAction(dishId);

      if (result.success) {
        toast.success("Recette supprimée avec succès");
        loadDishes();
        loadCategories();
      } else {
        toast.error(result.error || "Échec de la suppression");
      }
    } catch (error) {
      console.error("Error deleting dish:", error);
      toast.error("Échec de la suppression");
    }
  };

  const handleManageCategories = () => {
    setShowManageCategories(true);
  };

  const getCurrentCategoryName = () => {
    if (!selectedCategoryId) return "Toutes les recettes";
    const category = categories.find((c) => c.id === selectedCategoryId);
    return category?.name ?? "Catégorie inconnue";
  };

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden lg:block lg:w-64 flex-shrink-0">
        <RecipeCategorySidebar
          categories={categories}
          categoryType="DISH"
          selectedCategoryId={selectedCategoryId}
          onCategorySelect={setSelectedCategoryId}
          onManageCategories={handleManageCategories}
          showManageButton={true}
        />
      </div>

      {/* Mobile Sidebar - Sheet/Drawer */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <RecipeCategorySidebar
            categories={categories}
            categoryType="DISH"
            selectedCategoryId={selectedCategoryId}
            onCategorySelect={(categoryId) => {
              setSelectedCategoryId(categoryId);
              setSidebarOpen(false); // Close sidebar after selection on mobile
            }}
            onManageCategories={handleManageCategories}
            showManageButton={true}
          />
        </SheetContent>
      </Sheet>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header with search and actions */}
        <div className="flex-shrink-0 p-4 md:p-6 border-b bg-background">
          {/* Mobile: Category button + title */}
          <div className="flex items-center gap-3 mb-4 lg:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="flex-shrink-0"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold truncate">{getCurrentCategoryName()}</h1>
              <p className="text-xs text-muted-foreground">
                {filteredDishes.length} recette{filteredDishes.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Desktop: Title + Actions */}
          <div className="hidden lg:flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">{getCurrentCategoryName()}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredDishes.length} recette{filteredDishes.length !== 1 ? "s" : ""}
                {selectedDishIds.size > 0 && ` • ${selectedDishIds.size} sélectionnée${selectedDishIds.size !== 1 ? "s" : ""}`}
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => setShowQuickCreate(true)}
            >
              <Zap className="h-4 w-4 mr-2" />
              Création rapide
            </Button>
          </div>

          {/* Mobile: Actions row */}
          <div className="flex items-center gap-2 mb-4 lg:hidden">
            <Button
              size="sm"
              onClick={() => setShowQuickCreate(true)}
              className="flex-1"
            >
              <Zap className="h-4 w-4 mr-2" />
              Création rapide
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher une recette..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Selection actions */}
          {selectedDishIds.size > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDishIds(new Set())}
              >
                Désélectionner tout
              </Button>
              {/* TODO: Add bulk actions like move to category */}
            </div>
          )}
        </div>

        {/* Recipe cards grid */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground">Chargement des recettes...</p>
            </div>
          ) : filteredDishes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery
                  ? "Aucune recette trouvée pour cette recherche"
                  : selectedCategoryId
                  ? "Aucune recette dans ce chapitre"
                  : "Aucune recette créée"}
              </p>
              {!searchQuery && (
                <Button onClick={() => setShowQuickCreate(true)} size="sm">
                  <Zap className="h-4 w-4 mr-2" />
                  Créer votre première recette
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
              {filteredDishes.map((dish) => {
                const { cost, ingredientCount, margin } = calculateDishMetrics(dish);
                return (
                  <RecipeCard
                    key={dish.id}
                    id={dish.id}
                    name={dish.name}
                    description={dish.description}
                    ingredientCount={ingredientCount}
                    cost={cost}
                    sellingPrice={dish.sellingPrice}
                    margin={margin}
                    isActive={dish.isActive}
                    selected={selectedDishIds.has(dish.id)}
                    onSelect={(selected) => {
                      const newSelection = new Set(selectedDishIds);
                      if (selected) {
                        newSelection.add(dish.id);
                      } else {
                        newSelection.delete(dish.id);
                      }
                      setSelectedDishIds(newSelection);
                    }}
                    onClick={() => setEditingDish(dish)}
                    onDelete={() => handleDelete(dish.id, dish.name)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <DishQuickCreateFlow
        open={showQuickCreate}
        onOpenChange={(open) => {
          if (!open) {
            // Dialog is closing, refresh data
            loadDishes();
            loadCategories();
          }
          setShowQuickCreate(open);
        }}
      />

      {showManageCategories && (
        <CategoryManagementDialog
          open={showManageCategories}
          onClose={() => setShowManageCategories(false)}
          categoryType="DISH"
          categories={categories}
          onRefresh={() => {
            loadCategories();
            loadDishes();
          }}
        />
      )}

      {editingDish && (
        <DishQuickEditDialog
          open={!!editingDish}
          onOpenChange={(open) => {
            if (!open) {
              // Dialog is closing, refresh data
              loadDishes();
              loadCategories();
              setEditingDish(null);
            }
          }}
          dishId={editingDish.id}
          dishName={editingDish.name}
          dishDescription={editingDish.description}
          dishSellingPrice={editingDish.sellingPrice}
        />
      )}
    </div>
  );
}
