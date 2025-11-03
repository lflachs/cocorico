/**
 * Product Cost Calculation Utilities
 * Handles cost calculations for both simple and composite products
 */

export type CompositeIngredient = {
  quantity: number;
  baseProduct: {
    id: string;
    unitPrice?: number | null;
    isComposite?: boolean;
    compositeIngredients?: CompositeIngredient[];
  };
};

export type Product = {
  id: string;
  unitPrice?: number | null;
  isComposite?: boolean;
  yieldQuantity?: number | null;
  compositeIngredients?: CompositeIngredient[];
};

/**
 * Recursively calculate the unit cost of a product
 * For composite products, calculates cost from base ingredients
 * For simple products, returns the unit price directly
 */
export function calculateProductUnitCost(product: Product): number {
  // If product has a direct unit price set, use it
  if (product.unitPrice !== null && product.unitPrice !== undefined) {
    return product.unitPrice;
  }

  // If product is composite, calculate from base ingredients
  if (product.isComposite && product.compositeIngredients && product.compositeIngredients.length > 0) {
    const totalCost = product.compositeIngredients.reduce((sum, ingredient) => {
      // Recursively calculate base product cost
      const baseCost = calculateProductUnitCost(ingredient.baseProduct);
      return sum + (baseCost * ingredient.quantity);
    }, 0);

    // Divide by yield quantity to get cost per unit
    const yieldQty = product.yieldQuantity ?? 1;
    return yieldQty > 0 ? totalCost / yieldQty : totalCost;
  }

  // Default to 0 if no price information available
  return 0;
}

/**
 * Calculate total cost for a quantity of a product
 */
export function calculateProductTotalCost(product: Product, quantity: number): number {
  const unitCost = calculateProductUnitCost(product);
  return unitCost * quantity;
}
