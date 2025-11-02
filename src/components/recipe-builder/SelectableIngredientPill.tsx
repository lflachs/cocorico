"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { X, ChevronDown, ChevronRight, Layers, Package } from "lucide-react";
import { cn } from "@/lib/utils";

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
};

type SelectableIngredientPillProps = {
  ingredient: RecipeIngredient;
  isSelected: boolean;
  onToggleSelect: () => void;
  onUpdate: (updates: Partial<RecipeIngredient>) => void;
  onRemove: () => void;
  onToggleExpand?: () => void;
  depth?: number;
};

export function SelectableIngredientPill({
  ingredient,
  isSelected,
  onToggleSelect,
  onUpdate,
  onRemove,
  onToggleExpand,
  depth = 0,
}: SelectableIngredientPillProps) {
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

  const isGroup = ingredient.type === "group";
  const hasChildren = isGroup && ingredient.children && ingredient.children.length > 0;

  // Calculate cost for groups recursively
  const calculateTotalCost = (ing: RecipeIngredient): number => {
    if (ing.type === "group" && ing.children) {
      return ing.children.reduce((sum, child) => sum + calculateTotalCost(child), 0);
    }
    return (ing.unitPrice || 0) * ing.quantity;
  };

  const totalCost = calculateTotalCost(ingredient);

  return (
    <div className={cn("space-y-1", depth > 0 && "ml-6")}>
      <div
        className={cn(
          "group flex items-center gap-3 p-3 rounded-lg border transition-all",
          isSelected && "bg-blue-50 border-blue-300 ring-2 ring-blue-200",
          isGroup && "bg-purple-50/50 border-purple-200",
          !isSelected && !isGroup && "bg-background hover:shadow-sm"
        )}
      >
        {/* Checkbox */}
        {!isGroup && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelect}
            className="flex-shrink-0"
          />
        )}

        {/* Expand/Collapse for groups */}
        {isGroup && hasChildren && (
          <button
            onClick={onToggleExpand}
            className="flex-shrink-0 p-1 hover:bg-purple-100 rounded"
          >
            {ingredient.isExpanded ? (
              <ChevronDown className="h-4 w-4 text-purple-600" />
            ) : (
              <ChevronRight className="h-4 w-4 text-purple-600" />
            )}
          </button>
        )}

        {/* Stock Status Indicator (only for raw ingredients) */}
        {!isGroup && (
          <div
            className={cn(
              "w-2 h-2 rounded-full flex-shrink-0",
              ingredient.stockStatus === "good" && "bg-green-500",
              ingredient.stockStatus === "low" && "bg-yellow-500",
              ingredient.stockStatus === "out" && "bg-red-500"
            )}
          />
        )}

        {/* Icon */}
        <div className="flex-shrink-0">
          {isGroup ? (
            <Layers className="h-4 w-4 text-purple-600" />
          ) : (
            <Package className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{ingredient.name}</div>
          {isGroup && ingredient.children && (
            <div className="text-xs text-purple-600">
              {ingredient.children.length} ingredient{ingredient.children.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        {/* Quantity Input (hide for groups) */}
        {!isGroup && (
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
        )}

        {/* Cost */}
        <div className="text-sm text-muted-foreground min-w-[70px] text-right">
          €{totalCost.toFixed(2)}
        </div>

        {/* Remove Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className={cn(
            "h-8 w-8 p-0 transition-opacity",
            isGroup ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Render Children if expanded */}
      {isGroup && hasChildren && ingredient.isExpanded && ingredient.children && (
        <div className="space-y-1 ml-4 border-l-2 border-purple-200 pl-2">
          {ingredient.children.map((child) => (
            <SelectableIngredientPill
              key={child.id}
              ingredient={child}
              isSelected={false}
              onToggleSelect={() => {}}
              onUpdate={() => {}}
              onRemove={() => {}}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
