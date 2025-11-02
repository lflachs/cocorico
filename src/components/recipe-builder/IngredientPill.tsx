"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Beaker, Package } from "lucide-react";
import { cn } from "@/lib/utils";

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

type IngredientPillProps = {
  ingredient: IngredientItem;
  onUpdate: (updates: Partial<IngredientItem>) => void;
  onRemove: () => void;
};

export function IngredientPill({ ingredient, onUpdate, onRemove }: IngredientPillProps) {
  const [isEditingQuantity, setIsEditingQuantity] = useState(false);
  const [quantityValue, setQuantityValue] = useState(ingredient.quantity.toString());

  const handleQuantityBlur = () => {
    const newQuantity = parseFloat(quantityValue) || 1;
    onUpdate({ quantity: newQuantity });
    setIsEditingQuantity(false);
  };

  const handleQuantityKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleQuantityBlur();
    } else if (e.key === "Escape") {
      setQuantityValue(ingredient.quantity.toString());
      setIsEditingQuantity(false);
    }
  };

  const totalCost = (ingredient.unitPrice || 0) * ingredient.quantity;

  return (
    <div
      className={cn(
        "group flex items-center gap-3 p-3 rounded-lg border transition-all",
        ingredient.isComponent ? "bg-purple-50/50 border-purple-200" : "bg-background",
        "hover:shadow-sm"
      )}
    >
      {/* Stock Status Indicator */}
      <div
        className={cn(
          "w-2 h-2 rounded-full flex-shrink-0",
          ingredient.stockStatus === "good" && "bg-green-500",
          ingredient.stockStatus === "low" && "bg-yellow-500",
          ingredient.stockStatus === "out" && "bg-red-500"
        )}
      />

      {/* Icon */}
      <div className="flex-shrink-0">
        {ingredient.isComponent ? (
          <Beaker className="h-4 w-4 text-purple-600" />
        ) : (
          <Package className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{ingredient.name}</div>
        {ingredient.isComponent && (
          <div className="text-xs text-purple-600">Component</div>
        )}
      </div>

      {/* Quantity Input */}
      <div className="flex items-center gap-2">
        {isEditingQuantity ? (
          <Input
            autoFocus
            type="number"
            step="0.01"
            value={quantityValue}
            onChange={(e) => setQuantityValue(e.target.value)}
            onBlur={handleQuantityBlur}
            onKeyDown={handleQuantityKeyDown}
            className="w-20 h-8 text-center"
          />
        ) : (
          <button
            onClick={() => setIsEditingQuantity(true)}
            className="px-3 py-1 rounded-md hover:bg-accent transition-colors text-sm font-medium min-w-[60px] text-center"
          >
            {ingredient.quantity}
          </button>
        )}
        <span className="text-sm text-muted-foreground min-w-[40px]">{ingredient.unit}</span>
      </div>

      {/* Cost */}
      {ingredient.unitPrice !== undefined && (
        <div className="text-sm text-muted-foreground min-w-[60px] text-right">
          €{totalCost.toFixed(2)}
        </div>
      )}

      {/* Remove Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
