import { db } from '@/lib/db/client';
import type { Production } from '@prisma/client';

/**
 * Production Service
 * Handles production/preparation of dishes in batches
 */

export type ProductionIngredient = {
  productId: string;
  productName: string;
  quantityRequired: number;
  unit: string;
  availableQuantity: number;
  sufficient: boolean;
  isComposite?: boolean;
  compositeIngredients?: {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    available: number;
  }[];
};

export type ProductionPreview = {
  dishId: string;
  dishName: string;
  quantityToProduce: number;
  ingredients: ProductionIngredient[];
  canProduce: boolean;
  missingIngredients: string[];
};

/**
 * Calculate scaled ingredients needed for production
 */
export async function calculateProductionIngredients(
  dishId: string,
  quantity: number
): Promise<ProductionPreview> {
  const dish = await db.dish.findUnique({
    where: { id: dishId },
    include: {
      recipeIngredients: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              unit: true,
              quantity: true,
              isComposite: true,
            },
          },
        },
      },
    },
  });

  if (!dish) {
    throw new Error('Dish not found');
  }

  if (!dish.recipeIngredients || dish.recipeIngredients.length === 0) {
    throw new Error('Dish has no recipe ingredients');
  }

  const ingredients: ProductionIngredient[] = [];
  const missingIngredients: string[] = [];

  for (const recipeIngredient of dish.recipeIngredients) {
    const scaledQuantity = recipeIngredient.quantityRequired * quantity;
    const sufficient = recipeIngredient.product.quantity >= scaledQuantity;

    // If product is composite, fetch its sub-ingredients
    let compositeIngredients = undefined;
    if (recipeIngredient.product.isComposite) {
      const compositeProduct = await db.product.findUnique({
        where: { id: recipeIngredient.product.id },
        include: {
          compositeIngredients: {
            include: {
              baseProduct: {
                select: {
                  id: true,
                  name: true,
                  unit: true,
                  quantity: true,
                },
              },
            },
          },
        },
      });

      if (compositeProduct?.compositeIngredients) {
        compositeIngredients = compositeProduct.compositeIngredients.map((ci) => ({
          id: ci.baseProduct.id,
          name: ci.baseProduct.name,
          quantity: ci.quantity * scaledQuantity, // Scale by the required amount
          unit: ci.unit,
          available: ci.baseProduct.quantity,
        }));
      }
    }

    ingredients.push({
      productId: recipeIngredient.product.id,
      productName: recipeIngredient.product.name,
      quantityRequired: scaledQuantity,
      unit: recipeIngredient.unit,
      availableQuantity: recipeIngredient.product.quantity,
      sufficient,
      isComposite: recipeIngredient.product.isComposite,
      compositeIngredients,
    });

    if (!sufficient) {
      missingIngredients.push(recipeIngredient.product.name);
    }
  }

  return {
    dishId: dish.id,
    dishName: dish.name,
    quantityToProduce: quantity,
    ingredients,
    canProduce: missingIngredients.length === 0,
    missingIngredients,
  };
}

/**
 * Create a production record and update stock
 */
export async function createProduction(
  dishId: string,
  quantity: number,
  userId?: string,
  notes?: string
): Promise<Production> {
  // First, validate we can produce
  const preview = await calculateProductionIngredients(dishId, quantity);

  if (!preview.canProduce) {
    throw new Error(
      `Insufficient ingredients: ${preview.missingIngredients.join(', ')}`
    );
  }

  // Get dish details for product creation
  const dish = await db.dish.findUnique({
    where: { id: dishId },
    select: { name: true },
  });

  if (!dish) {
    throw new Error('Dish not found');
  }

  // Create production record and stock movements in a transaction
  const production = await db.$transaction(async (tx) => {
    // Create production record
    const prod = await tx.production.create({
      data: {
        dishId,
        quantityProduced: quantity,
        userId,
        notes,
        productionDate: new Date(),
      },
    });

    // 1. Deduct ingredients (OUT movements)
    for (const ingredient of preview.ingredients) {
      const product = await tx.product.findUnique({
        where: { id: ingredient.productId },
        select: { quantity: true },
      });

      if (!product) {
        throw new Error(`Product ${ingredient.productName} not found`);
      }

      const newBalance = product.quantity - ingredient.quantityRequired;

      // Update product quantity
      await tx.product.update({
        where: { id: ingredient.productId },
        data: { quantity: newBalance },
      });

      // Create stock movement (OUT)
      await tx.stockMovement.create({
        data: {
          productId: ingredient.productId,
          movementType: 'OUT',
          quantity: ingredient.quantityRequired,
          balanceAfter: newBalance,
          productionId: prod.id,
          userId,
          reason: `Production: ${quantity}x ${preview.dishName}`,
          description: `Ingredient used for production batch`,
          source: 'PRODUCTION',
        },
      });
    }

    // 2. Add finished dish to inventory (IN movement)
    // Find or create a Product for this dish
    let dishProduct = await tx.product.findFirst({
      where: {
        name: dish.name,
        // Mark as prepared/composite product
        category: 'Prepared Dish',
      },
    });

    if (!dishProduct) {
      // Create new product for this dish
      dishProduct = await tx.product.create({
        data: {
          name: dish.name,
          quantity: 0,
          unit: 'PC', // Pieces/portions
          category: 'Prepared Dish',
          trackable: true,
        },
      });
    }

    const newDishBalance = dishProduct.quantity + quantity;

    // Update dish product quantity
    await tx.product.update({
      where: { id: dishProduct.id },
      data: { quantity: newDishBalance },
    });

    // Create stock movement (IN) for finished dish
    await tx.stockMovement.create({
      data: {
        productId: dishProduct.id,
        movementType: 'IN',
        quantity: quantity,
        balanceAfter: newDishBalance,
        productionId: prod.id,
        userId,
        reason: `Production completed: ${quantity}x ${dish.name}`,
        description: `Finished dish added to inventory`,
        source: 'PRODUCTION',
      },
    });

    return prod;
  });

  return production;
}

/**
 * Get all productions with related data
 */
export async function getProductions(limit?: number) {
  return await db.production.findMany({
    include: {
      dish: {
        select: {
          id: true,
          name: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      stockMovements: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              unit: true,
            },
          },
        },
      },
    },
    orderBy: {
      productionDate: 'desc',
    },
    take: limit,
  });
}

/**
 * Get production by ID
 */
export async function getProductionById(id: string) {
  return await db.production.findUnique({
    where: { id },
    include: {
      dish: {
        select: {
          id: true,
          name: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      stockMovements: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              unit: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Get productions for a specific dish
 */
export async function getProductionsByDish(dishId: string) {
  return await db.production.findMany({
    where: { dishId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      stockMovements: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              unit: true,
            },
          },
        },
      },
    },
    orderBy: {
      productionDate: 'desc',
    },
  });
}

/**
 * Delete a production record (reverses stock movements)
 */
export async function deleteProduction(id: string): Promise<void> {
  await db.$transaction(async (tx) => {
    // Get the production with its stock movements
    const production = await tx.production.findUnique({
      where: { id },
      include: {
        stockMovements: true,
      },
    });

    if (!production) {
      throw new Error('Production not found');
    }

    // Reverse the stock movements (add ingredients back)
    for (const movement of production.stockMovements) {
      const product = await tx.product.findUnique({
        where: { id: movement.productId },
        select: { quantity: true },
      });

      if (!product) continue;

      const newBalance = product.quantity + movement.quantity;

      // Update product quantity
      await tx.product.update({
        where: { id: movement.productId },
        data: { quantity: newBalance },
      });

      // Create reversal stock movement (IN)
      await tx.stockMovement.create({
        data: {
          productId: movement.productId,
          movementType: 'IN',
          quantity: movement.quantity,
          balanceAfter: newBalance,
          userId: movement.userId,
          reason: `Production reversal: ${id.slice(0, 8)}`,
          description: 'Production batch cancelled/reversed',
          source: 'SYSTEM_ADJUSTMENT',
        },
      });
    }

    // Delete the production (stock movements will cascade delete)
    await tx.production.delete({
      where: { id },
    });
  });
}
