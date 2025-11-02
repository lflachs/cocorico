"use client";

import { useState } from "react";
import { Trash2, Beaker } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatQuantity } from "@/lib/utils/unit-converter";

interface PreparedIngredientCardProps {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  yieldQuantity?: number | null;
  category?: string | null;
  ingredientCount?: number;
  calculatedUnitPrice?: number;
  onDelete?: () => void;
}

export function PreparedIngredientCard({
  id,
  name,
  quantity,
  unit,
  yieldQuantity,
  category,
  ingredientCount = 0,
  calculatedUnitPrice,
  onDelete,
}: PreparedIngredientCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const formattedPrice = calculatedUnitPrice
    ? new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
      }).format(calculatedUnitPrice)
    : "-";

  const yieldInfo = yieldQuantity
    ? `Rendement: ${formatQuantity(yieldQuantity, unit)}`
    : null;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-200",
        "hover:shadow-md hover:-translate-y-0.5",
        "border-2 border-border"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
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

        {/* Info badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded">
            <Beaker className="h-3 w-3" />
            <span className="font-medium">{formatQuantity(quantity, unit)}</span>
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            <span className="font-medium">{ingredientCount}</span>
            <span>ingr.</span>
          </span>
          {category && (
            <span className="inline-flex items-center text-xs text-muted-foreground bg-muted px-2 py-1 rounded truncate max-w-[120px]" title={category}>
              {category}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Yield info */}
        {yieldInfo && (
          <p className="text-sm text-muted-foreground truncate" title={yieldInfo}>
            {yieldInfo}
          </p>
        )}

        {/* Pricing info */}
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground truncate">Prix unitaire</span>
            <span className="text-sm font-semibold truncate" title={formattedPrice}>
              {formattedPrice}
            </span>
          </div>
        </div>
      </CardContent>

      {/* Hover effect overlay */}
      <div
        className={cn(
          "absolute inset-0 pointer-events-none transition-opacity",
          "bg-gradient-to-t from-purple-500/5 to-transparent",
          isHovered ? "opacity-100" : "opacity-0"
        )}
      />
    </Card>
  );
}
