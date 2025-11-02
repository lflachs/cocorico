"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Zap, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useLanguage } from "@/providers/LanguageProvider";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { RecipeCategorySidebar } from "@/components/cookbook/RecipeCategorySidebar";
import { PreparedIngredientCard } from "@/components/cookbook/PreparedIngredientCard";
import { CategoryManagementDialog } from "@/components/cookbook/CategoryManagementDialog";
import { PreparedQuickCreateFlow } from "./PreparedQuickCreateFlow";
import type { CategoryType } from "@/components/cookbook/RecipeCategorySidebar";

/**
 * Cookbook-style Prepared Ingredients List
 * Displays prepared/composite ingredients organized by categories like a cookbook
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
    preparedProducts?: number;
  };
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

export function PreparedIngredientsListCookbook() {
  const { t } = useLanguage();
  const [compositeProducts, setCompositeProducts] = useState<CompositeProduct[]>([]);
  const [categories, setCategories] = useState<RecipeCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showManageCategories, setShowManageCategories] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load composite products
  const loadCompositeProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/composite-products");
      if (response.ok) {
        const data = await response.json();
        setCompositeProducts(data);
      } else {
        toast.error(t("prepared.delete.error"));
      }
    } catch (error) {
      console.error("Error loading composite products:", error);
      toast.error(t("prepared.delete.error"));
    } finally {
      setLoading(false);
    }
  };

  // Load categories
  const loadCategories = async () => {
    try {
      const { getRecipeCategoriesAction } = await import("@/lib/actions/recipe-category.actions");
      const result = await getRecipeCategoriesAction("PREPARED_INGREDIENT");
      if (result.success && result.data) {
        setCategories(result.data as RecipeCategory[]);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  useEffect(() => {
    loadCompositeProducts();
    loadCategories();
  }, []);

  // Calculate unit price for composite product
  const calculateUnitPrice = (product: CompositeProduct): number => {
    const totalCost = product.compositeIngredients.reduce((sum, ing) => {
      const unitPrice = ing.baseProduct.unitPrice ?? 0;
      return sum + unitPrice * ing.quantity;
    }, 0);

    const yieldQty = product.yieldQuantity ?? product.quantity;
    return yieldQty > 0 ? totalCost / yieldQty : 0;
  };

  // Filter prepared ingredients
  const filteredProducts = useMemo(() => {
    let filtered = compositeProducts;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategoryId) {
      const category = categories.find((c) => c.id === selectedCategoryId);
      if (category) {
        filtered = filtered.filter((product) => product.category === category.name);
      }
    }

    return filtered;
  }, [compositeProducts, searchQuery, selectedCategoryId, categories]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(t("prepared.delete.confirm"))) {
      return;
    }

    try {
      const response = await fetch(`/api/composite-products/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success(t("prepared.delete.success"));
        loadCompositeProducts();
      } else {
        const error = await response.json();
        toast.error(error.error || t("prepared.delete.error"));
      }
    } catch (error) {
      console.error("Error deleting composite product:", error);
      toast.error(t("prepared.delete.error"));
    }
  };

  const handleManageCategories = () => {
    setShowManageCategories(true);
  };

  const getCurrentCategoryName = () => {
    if (!selectedCategoryId) return "Tous les ingrédients préparés";
    const category = categories.find((c) => c.id === selectedCategoryId);
    return category?.name ?? "Catégorie inconnue";
  };

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block lg:w-64 flex-shrink-0">
        <RecipeCategorySidebar
          categories={categories}
          categoryType="PREPARED_INGREDIENT"
          selectedCategoryId={selectedCategoryId}
          onCategorySelect={setSelectedCategoryId}
          onManageCategories={handleManageCategories}
          showManageButton={true}
        />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <RecipeCategorySidebar
            categories={categories}
            categoryType="PREPARED_INGREDIENT"
            selectedCategoryId={selectedCategoryId}
            onCategorySelect={(categoryId) => {
              setSelectedCategoryId(categoryId);
              setSidebarOpen(false);
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
          {/* Mobile header */}
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
                {filteredProducts.length} ingrédient{filteredProducts.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Desktop header */}
          <div className="hidden lg:flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">{getCurrentCategoryName()}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredProducts.length} ingrédient{filteredProducts.length !== 1 ? "s" : ""} préparé{filteredProducts.length !== 1 ? "s" : ""}
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

          {/* Mobile actions */}
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
              placeholder="Rechercher un ingrédient préparé..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Ingredient cards grid */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground">Chargement des ingrédients préparés...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery
                  ? "Aucun ingrédient trouvé pour cette recherche"
                  : selectedCategoryId
                  ? "Aucun ingrédient dans cette catégorie"
                  : "Aucun ingrédient préparé créé"}
              </p>
              {!searchQuery && (
                <Button onClick={() => setShowQuickCreate(true)} size="sm">
                  <Zap className="h-4 w-4 mr-2" />
                  Créer votre premier ingrédient préparé
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
              {filteredProducts.map((product) => {
                const unitPrice = calculateUnitPrice(product);
                return (
                  <PreparedIngredientCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    quantity={product.quantity}
                    unit={product.unit}
                    yieldQuantity={product.yieldQuantity}
                    category={product.category}
                    ingredientCount={product.compositeIngredients.length}
                    calculatedUnitPrice={unitPrice}
                    onDelete={() => handleDelete(product.id, product.name)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <PreparedQuickCreateFlow
        open={showQuickCreate}
        onOpenChange={(open) => {
          if (!open) {
            // Dialog is closing, refresh data
            loadCompositeProducts();
            loadCategories();
          }
          setShowQuickCreate(open);
        }}
      />

      {showManageCategories && (
        <CategoryManagementDialog
          open={showManageCategories}
          onClose={() => setShowManageCategories(false)}
          categoryType="PREPARED_INGREDIENT"
          categories={categories}
          onRefresh={() => {
            loadCategories();
            loadCompositeProducts();
          }}
        />
      )}
    </div>
  );
}
