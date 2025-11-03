import { db } from '@/lib/db/client';

/**
 * Insights Queries
 * Analytics focused on waste prevention and money saved
 */

/**
 * Get DLC tracking insights - waste prevented by tracking expiration dates
 */
export async function getDLCInsights(days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get all DLCs created in this period
  const dlcs = await db.dLC.findMany({
    where: {
      createdAt: {
        gte: startDate,
      },
    },
    include: {
      product: true,
    },
  });

  // Calculate value of tracked products (waste prevented)
  const totalValue = dlcs.reduce((sum, dlc) => {
    const value = (dlc.product.unitPrice || 0) * dlc.quantity;
    return sum + value;
  }, 0);

  // Conservative estimate: tracking prevents 15% waste
  const wastePrevented = totalValue * 0.15;

  // Count by status
  const active = dlcs.filter(d => d.status === 'ACTIVE').length;
  const used = dlcs.filter(d => d.status === 'USED').length;
  const expired = dlcs.filter(d => d.status === 'EXPIRED').length;

  // Top tracked products
  const productTracking = new Map<string, {
    productId: string;
    productName: string;
    unit: string;
    trackingCount: number;
    totalQuantity: number;
    totalValue: number;
  }>();

  dlcs.forEach(dlc => {
    const value = (dlc.product.unitPrice || 0) * dlc.quantity;
    const existing = productTracking.get(dlc.productId);
    if (existing) {
      existing.trackingCount += 1;
      existing.totalQuantity += dlc.quantity;
      existing.totalValue += value;
    } else {
      productTracking.set(dlc.productId, {
        productId: dlc.productId,
        productName: dlc.product.name,
        unit: dlc.product.unit,
        trackingCount: 1,
        totalQuantity: dlc.quantity,
        totalValue: value,
      });
    }
  });

  const topTracked = Array.from(productTracking.values())
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 10);

  return {
    summary: {
      totalDLCs: dlcs.length,
      active,
      used,
      expired,
      totalValueTracked: totalValue,
      estimatedWastePrevented: wastePrevented,
    },
    topTracked,
  };
}

/**
 * Get stock adjustments insights - discrepancies between tracked and physical
 */
export async function getStockAdjustmentsInsights(days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get all manual adjustments (inventory sync)
  const movements = await db.stockMovement.findMany({
    where: {
      source: 'MANUAL',
      movementType: 'ADJUSTMENT',
      createdAt: {
        gte: startDate,
      },
    },
    include: {
      product: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Only count negative adjustments as waste (stock was less than expected)
  const wasteAdjustments = movements.filter(m => m.quantity < 0);

  // Calculate total waste value
  const totalWasteValue = Math.abs(
    wasteAdjustments.reduce((sum, m) => sum + (m.totalValue || 0), 0)
  );

  // Group waste by product
  const wasteByProduct = new Map<string, {
    productId: string;
    productName: string;
    unit: string;
    totalQuantity: number;
    totalValue: number;
    count: number;
  }>();

  wasteAdjustments.forEach(m => {
    const existing = wasteByProduct.get(m.productId);
    const absQuantity = Math.abs(m.quantity);
    const absValue = Math.abs(m.totalValue || 0);

    if (existing) {
      existing.totalQuantity += absQuantity;
      existing.totalValue += absValue;
      existing.count += 1;
    } else {
      wasteByProduct.set(m.productId, {
        productId: m.productId,
        productName: m.product.name,
        unit: m.product.unit,
        totalQuantity: absQuantity,
        totalValue: absValue,
        count: 1,
      });
    }
  });

  const topWasted = Array.from(wasteByProduct.values())
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 10);

  return {
    summary: {
      totalAdjustments: movements.length,
      wasteAdjustments: wasteAdjustments.length,
      totalWasteValue,
    },
    topWasted,
    recentAdjustments: movements.slice(0, 20),
  };
}

/**
 * Get inventory accuracy metrics
 */
export async function getInventoryAccuracy(days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get all manual adjustments
  const adjustments = await db.stockMovement.findMany({
    where: {
      source: 'MANUAL',
      movementType: 'ADJUSTMENT',
      createdAt: {
        gte: startDate,
      },
    },
    include: {
      product: true,
    },
  });

  const totalProducts = await db.product.count();
  const productsAdjusted = new Set(adjustments.map(a => a.productId)).size;
  const adjustmentsCount = adjustments.length;

  // Products with frequent adjustments (might indicate counting issues)
  const adjustmentsByProduct = new Map<string, number>();
  adjustments.forEach(a => {
    adjustmentsByProduct.set(
      a.productId,
      (adjustmentsByProduct.get(a.productId) || 0) + 1
    );
  });

  const frequentlyAdjusted = Array.from(adjustmentsByProduct.entries())
    .filter(([_, count]) => count >= 3)
    .map(([productId, count]) => {
      const product = adjustments.find(a => a.productId === productId)?.product;
      return {
        productId,
        productName: product?.name || 'Unknown',
        adjustmentCount: count,
      };
    })
    .sort((a, b) => b.adjustmentCount - a.adjustmentCount);

  return {
    totalProducts,
    productsAdjusted,
    adjustmentsCount,
    accuracyRate: totalProducts > 0
      ? ((totalProducts - productsAdjusted) / totalProducts) * 100
      : 100,
    avgAdjustmentsPerProduct: productsAdjusted > 0
      ? adjustmentsCount / productsAdjusted
      : 0,
    frequentlyAdjusted,
  };
}

/**
 * Get waste trends over time (daily)
 */
export async function getWasteTrends(days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const movements = await db.stockMovement.findMany({
    where: {
      source: 'MANUAL',
      movementType: 'ADJUSTMENT',
      createdAt: {
        gte: startDate,
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  // Group by date
  const trendsByDate = new Map<string, {
    date: string;
    lossCount: number;
    lossValue: number;
    gainCount: number;
    gainValue: number;
  }>();

  movements.forEach(m => {
    const dateKey = m.createdAt.toISOString().split('T')[0];
    const isLoss = m.description?.includes('decreased');

    const existing = trendsByDate.get(dateKey);
    if (existing) {
      if (isLoss) {
        existing.lossCount += 1;
        existing.lossValue += m.totalValue || 0;
      } else {
        existing.gainCount += 1;
        existing.gainValue += m.totalValue || 0;
      }
    } else {
      trendsByDate.set(dateKey, {
        date: dateKey,
        lossCount: isLoss ? 1 : 0,
        lossValue: isLoss ? (m.totalValue || 0) : 0,
        gainCount: isLoss ? 0 : 1,
        gainValue: isLoss ? 0 : (m.totalValue || 0),
      });
    }
  });

  return Array.from(trendsByDate.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}

/**
 * Get zero-waste byproduct insights
 * Track how chefs are using byproducts instead of throwing them away
 */
export async function getByproductInsights(days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get all productions in this period with their ingredients
  const productions = await db.production.findMany({
    where: {
      productionDate: {
        gte: startDate,
      },
    },
    include: {
      dish: {
        include: {
          recipeIngredients: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                },
              },
            },
          },
        },
      },
      product: {
        include: {
          compositeIngredients: {
            include: {
              baseProduct: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const totalProductions = productions.length;

  // Get all byproducts created in this period
  const byproducts = await db.byproduct.findMany({
    where: {
      createdAt: {
        gte: startDate,
      },
    },
    include: {
      production: {
        include: {
          dish: {
            select: {
              name: true,
            },
          },
          product: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Count productions with byproducts
  const productionsWithByproducts = new Set(byproducts.map(bp => bp.productionId)).size;

  // Count by type
  const byType = {
    COMPOST: byproducts.filter(b => b.byproductType === 'COMPOST').length,
    STOCK: byproducts.filter(b => b.byproductType === 'STOCK').length,
    WASTE: byproducts.filter(b => b.byproductType === 'WASTE').length,
    REUSE: byproducts.filter(b => b.byproductType === 'REUSE').length,
  };

  // Estimate potential byproducts based on ingredients used (for info only, not score)
  let estimatedPotentialByproducts = 0;

  for (const production of productions) {
    const ingredients = production.dish?.recipeIngredients || production.product?.compositeIngredients || [];

    // Categories that typically generate byproducts
    const byproductCategories = [
      'Viandes', 'Volailles', 'Poissons', 'Légumes', 'Fruits',
      'Herbes', 'Aromates', 'Produits frais'
    ];

    for (const ingredient of ingredients) {
      const productData = 'product' in ingredient ? ingredient.product : ingredient.baseProduct;
      const category = productData?.category || '';

      // If ingredient category typically generates byproducts, count it
      if (byproductCategories.some(cat => category.includes(cat))) {
        // Average: assume each ingredient can generate 1-2 byproducts
        estimatedPotentialByproducts += 1.5;
      }
    }
  }

  // Simple tracking rate: % of productions with at least 1 byproduct
  // Goal: Every production should generate at least some byproducts (peels, bones, scraps...)
  const trackingRate = totalProductions > 0
    ? (productionsWithByproducts / totalProductions) * 100
    : 0;

  // Calculate valorization rate (% of non-waste byproducts among tracked)
  const totalByproducts = byproducts.length;
  const nonWasteByproducts = byType.COMPOST + byType.STOCK + byType.REUSE;
  const valorizationRate = totalByproducts > 0
    ? (nonWasteByproducts / totalByproducts) * 100
    : 0;

  // Calculate CO2 impact
  // Convert units to kg and calculate CO2 savings
  let totalCO2Saved = 0;

  const convertToKg = (quantity: number, unit: string): number => {
    const unitUpper = unit.toUpperCase();
    switch (unitUpper) {
      case 'KG':
        return quantity;
      case 'G':
        return quantity / 1000;
      case 'L':
        return quantity; // Approximate 1L ~ 1kg for organic matter
      case 'ML':
      case 'CL':
        return quantity / 1000;
      case 'PC':
      case 'PIECE':
      case 'BUNCH':
      case 'CLOVE':
        // Very conservative estimate: 1 piece/bunch = 0.05kg (50g)
        return quantity * 0.05;
      case 'BOX':
      case 'BAG':
        // Conservative: 1 box/bag = 0.5kg
        return quantity * 0.5;
      case 'PACK':
        return quantity * 0.3;
      default:
        // Unknown unit: very conservative, assume small quantities
        return quantity * 0.02;
    }
  };

  for (const bp of byproducts) {
    if (bp.byproductType !== 'WASTE') {
      const quantityInKg = convertToKg(bp.quantity, bp.unit);

      // Conservative CO2 savings estimates per kg
      // Based on studies: composting vs landfill/incineration
      const co2PerKg = bp.byproductType === 'STOCK'
        ? 0.5  // Stock/reuse: conservative estimate (avoids production + transport)
        : 0.3; // Compost/reuse: saves methane emissions from landfill

      totalCO2Saved += quantityInKg * co2PerKg;
    }
  }

  // Concrete comparisons (more conservative)
  const kmInCar = (totalCO2Saved / 0.12).toFixed(0); // Average car: ~0.12kg CO2/km
  const treesEquivalent = (totalCO2Saved / 22).toFixed(1); // 1 tree absorbs ~22kg CO2/year

  // Final zero-waste score combines both metrics
  // If you don't track byproducts, score is low
  // If you track them but they're all waste, score is low
  // If you track them and valorize them, score is high
  const zeroWasteScore = totalProductions > 0
    ? (trackingRate * 0.5) + (valorizationRate * 0.5)
    : 0;

  // Group by dish/product
  const byDish = new Map<string, {
    dishName: string;
    byproductCount: number;
    byproducts: Array<{
      name: string;
      quantity: number;
      unit: string;
      type: string;
    }>;
  }>();

  byproducts.forEach(bp => {
    const dishName = bp.production?.dish?.name || bp.production?.product?.name || 'Production inconnue';
    const existing = byDish.get(dishName);

    if (existing) {
      existing.byproductCount += 1;
      existing.byproducts.push({
        name: bp.name,
        quantity: bp.quantity,
        unit: bp.unit,
        type: bp.byproductType,
      });
    } else {
      byDish.set(dishName, {
        dishName,
        byproductCount: 1,
        byproducts: [{
          name: bp.name,
          quantity: bp.quantity,
          unit: bp.unit,
          type: bp.byproductType,
        }],
      });
    }
  });

  const topDishesWithByproducts = Array.from(byDish.values())
    .sort((a, b) => b.byproductCount - a.byproductCount)
    .slice(0, 10);

  // Most common byproducts
  const byproductNames = new Map<string, {
    name: string;
    count: number;
    totalQuantity: number;
    unit: string;
    types: Set<string>;
  }>();

  byproducts.forEach(bp => {
    const existing = byproductNames.get(bp.name);
    if (existing) {
      existing.count += 1;
      existing.totalQuantity += bp.quantity;
      existing.types.add(bp.byproductType);
    } else {
      byproductNames.set(bp.name, {
        name: bp.name,
        count: 1,
        totalQuantity: bp.quantity,
        unit: bp.unit,
        types: new Set([bp.byproductType]),
      });
    }
  });

  const topByproducts = Array.from(byproductNames.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(bp => ({
      ...bp,
      types: Array.from(bp.types),
    }));

  return {
    summary: {
      totalByproducts,
      totalProductions,
      productionsWithByproducts,
      estimatedPotentialByproducts: Math.round(estimatedPotentialByproducts),
      byType,
      zeroWasteScore,
      trackingRate,
      valorizationRate,
      nonWasteByproducts,
      wasteByproducts: byType.WASTE,
      co2Impact: {
        totalCO2Saved: parseFloat(totalCO2Saved.toFixed(2)),
        kmInCar: parseInt(kmInCar),
        treesEquivalent: parseFloat(treesEquivalent),
      },
    },
    topDishesWithByproducts,
    topByproducts,
    recentByproducts: byproducts.slice(0, 10).map(bp => ({
      name: bp.name,
      quantity: bp.quantity,
      unit: bp.unit,
      type: bp.byproductType,
      dishName: bp.production?.dish?.name || bp.production?.product?.name || 'Production inconnue',
      date: bp.createdAt,
      notes: bp.notes,
    })),
  };
}
