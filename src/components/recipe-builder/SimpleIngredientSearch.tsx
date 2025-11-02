"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Package, Check } from "lucide-react";
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

type SimpleIngredientSearchProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (product: any) => void;
};

export function SimpleIngredientSearch({
  open,
  onClose,
  onSelect,
}: SimpleIngredientSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [addedCount, setAddedCount] = useState(0);
  const [recentlyAdded, setRecentlyAdded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      loadProducts();
      setAddedCount(0);
      setRecentlyAdded(new Set());
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
    if (!searchQuery.trim()) return products.slice(0, 20);
    const query = searchQuery.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(query));
  }, [products, searchQuery]);

  const getStockStatus = (product: Product): "good" | "low" | "out" => {
    if (!product.quantity) return "out";
    if (product.parLevel && product.quantity < product.parLevel * 0.5) return "low";
    return "good";
  };

  const handleSelect = (product: Product) => {
    onSelect({
      ...product,
      stockStatus: getStockStatus(product),
    });

    // Add visual feedback
    setAddedCount((prev) => prev + 1);
    setRecentlyAdded((prev) => new Set(prev).add(product.id));

    // Clear search to prepare for next ingredient
    setSearchQuery("");

    // Remove the "recently added" indicator after a short delay
    setTimeout(() => {
      setRecentlyAdded((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 2000);
  };

  const handleClose = () => {
    setSearchQuery("");
    setAddedCount(0);
    setRecentlyAdded(new Set());
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Add Ingredients</span>
            {addedCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {addedCount} added
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Search and add multiple ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto space-y-1">
            {filteredProducts.map((product) => {
              const stockStatus = getStockStatus(product);
              const wasRecentlyAdded = recentlyAdded.has(product.id);

              return (
                <button
                  key={product.id}
                  onClick={() => handleSelect(product)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-lg transition-all text-left",
                    wasRecentlyAdded
                      ? "bg-green-50 border border-green-200"
                      : "hover:bg-accent"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {wasRecentlyAdded ? (
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    ) : (
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          stockStatus === "good" && "bg-green-500",
                          stockStatus === "low" && "bg-yellow-500",
                          stockStatus === "out" && "bg-red-500"
                        )}
                      />
                    )}
                    {wasRecentlyAdded ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Package className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <div className={cn("font-medium", wasRecentlyAdded && "text-green-700")}>
                        {product.name}
                        {wasRecentlyAdded && <span className="ml-2 text-xs">✓ Added</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {product.category} • {product.quantity} {product.unit} in stock
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {product.unitPrice ? `€${product.unitPrice.toFixed(2)}/${product.unit}` : "-"}
                  </div>
                </button>
              );
            })}

            {!loading && filteredProducts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No ingredients found{searchQuery && ` for "${searchQuery}"`}</p>
              </div>
            )}
          </div>

          {/* Footer with Done button */}
          <div className="flex items-center justify-between pt-2 border-t">
            <p className="text-sm text-muted-foreground">
              {addedCount > 0
                ? `${addedCount} ingredient${addedCount !== 1 ? 's' : ''} added to recipe`
                : "Click ingredients to add them to your recipe"}
            </p>
            <Button onClick={handleClose}>
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
