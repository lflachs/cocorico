"use client";

import { TrendingUp, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type RecipeSummaryProps = {
  totalCost: number;
  sellingPrice: number;
  stockStatus: "good" | "low" | "out";
  ingredientCount: number;
};

export function RecipeSummary({
  totalCost,
  sellingPrice,
  stockStatus,
  ingredientCount,
}: RecipeSummaryProps) {
  const margin = sellingPrice > 0 ? ((sellingPrice - totalCost) / sellingPrice) * 100 : 0;
  const markup = totalCost > 0 ? ((sellingPrice - totalCost) / totalCost) * 100 : 0;

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Résumé de la recette</h3>
        <div
          className={cn(
            "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
            stockStatus === "good" && "bg-green-100 text-green-700",
            stockStatus === "low" && "bg-yellow-100 text-yellow-700",
            stockStatus === "out" && "bg-red-100 text-red-700"
          )}
        >
          {stockStatus === "good" && <CheckCircle2 className="h-3 w-3" />}
          {stockStatus === "low" && <AlertTriangle className="h-3 w-3" />}
          {stockStatus === "out" && <AlertCircle className="h-3 w-3" />}
          <span>
            {stockStatus === "good" && "Tout en stock"}
            {stockStatus === "low" && "Stock faible"}
            {stockStatus === "out" && "Manquants"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Total Cost */}
        <div className="bg-white rounded-lg p-3">
          <div className="text-xs text-muted-foreground mb-1">Coût total</div>
          <div className="text-2xl font-bold">€{totalCost.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground mt-1">{ingredientCount} ingrédient{ingredientCount !== 1 ? "s" : ""}</div>
        </div>

        {/* Selling Price */}
        <div className="bg-white rounded-lg p-3">
          <div className="text-xs text-muted-foreground mb-1">Prix de vente</div>
          <div className="text-2xl font-bold text-green-600">€{sellingPrice.toFixed(2)}</div>
          <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {markup.toFixed(0)}% marge
          </div>
        </div>
      </div>

      {/* Margin */}
      <div className="bg-white rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-muted-foreground">Marge bénéficiaire</div>
          <div className="text-sm font-bold">{margin.toFixed(1)}%</div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className={cn(
              "h-full transition-all rounded-full",
              margin >= 60 && "bg-green-500",
              margin >= 40 && margin < 60 && "bg-yellow-500",
              margin < 40 && "bg-red-500"
            )}
            style={{ width: `${Math.min(margin, 100)}%` }}
          />
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Bénéfice : €{(sellingPrice - totalCost).toFixed(2)}
        </div>
      </div>

      {/* Recommendations */}
      {margin < 60 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-xs text-yellow-800">
          💡 Envisagez d'augmenter le prix pour obtenir une marge plus saine (objectif : 60%+)
        </div>
      )}
    </div>
  );
}
