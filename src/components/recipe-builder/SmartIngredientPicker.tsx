"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Package, Beaker } from "lucide-react";
import { cn } from "@/lib/utils";

type IngredientOption = {
  id: string;
  name: string;
  type: "product" | "component";
  unit: string;
  unitPrice?: number;
  stockQuantity?: number;
  parLevel?: number;
  category?: string;
};

type SmartIngredientPickerProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (ingredient: any) => void;
  onCreateNew: () => void;
};

export function SmartIngredientPicker({
  open,
  onClose,
  onSelect,
  onCreateNew,
}: SmartIngredientPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<IngredientOption[]>([]);
  const [components, setComponents] = useState<IngredientOption[]>([]);
  const [loading, setLoading] = useState(false);

  // Load products and components
  useEffect(() => {
    if (open) {
      loadIngredients();
    }
  }, [open]);

  const loadIngredients = async () => {
    setLoading(true);
    try {
      // Load products
      const productsResponse = await fetch("/api/products");
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        setProducts(
          productsData.map((p: any) => ({
            id: p.id,
            name: p.name,
            type: "product" as const,
            unit: p.unit,
            unitPrice: p.unitPrice,
            stockQuantity: p.quantity,
            parLevel: p.parLevel,
            category: p.category,
          }))
        );
      }

      // Load composite products (components)
      const componentsResponse = await fetch("/api/composite-products");
      if (componentsResponse.ok) {
        const componentsData = await componentsResponse.json();
        setComponents(
          componentsData.map((c: any) => ({
            id: c.id,
            name: c.name,
            type: "component" as const,
            unit: c.unit,
            unitPrice: c.calculatedUnitPrice,
            stockQuantity: c.quantity,
            category: c.category,
          }))
        );
      }
    } catch (error) {
      console.error("Error loading ingredients:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter based on search
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products.slice(0, 10);
    const query = searchQuery.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(query));
  }, [products, searchQuery]);

  const filteredComponents = useMemo(() => {
    if (!searchQuery.trim()) return components.slice(0, 5);
    const query = searchQuery.toLowerCase();
    return components.filter((c) => c.name.toLowerCase().includes(query));
  }, [components, searchQuery]);

  const getStockStatus = (item: IngredientOption) => {
    if (!item.stockQuantity) return "out";
    if (item.parLevel && item.stockQuantity < item.parLevel * 0.5) return "low";
    return "good";
  };

  const handleSelect = (item: IngredientOption) => {
    onSelect({
      id: `${item.type}-${item.id}`,
      type: item.type,
      name: item.name,
      quantity: 1,
      unit: item.unit,
      unitPrice: item.unitPrice || 0,
      stockStatus: getStockStatus(item),
      isComponent: item.type === "component",
    });
    setSearchQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Ingredient or Component</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Search ingredients or type to create new..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto space-y-4">
            {/* Products Section */}
            {filteredProducts.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <Package className="h-3 w-3" />
                  Raw Ingredients
                </h4>
                <div className="space-y-1">
                  {filteredProducts.map((product) => {
                    const stockStatus = getStockStatus(product);
                    return (
                      <button
                        key={product.id}
                        onClick={() => handleSelect(product)}
                        className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full",
                              stockStatus === "good" && "bg-green-500",
                              stockStatus === "low" && "bg-yellow-500",
                              stockStatus === "out" && "bg-red-500"
                            )}
                          />
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {product.category} • {product.stockQuantity} {product.unit}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {product.unitPrice ? `€${product.unitPrice.toFixed(2)}/${product.unit}` : "-"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Components Section */}
            {filteredComponents.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <Beaker className="h-3 w-3" />
                  Prepared Components
                </h4>
                <div className="space-y-1">
                  {filteredComponents.map((component) => (
                    <button
                      key={component.id}
                      onClick={() => handleSelect(component)}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors text-left bg-muted/30"
                    >
                      <div>
                        <div className="font-medium">{component.name}</div>
                        <div className="text-xs text-muted-foreground">{component.category}</div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {component.unitPrice ? `€${component.unitPrice.toFixed(2)}/${component.unit}` : "-"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Create New Option */}
            <div className="border-t pt-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={onCreateNew}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create new component "{searchQuery || "..."}"
              </Button>
            </div>

            {/* Empty State */}
            {!loading && filteredProducts.length === 0 && filteredComponents.length === 0 && searchQuery && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No ingredients found for "{searchQuery}"</p>
                <Button variant="link" onClick={onCreateNew} className="mt-2">
                  Create it as a new component
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
