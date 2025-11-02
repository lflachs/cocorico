import { db } from '@/lib/db/client';
import {
  type CreateSaleInput,
  type UpdateSaleInput,
  type SaleQuery,
  type SalesSummaryQuery,
  type TodaysSalesQuery,
} from '@/lib/validations/sale.schema';
import type { Sale, Dish, User } from '@prisma/client';

/**
 * Sale with Dish and User
 */
export type SaleWithDetails = Sale & {
  dish?: Dish;
  user?: User | null;
};

/**
 * Sales Summary by Dish
 */
export type SalesSummary = {
  dishId: string;
  dishName: string;
  totalQuantity: number;
  salesCount: number;
};

/**
 * Get all sales with optional filtering
 */
export async function getSales(query: SaleQuery = {}): Promise<SaleWithDetails[]> {
  const { dishId, userId, startDate, endDate, includeDish, includeUser } = query;

  const sales = await db.sale.findMany({
    where: {
      ...(dishId && { dishId }),
      ...(userId && { userId }),
      ...(startDate || endDate
        ? {
            saleDate: {
              ...(startDate && { gte: startDate }),
              ...(endDate && { lte: endDate }),
            },
          }
        : {}),
    },
    include: {
      dish: includeDish,
      user: includeUser,
    },
    orderBy: { saleDate: 'desc' },
  });

  return sales as SaleWithDetails[];
}

/**
 * Get sale by ID
 */
export async function getSaleById(id: string): Promise<SaleWithDetails | null> {
  const sale = await db.sale.findUnique({
    where: { id },
    include: {
      dish: true,
      user: true,
    },
  });

  return sale as SaleWithDetails | null;
}

/**
 * Create a new sale and deplete inventory
 * Smart detection: uses composite ingredients when available, falls back to raw ingredients
 */
export async function createSale(data: CreateSaleInput): Promise<Sale> {
  const { dishId, quantitySold, saleDate, notes, userId } = data;

  // Get dish with recipe ingredients
  const dish = await db.dish.findUnique({
    where: { id: dishId },
    include: {
      recipeIngredients: {
        include: {
          product: {
            include: {
              compositeIngredients: {
                include: {
                  baseProduct: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!dish) {
    throw new Error('Dish not found');
  }

  if (!dish.isActive) {
    throw new Error('Cannot record sale for inactive dish');
  }

  // SMART FALLBACK SYSTEM: For each ingredient, decide whether to use composite or raw ingredients
  type InventoryDepletion = {
    productId: string;
    productName: string;
    quantity: number;
    unit: string;
    method: 'composite' | 'raw'; // Track which method was used
  };

  const depletions: InventoryDepletion[] = [];
  const insufficientIngredients: string[] = [];

  /**
   * Recursively resolve ingredient depletions
   * Uses composite ingredients when available, falls back to raw ingredients recursively
   */
  async function resolveIngredient(
    productId: string,
    requiredQty: number,
    unit: string
  ): Promise<{ depletions: InventoryDepletion[]; error?: string }> {
    // Fetch the product with its composite ingredients
    const product = await db.product.findUnique({
      where: { id: productId },
      include: {
        compositeIngredients: {
          include: {
            baseProduct: true,
          },
        },
      },
    });

    if (!product) {
      return { depletions: [], error: `Product not found` };
    }

    // CASE 1: Composite product with sufficient stock - use it!
    if (product.isComposite && product.quantity >= requiredQty) {
      return {
        depletions: [
          {
            productId: product.id,
            productName: product.name,
            quantity: requiredQty,
            unit,
            method: 'composite',
          },
        ],
      };
    }

    // CASE 2: Composite product but insufficient stock - recursively fall back to ingredients
    if (product.isComposite && product.quantity < requiredQty) {
      if (!product.compositeIngredients || product.compositeIngredients.length === 0) {
        return {
          depletions: [],
          error: `${product.name} (need ${requiredQty} ${unit}, have ${product.quantity})`,
        };
      }

      // Recursively resolve each composite ingredient
      const recursiveDepletions: InventoryDepletion[] = [];
      const errors: string[] = [];

      for (const compositeIng of product.compositeIngredients) {
        const ingredientRequiredQty = compositeIng.quantity * requiredQty;

        // Recursively resolve this ingredient (might be composite itself!)
        const result = await resolveIngredient(
          compositeIng.baseProduct.id,
          ingredientRequiredQty,
          compositeIng.unit
        );

        if (result.error) {
          errors.push(result.error);
        } else {
          recursiveDepletions.push(...result.depletions);
        }
      }

      if (errors.length > 0) {
        return { depletions: [], error: errors.join(', ') };
      }

      return { depletions: recursiveDepletions };
    }

    // CASE 3: Regular (non-composite) ingredient - use it directly
    if (product.quantity < requiredQty) {
      return {
        depletions: [],
        error: `${product.name} (need ${requiredQty} ${unit}, have ${product.quantity})`,
      };
    }

    return {
      depletions: [
        {
          productId: product.id,
          productName: product.name,
          quantity: requiredQty,
          unit,
          method: 'raw',
        },
      ],
    };
  }

  // Analyze each recipe ingredient
  for (const recipeIng of dish.recipeIngredients) {
    const requiredQty = recipeIng.quantityRequired * quantitySold;

    const result = await resolveIngredient(
      recipeIng.product.id,
      requiredQty,
      recipeIng.unit
    );

    if (result.error) {
      insufficientIngredients.push(result.error);
    } else {
      depletions.push(...result.depletions);
    }
  }

  // Validation: Check if we have enough inventory
  if (insufficientIngredients.length > 0) {
    throw new Error(
      `Insufficient inventory for: ${insufficientIngredients.join(', ')}`
    );
  }

  // Use a transaction to ensure atomicity
  const sale = await db.$transaction(async (tx) => {
    // Deplete inventory based on the smart fallback system
    for (const depletion of depletions) {
      const currentProduct = await tx.product.findUnique({
        where: { id: depletion.productId },
        select: { quantity: true },
      });

      if (!currentProduct) {
        throw new Error(`Product ${depletion.productName} not found`);
      }

      const newBalance = currentProduct.quantity - depletion.quantity;

      await tx.product.update({
        where: { id: depletion.productId },
        data: { quantity: newBalance },
      });

      // Create stock movement for traceability
      await tx.stockMovement.create({
        data: {
          productId: depletion.productId,
          movementType: 'OUT',
          quantity: depletion.quantity,
          balanceAfter: newBalance,
          userId,
          reason: `Sale: ${quantitySold}x ${dish.name}`,
          description:
            depletion.method === 'composite'
              ? `Prepared ${depletion.productName} used`
              : `Raw ingredient used (à la minute)`,
          source: 'SCAN_SALES',
        },
      });
    }

    // Create the sale record
    const createdSale = await tx.sale.create({
      data: {
        dishId,
        quantitySold,
        saleDate,
        notes,
        userId,
      },
      include: {
        dish: true,
        user: true,
      },
    });

    return createdSale;
  });

  return sale;
}

/**
 * Update an existing sale
 * Note: This is tricky as it requires reversing inventory changes
 */
export async function updateSale(id: string, data: UpdateSaleInput): Promise<Sale> {
  const existingSale = await db.sale.findUnique({
    where: { id },
    include: {
      dish: {
        include: {
          recipeIngredients: true,
        },
      },
    },
  });

  if (!existingSale) {
    throw new Error('Sale not found');
  }

  // If quantity changed, we need to adjust inventory
  if (data.quantitySold && data.quantitySold !== existingSale.quantitySold) {
    const quantityDiff = data.quantitySold - existingSale.quantitySold;

    // Use transaction to update inventory
    await db.$transaction(async (tx) => {
      for (const ingredient of existingSale.dish.recipeIngredients) {
        const adjustmentAmount = ingredient.quantityRequired * quantityDiff;

        await tx.product.update({
          where: { id: ingredient.productId },
          data: {
            quantity: {
              decrement: adjustmentAmount,
            },
          },
        });
      }
    });
  }

  // Update the sale
  const sale = await db.sale.update({
    where: { id },
    data,
    include: {
      dish: true,
      user: true,
    },
  });

  return sale;
}

/**
 * Delete a sale and restore inventory
 */
export async function deleteSale(id: string): Promise<void> {
  const sale = await db.sale.findUnique({
    where: { id },
    include: {
      dish: {
        include: {
          recipeIngredients: true,
        },
      },
    },
  });

  if (!sale) {
    throw new Error('Sale not found');
  }

  // Use transaction to restore inventory and delete sale
  await db.$transaction(async (tx) => {
    // Restore inventory for each ingredient
    for (const ingredient of sale.dish.recipeIngredients) {
      const restorationAmount = ingredient.quantityRequired * sale.quantitySold;

      await tx.product.update({
        where: { id: ingredient.productId },
        data: {
          quantity: {
            increment: restorationAmount,
          },
        },
      });
    }

    // Delete the sale
    await tx.sale.delete({
      where: { id },
    });
  });
}

/**
 * Get today's sales
 */
export async function getTodaysSales(query: TodaysSalesQuery = {}): Promise<SaleWithDetails[]> {
  const { includeDish = true, topCount = 5 } = query;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const sales = await db.sale.findMany({
    where: {
      saleDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      dish: includeDish,
    },
    orderBy: { saleDate: 'desc' },
    take: topCount,
  });

  return sales as SaleWithDetails[];
}

/**
 * Get sales summary grouped by dish
 */
export async function getSalesSummary(query: SalesSummaryQuery): Promise<SalesSummary[]> {
  const { startDate, endDate } = query;

  const sales = await db.sale.groupBy({
    by: ['dishId'],
    where: {
      saleDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    _sum: {
      quantitySold: true,
    },
    _count: {
      id: true,
    },
  });

  // Fetch dish names
  const summaries = await Promise.all(
    sales.map(async (sale) => {
      const dish = await db.dish.findUnique({
        where: { id: sale.dishId },
        select: { name: true },
      });

      return {
        dishId: sale.dishId,
        dishName: dish?.name || 'Unknown',
        totalQuantity: sale._sum.quantitySold || 0,
        salesCount: sale._count.id,
      };
    })
  );

  return summaries.sort((a, b) => b.totalQuantity - a.totalQuantity);
}

/**
 * Get top selling dishes for a date range
 */
export async function getTopSellingDishes(
  startDate: Date,
  endDate: Date,
  limit: number = 10
): Promise<SalesSummary[]> {
  const summary = await getSalesSummary({ startDate, endDate, groupBy: 'dish' });
  return summary.slice(0, limit);
}

/**
 * Get total sales for today
 */
export async function getTodaysSalesSummary(): Promise<{
  totalSales: number;
  totalQuantity: number;
  topDishes: SalesSummary[];
}> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const summary = await getSalesSummary({
    startDate: startOfDay,
    endDate: endOfDay,
    groupBy: 'dish',
  });

  const totalSales = summary.reduce((acc, s) => acc + s.salesCount, 0);
  const totalQuantity = summary.reduce((acc, s) => acc + s.totalQuantity, 0);

  return {
    totalSales,
    totalQuantity,
    topDishes: summary, // Return ALL dishes with sales, not just top 5
  };
}
