/**
 * Menu Pricing Utilities
 * Handles pricing calculations and margin analysis for menus
 */

import { PricingType } from '@/lib/validations/menu.schema';

export type Dish = {
  id: string;
  name: string;
  sellingPrice?: number | null;
  recipeIngredients?: {
    id: string;
    quantityRequired: number;
    product: {
      unitPrice?: number | null;
    };
  }[];
};

export type MenuDish = {
  id: string;
  priceOverride?: number | null;
  dish: Dish;
};

export type MenuSection = {
  id: string;
  name: string;
  isRequired: boolean;
  isOptional: boolean;
  dishes: MenuDish[];
};

export type Menu = {
  id: string;
  name: string;
  fixedPrice: number | null;
  pricingType: 'PRIX_FIXE' | 'CHOICE';
  minCourses?: number | null;
  maxCourses?: number | null;
  sections: MenuSection[];
};

/**
 * Calculate the cost of a single dish based on its ingredients
 */
export function calculateDishCost(dish: Dish): number {
  if (!dish.recipeIngredients || dish.recipeIngredients.length === 0) {
    return 0;
  }

  return dish.recipeIngredients.reduce((total, ingredient) => {
    const unitPrice = ingredient.product?.unitPrice || 0;
    return total + ingredient.quantityRequired * unitPrice;
  }, 0);
}

/**
 * Get the effective price for a menu dish (considering price override)
 */
export function getMenuDishPrice(menuDish: MenuDish): number {
  return menuDish.priceOverride ?? menuDish.dish.sellingPrice ?? 0;
}

/**
 * Calculate margin for a single dish
 */
export function calculateDishMargin(dish: Dish, sellingPrice?: number): number | null {
  const cost = calculateDishCost(dish);
  const price = sellingPrice ?? dish.sellingPrice ?? 0;

  if (cost === 0 || price === 0) {
    return null;
  }

  return ((price - cost) / price) * 100;
}

/**
 * Calculate all possible menu combinations cost
 * For CHOICE menus, returns min and max costs
 */
export function calculateMenuCostRange(menu: Menu): {
  minCost: number;
  maxCost: number;
  averageCost: number;
} {
  const sections = menu.sections;

  // For PRIX_FIXE, calculate total cost
  if (menu.pricingType === 'PRIX_FIXE') {
    const costs = sections.flatMap((section) =>
      section.dishes.map((menuDish) => calculateDishCost(menuDish.dish))
    );

    const totalCost = costs.reduce((sum, cost) => sum + cost, 0);

    return {
      minCost: totalCost,
      maxCost: totalCost,
      averageCost: costs.length > 0 ? totalCost / costs.length : 0,
    };
  }

  // For CHOICE menus, calculate min/max based on course selection
  const requiredSections = sections.filter((s) => s.isRequired);
  const optionalSections = sections.filter((s) => s.isOptional || !s.isRequired);

  // Min cost: cheapest dishes from required sections
  const minCostRequired = requiredSections.reduce((total, section) => {
    const sectionCosts = section.dishes.map((md) => calculateDishCost(md.dish));
    return total + (sectionCosts.length > 0 ? Math.min(...sectionCosts) : 0);
  }, 0);

  // Max cost: most expensive dishes from all possible sections
  const maxCostRequired = requiredSections.reduce((total, section) => {
    const sectionCosts = section.dishes.map((md) => calculateDishCost(md.dish));
    return total + (sectionCosts.length > 0 ? Math.max(...sectionCosts) : 0);
  }, 0);

  const maxCostOptional = optionalSections.reduce((total, section) => {
    const sectionCosts = section.dishes.map((md) => calculateDishCost(md.dish));
    return total + (sectionCosts.length > 0 ? Math.max(...sectionCosts) : 0);
  }, 0);

  // Average: middle ground
  const allCosts = sections.flatMap((section) =>
    section.dishes.map((md) => calculateDishCost(md.dish))
  );
  const averageCost = allCosts.length > 0
    ? allCosts.reduce((sum, cost) => sum + cost, 0) / allCosts.length
    : 0;

  return {
    minCost: minCostRequired,
    maxCost: maxCostRequired + maxCostOptional,
    averageCost,
  };
}

/**
 * Calculate menu price based on pricing type
 */
export function calculateMenuPrice(menu: Menu): {
  minPrice: number;
  maxPrice: number;
  displayPrice: string;
} {
  if (!menu.fixedPrice) {
    return {
      minPrice: 0,
      maxPrice: 0,
      displayPrice: 'Price not set',
    };
  }

  if (menu.pricingType === 'PRIX_FIXE') {
    return {
      minPrice: menu.fixedPrice,
      maxPrice: menu.fixedPrice,
      displayPrice: `€${menu.fixedPrice.toFixed(2)}`,
    };
  }

  // CHOICE menu
  const coursesText = menu.minCourses === menu.maxCourses
    ? `${menu.minCourses} courses`
    : `${menu.minCourses}-${menu.maxCourses} courses`;

  return {
    minPrice: menu.fixedPrice,
    maxPrice: menu.fixedPrice,
    displayPrice: `€${menu.fixedPrice.toFixed(2)} (${coursesText})`,
  };
}

/**
 * Calculate menu margin
 */
export function calculateMenuMargin(menu: Menu): {
  minMargin: number | null;
  maxMargin: number | null;
  averageMargin: number | null;
  displayMargin: string;
} {
  const { minCost, maxCost, averageCost } = calculateMenuCostRange(menu);
  const { minPrice, maxPrice } = calculateMenuPrice(menu);

  if (menu.pricingType === 'PRIX_FIXE') {
    // For fixed price menus, show worst-case and best-case margins
    const worstCaseMargin = maxCost > 0 && menu.fixedPrice > 0
      ? ((menu.fixedPrice - maxCost) / menu.fixedPrice) * 100
      : null;

    const bestCaseMargin = minCost > 0 && menu.fixedPrice > 0
      ? ((menu.fixedPrice - minCost) / menu.fixedPrice) * 100
      : null;

    const avgMargin = averageCost > 0 && menu.fixedPrice > 0
      ? ((menu.fixedPrice - averageCost) / menu.fixedPrice) * 100
      : null;

    return {
      minMargin: worstCaseMargin,
      maxMargin: bestCaseMargin,
      averageMargin: avgMargin,
      displayMargin:
        worstCaseMargin !== null && bestCaseMargin !== null
          ? `${worstCaseMargin.toFixed(1)}% - ${bestCaseMargin.toFixed(1)}%`
          : 'N/A',
    };
  }

  if (menu.pricingType === 'CHOICE') {
    const worstCaseMargin = maxCost > 0 && menu.fixedPrice > 0
      ? ((menu.fixedPrice - maxCost) / menu.fixedPrice) * 100
      : null;

    const bestCaseMargin = minCost > 0 && menu.fixedPrice > 0
      ? ((menu.fixedPrice - minCost) / menu.fixedPrice) * 100
      : null;

    return {
      minMargin: worstCaseMargin,
      maxMargin: bestCaseMargin,
      averageMargin: null,
      displayMargin:
        worstCaseMargin !== null && bestCaseMargin !== null
          ? `${worstCaseMargin.toFixed(1)}% - ${bestCaseMargin.toFixed(1)}%`
          : 'N/A',
    };
  }

  return {
    minMargin: null,
    maxMargin: null,
    averageMargin: null,
    displayMargin: 'N/A',
  };
}

/**
 * Get pricing summary for a menu
 */
export function getMenuPricingSummary(menu: Menu): {
  pricingType: string;
  price: string;
  margin: string;
  costRange: string;
} {
  const { displayPrice } = calculateMenuPrice(menu);
  const { displayMargin } = calculateMenuMargin(menu);
  const { minCost, maxCost, averageCost } = calculateMenuCostRange(menu);

  const pricingTypeLabel = menu.pricingType === 'PRIX_FIXE'
    ? 'Fixed Price Menu'
    : 'Choice Menu';

  const costRange = menu.pricingType === 'PRIX_FIXE'
    ? `€${minCost.toFixed(2)} (avg: €${averageCost.toFixed(2)})`
    : `€${minCost.toFixed(2)} - €${maxCost.toFixed(2)}`;

  return {
    pricingType: pricingTypeLabel,
    price: displayPrice,
    margin: displayMargin,
    costRange,
  };
}
