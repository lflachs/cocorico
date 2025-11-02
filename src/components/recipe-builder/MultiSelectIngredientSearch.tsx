"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Package, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type Product = {
  id: string;
  name: string;
  unit: string;
  unitPrice?: number;
  quantity?: number;
  parLevel?: number;
  category?: string;
};

type MultiSelectIngredientSearchProps = {
  open: boolean;
  onClose: () => void;
  onAddMultiple: (products: any[]) => void;
};

export function MultiSelectIngredientSearch({
  open,
  onClose,
  onAddMultiple,
}: MultiSelectIngredientSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      loadProducts();
      setSelectedIds(new Set());
      setSearchQuery("");
    }
  }, [open]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(
          data
            .filter((p: any) => !p.isComposite)
            .map((p: any) => ({
              id: p.id,
              name: p.name,
              unit: p.unit,
              unitPrice: p.unitPrice,
              quantity: p.quantity,
              parLevel: p.parLevel,
              category: p.category,
            }))
        );
      }
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products.slice(0, 30);
    const query = searchQuery.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(query));
  }, [products, searchQuery]);

  const getStockStatus = (product: Product): "good" | "low" | "out" => {
    if (!product.quantity) return "out";
    if (product.parLevel && product.quantity < product.parLevel * 0.5) return "low";
    return "good";
  };

  const toggleSelect = (productId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedIds(newSelected);
  };

  const handleAddSelected = () => {
    const selectedProducts = products
      .filter((p) => selectedIds.has(p.id))
      .map((p) => ({
        ...p,
        stockStatus: getStockStatus(p),
      }));

    onAddMultiple(selectedProducts);
    setSelectedIds(new Set());
    setSearchQuery("");
    onClose();
  };

  const handleClose = () => {
    setSelectedIds(new Set());
    setSearchQuery("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Ingredients</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
          {/* Search Input */}
          <div className="relative flex-shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Search ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-2">
            {filteredProducts.map((product) => {
              const stockStatus = getStockStatus(product);
              const isSelected = selectedIds.has(product.id);

              return (
                <div
                  key={product.id}
                  onClick={() => toggleSelect(product.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer",
                    isSelected
                      ? "bg-blue-50 border-2 border-blue-300"
                      : "border-2 border-transparent hover:bg-accent"
                  )}
                >
                  {/* Checkbox */}
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleSelect(product.id)}
                    className="flex-shrink-0"
                  />

                  {/* Stock Status */}
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full flex-shrink-0",
                      stockStatus === "good" && "bg-green-500",
                      stockStatus === "low" && "bg-yellow-500",
                      stockStatus === "out" && "bg-red-500"
                    )}
                  />

                  {/* Icon */}
                  <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{product.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {product.category} • {product.quantity} {product.unit} in stock
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-sm text-muted-foreground flex-shrink-0">
                    {product.unitPrice ? `€${product.unitPrice.toFixed(2)}/${product.unit}` : "-"}
                  </div>
                </div>
              );
            })}

            {!loading && filteredProducts.length === 0 && (
              <div className="flex items-center justify-center h-40 text-center">
                <p className="text-sm text-muted-foreground">
                  No ingredients found{searchQuery && ` for "${searchQuery}"`}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t flex-shrink-0">
            <div className="text-sm text-muted-foreground">
              {selectedIds.size > 0 ? (
                <span className="font-medium text-foreground">
                  {selectedIds.size} ingredient{selectedIds.size !== 1 ? "s" : ""} selected
                </span>
              ) : (
                "Select ingredients to add to your recipe"
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleAddSelected} disabled={selectedIds.size === 0}>
                <Plus className="h-4 w-4 mr-2" />
                Add {selectedIds.size > 0 && `${selectedIds.size}`} ingredient
                {selectedIds.size !== 1 ? "s" : ""}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
