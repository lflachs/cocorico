"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Zap, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { RecipeCategorySidebar } from "@/components/cookbook/RecipeCategorySidebar";
import { RecipeCard } from "@/components/cookbook/RecipeCard";
import { PreparedIngredientCard } from "@/components/cookbook/PreparedIngredientCard";
import { CategoryManagementDialog } from "@/components/cookbook/CategoryManagementDialog";
import { DishQuickCreateFlow } from "./DishQuickCreateFlow";
import { DishQuickEditDialog } from "./DishQuickEditDialog";
import { PreparedQuickCreateFlow } from "./PreparedQuickCreateFlow";
import type { CategoryType } from "@/components/cookbook/RecipeCategorySidebar";
import { getAllDescendantCategoryIds, flattenCategories } from "@/lib/utils/category-helpers";
import { calculateProductUnitCost } from "@/lib/utils/product-cost";

/**
 * Unified Cookbook-style Recipes List View
 * Displays both dishes and prepared ingredients with a toggle to switch between types
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
    preparedProducts?: number;
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

type CompositeIngredient = {
  id: string;
  baseProductId: string;
  quantity: number;
  unit: string;
  baseProduct: {
    id: string;
    name: string;
    unit: string;
    unitPrice?: number | null;
  };
};

type CompositeProduct = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  yieldQuantity: number | null;
  category: string | null;
  categoryId?: string | null;
  compositeIngredients: CompositeIngredient[];
  calculatedUnitPrice?: number;
};

export function RecipesListViewCookbook() {
  const router = useRouter();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [compositeProducts, setCompositeProducts] = useState<CompositeProduct[]>([]);
  const [categories, setCategories] = useState<RecipeCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showDishCreate, setShowDishCreate] = useState(false);
  const [showPreparedCreate, setShowPreparedCreate] = useState(false);
  const [selectedDishIds, setSelectedDishIds] = useState<Set<string>>(new Set());
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showManageCategories, setShowManageCategories] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);

  // Load dishes from the database
  const loadDishes = async () => {
    try {
      const { getDishesAction } = await import("@/lib/actions/dish.actions");
      const result = await getDishesAction({ includeRecipe: true });
      if (result.success && result.data) {
        setDishes(result.data as Dish[]);
      }
    } catch (error) {
      console.error("Error loading dishes:", error);
      toast.error("Échec du chargement des recettes");
    }
  };

  // Load composite products
  const loadCompositeProducts = async () => {
    try {
      const response = await fetch("/api/composite-products");
      if (response.ok) {
        const data = await response.json();
        setCompositeProducts(data);
      } else {
        toast.error("Échec du chargement des ingrédients préparés");
      }
    } catch (error) {
      console.error("Error loading composite products:", error);
      toast.error("Échec du chargement des ingrédients préparés");
    }
  };

  // Load all categories (both dishes and prepared ingredients)
  const loadCategories = async () => {
    try {
      const { getRecipeCategoriesAction } = await import("@/lib/actions/recipe-category.actions");

      // Load both dish and prepared ingredient categories
      const [dishResult, preparedResult] = await Promise.all([
        getRecipeCategoriesAction("DISH"),
        getRecipeCategoriesAction("PREPARED_INGREDIENT"),
      ]);

      const allCategories: RecipeCategory[] = [];
      if (dishResult.success && dishResult.data) {
        allCategories.push(...(dishResult.data as RecipeCategory[]));
      }
      if (preparedResult.success && preparedResult.data) {
        allCategories.push(...(preparedResult.data as RecipeCategory[]));
      }

      setCategories(allCategories);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  // Load all data on mount
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([loadDishes(), loadCompositeProducts(), loadCategories()]);
      setLoading(false);
    };
    loadAll();
  }, []);

  // Calculate dish cost and margin
  const calculateDishMetrics = (dish: Dish) => {
    const cost = dish.recipeIngredients?.reduce((sum, ing) => {
      // Use recursive calculator for composite products
      const unitCost = calculateProductUnitCost(ing.product as any);
      return sum + unitCost * ing.quantityRequired;
    }, 0) ?? 0;

    const ingredientCount = dish.recipeIngredients?.length ?? 0;

    const margin = dish.sellingPrice && cost > 0
      ? ((dish.sellingPrice - cost) / dish.sellingPrice) * 100
      : undefined;

    return { cost, ingredientCount, margin };
  };

  // Calculate unit price for composite product
  const calculateUnitPrice = (product: CompositeProduct): number => {
    const totalCost = product.compositeIngredients.reduce((sum, ing) => {
      const unitPrice = ing.baseProduct.unitPrice ?? 0;
      return sum + unitPrice * ing.quantity;
    }, 0);

    const yieldQty = product.yieldQuantity ?? product.quantity;
    return yieldQty > 0 ? totalCost / yieldQty : 0;
  };

  // Combine and filter all items (dishes + composite products)
  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    // Filter dishes
    let filteredDishes = dishes;
    if (query) {
      filteredDishes = filteredDishes.filter(
        (dish) =>
          dish.name.toLowerCase().includes(query) ||
          dish.description?.toLowerCase().includes(query)
      );
    }
    if (selectedCategoryId) {
      const flatCategories = flattenCategories(categories);
      const categoryIds = getAllDescendantCategoryIds(selectedCategoryId, flatCategories);

      filteredDishes = filteredDishes.filter((dish) =>
        dish.categoryId && categoryIds.includes(dish.categoryId)
      );
    }

    // Filter composite products
    let filteredComposite = compositeProducts;
    if (query) {
      filteredComposite = filteredComposite.filter((product) =>
        product.name.toLowerCase().includes(query)
      );
    }
    if (selectedCategoryId) {
      const flatCategories = flattenCategories(categories);
      const categoryIds = getAllDescendantCategoryIds(selectedCategoryId, flatCategories);

      filteredComposite = filteredComposite.filter((product) =>
        product.categoryId && categoryIds.includes(product.categoryId)
      );
    }

    // Combine into unified array with type markers
    return {
      dishes: filteredDishes,
      compositeProducts: filteredComposite,
      totalCount: filteredDishes.length + filteredComposite.length,
    };
  }, [dishes, compositeProducts, searchQuery, selectedCategoryId, categories]);

  const handleDeleteDish = async (dishId: string, dishName: string) => {
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

  const handleDeleteCompositeProduct = async (id: string, name: string) => {
    if (!confirm(`Supprimer l'ingrédient préparé "${name}" ?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/composite-products/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Ingrédient préparé supprimé avec succès");
        loadCompositeProducts();
      } else {
        const error = await response.json();
        toast.error(error.error || "Échec de la suppression");
      }
    } catch (error) {
      console.error("Error deleting composite product:", error);
      toast.error("Échec de la suppression");
    }
  };

  const handleManageCategories = () => {
    setShowManageCategories(true);
  };

  const getCurrentCategoryName = () => {
    if (!selectedCategoryId) {
      return "Toutes les recettes";
    }
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
                {filteredItems.totalCount} recette{filteredItems.totalCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Desktop: Title + Actions */}
          <div className="hidden lg:flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">{getCurrentCategoryName()}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredItems.totalCount} recette{filteredItems.totalCount !== 1 ? "s" : ""}
                {selectedDishIds.size > 0 && ` • ${selectedDishIds.size} sélectionnée${selectedDishIds.size !== 1 ? "s" : ""}`}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => router.push("/menu/nouvelle-recette")}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Zap className="h-4 w-4 mr-2" />
                Créer une recette
              </Button>
            </div>
          </div>

          {/* Mobile: Actions row */}
          <div className="flex items-center gap-2 mb-4 lg:hidden">
            <Button
              size="sm"
              onClick={() => router.push("/menu/nouvelle-recette")}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Zap className="h-4 w-4 mr-2" />
              Créer une recette
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher une recette ou préparation..."
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
            </div>
          )}
        </div>

        {/* Recipe cards grid */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground">Chargement des recettes...</p>
            </div>
          ) : filteredItems.totalCount === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery
                  ? "Aucune recette trouvée pour cette recherche"
                  : selectedCategoryId
                  ? "Aucune recette dans ce chapitre"
                  : "Aucune recette créée"}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => router.push("/menu/nouvelle-recette")}
                  size="sm"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Créer une recette
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
              {/* Render dishes */}
              {filteredItems.dishes.map((dish) => {
                const { cost, ingredientCount, margin } = calculateDishMetrics(dish);
                return (
                  <RecipeCard
                    key={`dish-${dish.id}`}
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
                    onDelete={() => handleDeleteDish(dish.id, dish.name)}
                  />
                );
              })}

              {/* Render composite products */}
              {filteredItems.compositeProducts.map((product) => {
                const unitPrice = calculateUnitPrice(product);
                return (
                  <PreparedIngredientCard
                    key={`prepared-${product.id}`}
                    id={product.id}
                    name={product.name}
                    quantity={product.quantity}
                    unit={product.unit}
                    yieldQuantity={product.yieldQuantity}
                    category={product.category}
                    ingredientCount={product.compositeIngredients.length}
                    calculatedUnitPrice={unitPrice}
                    onDelete={() => handleDeleteCompositeProduct(product.id, product.name)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <DishQuickCreateFlow
        open={showDishCreate}
        onOpenChange={(open) => {
          if (!open) {
            loadDishes();
            loadCategories();
          }
          setShowDishCreate(open);
        }}
      />

      <PreparedQuickCreateFlow
        open={showPreparedCreate}
        onOpenChange={(open) => {
          if (!open) {
            loadCompositeProducts();
            loadCategories();
          }
          setShowPreparedCreate(open);
        }}
      />

      {editingDish && (
        <DishQuickEditDialog
          open={!!editingDish}
          onOpenChange={(open) => {
            if (!open) {
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

      {showManageCategories && (
        <CategoryManagementDialog
          open={showManageCategories}
          onClose={() => setShowManageCategories(false)}
          categoryType="DISH"
          categories={categories}
          onRefresh={() => {
            loadCategories();
            loadDishes();
            loadCompositeProducts();
          }}
        />
      )}
    </div>
  );
}
