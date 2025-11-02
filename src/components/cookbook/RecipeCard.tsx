"use client";

import { useState } from "react";
import { Trash2, ChefHat } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RecipeCardProps {
  id: string;
  name: string;
  description?: string | null;
  ingredientCount?: number;
  cost?: number;
  sellingPrice?: number | null;
  margin?: number;
  isActive?: boolean;
  onDelete?: () => void;
  onClick?: () => void;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
}

export function RecipeCard({
  id,
  name,
  description,
  ingredientCount = 0,
  cost = 0,
  sellingPrice,
  margin,
  isActive = true,
  onDelete,
  onClick,
  selected = false,
  onSelect,
}: RecipeCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const formattedCost = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cost);

  const formattedPrice = sellingPrice
    ? new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
      }).format(sellingPrice)
    : "-";

  const formattedMargin =
    margin !== undefined ? `${margin > 0 ? "+" : ""}${margin.toFixed(1)}%` : "-";

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-200",
        "hover:shadow-md hover:-translate-y-0.5",
        "border-2",
        selected ? "border-primary ring-2 ring-primary/20" : "border-border",
        !isActive && "opacity-60",
        onClick && "cursor-pointer"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Selection checkbox (top-left corner) */}
      {onSelect && (
        <div
          className={cn(
            "absolute top-2 left-2 z-10 transition-opacity",
            isHovered || selected ? "opacity-100" : "opacity-0"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelect(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
          />
        </div>
      )}

      {/* Delete button (top-right corner) */}
      {onDelete && (
        <div
          className={cn(
            "absolute top-2 right-2 z-10 transition-opacity",
            isHovered ? "opacity-100" : "opacity-0"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      <CardHeader className="pb-3">
        {/* Title */}
        <div className="pr-8">
          <h3 className="font-semibold text-base leading-tight line-clamp-2 mb-2">
            {name}
          </h3>
        </div>

        {/* Recipe info badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            <ChefHat className="h-3 w-3" />
            <span className="font-medium">{ingredientCount}</span>
          </span>
          {!isActive && (
            <span className="inline-flex items-center text-xs text-destructive bg-destructive/10 px-2 py-1 rounded font-medium">
              Inactif
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}

        {/* Pricing grid */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground mb-1 truncate">Coût</p>
            <p className="text-sm font-semibold truncate" title={formattedCost}>
              {formattedCost}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground mb-1 truncate">Prix</p>
            <p className="text-sm font-semibold truncate" title={formattedPrice}>
              {formattedPrice}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground mb-1 truncate">Marge</p>
            <p
              className={cn(
                "text-sm font-semibold truncate",
                margin && margin > 0 ? "text-green-600" : "text-red-600"
              )}
              title={formattedMargin}
            >
              {formattedMargin}
            </p>
          </div>
        </div>
      </CardContent>

      {/* Hover effect overlay */}
      <div
        className={cn(
          "absolute inset-0 pointer-events-none transition-opacity",
          "bg-gradient-to-t from-primary/5 to-transparent",
          isHovered ? "opacity-100" : "opacity-0"
        )}
      />
    </Card>
  );
}
