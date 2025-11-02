'use server';

import { revalidatePath } from 'next/cache';
import * as productionService from '@/lib/services/production.service';
import { prisma } from '@/lib/db';

export type CreateProductionInput = {
  dishId: string;
  quantity: number;
  userId?: string;
  notes?: string;
};

/**
 * Calculate ingredients needed for production
 */
export async function calculateProductionIngredientsAction(
  dishId: string,
  quantity: number
) {
  try {
    if (quantity <= 0) {
      return {
        success: false,
        error: 'Quantity must be greater than 0',
      };
    }

    const preview = await productionService.calculateProductionIngredients(dishId, quantity);
    return { success: true, data: preview };
  } catch (error) {
    console.error('Error calculating production ingredients:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate ingredients',
    };
  }
}

/**
 * Create a production batch
 */
export async function createProductionAction(input: CreateProductionInput) {
  try {
    if (input.quantity <= 0) {
      return {
        success: false,
        error: 'Quantity must be greater than 0',
      };
    }

    const production = await productionService.createProduction(
      input.dishId,
      input.quantity,
      input.userId,
      input.notes
    );

    revalidatePath('/menu');
    revalidatePath('/inventory');
    revalidatePath('/production');

    return { success: true, data: production };
  } catch (error) {
    console.error('Error creating production:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create production',
    };
  }
}

/**
 * Get all productions
 */
export async function getProductionsAction(limit?: number) {
  try {
    const productions = await productionService.getProductions(limit);
    return { success: true, data: productions };
  } catch (error) {
    console.error('Error fetching productions:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch productions',
    };
  }
}

/**
 * Get production by ID
 */
export async function getProductionByIdAction(id: string) {
  try {
    const production = await productionService.getProductionById(id);
    if (!production) {
      return { success: false, error: 'Production not found' };
    }
    return { success: true, data: production };
  } catch (error) {
    console.error('Error fetching production:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch production',
    };
  }
}

/**
 * Get productions for a specific dish
 */
export async function getProductionsByDishAction(dishId: string) {
  try {
    const productions = await productionService.getProductionsByDish(dishId);
    return { success: true, data: productions };
  } catch (error) {
    console.error('Error fetching dish productions:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch dish productions',
    };
  }
}

/**
 * Delete a production (reverses stock movements)
 */
export async function deleteProductionAction(id: string) {
  try {
    await productionService.deleteProduction(id);
    revalidatePath('/menu');
    revalidatePath('/inventory');
    revalidatePath('/production');
    return { success: true };
  } catch (error) {
    console.error('Error deleting production:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete production',
    };
  }
}

type DependencyItem = {
  id: string;
  name: string;
  type: 'dish' | 'composite';
  quantityNeeded: number;
  unit: string;
  currentStock: number;
  hasStock: boolean;
  dependencies: DependencyItem[];
};

/**
 * Analyze dependencies for selected items and check stock availability
 */
export async function analyzeDependenciesAction(itemIds: string[]) {
  try {
    const dependencies: DependencyItem[] = [];

    // Fetch all items (both dishes and composite products)
    const [dishes, products] = await Promise.all([
      prisma.dish.findMany({
        where: { id: { in: itemIds } },
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
      }),
      prisma.product.findMany({
        where: {
          id: { in: itemIds },
          isComposite: true,
        },
        include: {
          compositeIngredients: {
            include: {
              baseProduct: {
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
      }),
    ]);

    // Helper function to recursively analyze a product's dependencies
    const analyzeDependencies = async (
      productId: string,
      quantityNeeded: number,
      visitedIds: Set<string> = new Set()
    ): Promise<DependencyItem[]> => {
      // Prevent circular dependencies
      if (visitedIds.has(productId)) {
        return [];
      }
      visitedIds.add(productId);

      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          compositeIngredients: {
            include: {
              baseProduct: {
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

      if (!product || !product.isComposite || !product.compositeIngredients) {
        return [];
      }

      const subDependencies: DependencyItem[] = [];

      for (const ingredient of product.compositeIngredients) {
        const baseProduct = ingredient.baseProduct;
        const hasStock = baseProduct.quantity >= ingredient.quantity * quantityNeeded;

        const subDeps = baseProduct.isComposite
          ? await analyzeDependencies(baseProduct.id, ingredient.quantity * quantityNeeded, new Set(visitedIds))
          : [];

        subDependencies.push({
          id: baseProduct.id,
          name: baseProduct.name,
          type: baseProduct.isComposite ? 'composite' : 'dish',
          quantityNeeded: ingredient.quantity * quantityNeeded,
          unit: ingredient.unit,
          currentStock: baseProduct.quantity,
          hasStock,
          dependencies: subDeps,
        });
      }

      return subDependencies;
    };

    // Process dishes
    for (const dish of dishes) {
      const dishDeps: DependencyItem[] = [];

      if (dish.recipeIngredients) {
        for (const ingredient of dish.recipeIngredients) {
          const product = ingredient.product;

          // Only analyze composite products
          if (product.isComposite) {
            const hasStock = product.quantity >= ingredient.quantityRequired;
            const subDeps = await analyzeDependencies(product.id, ingredient.quantityRequired);

            dishDeps.push({
              id: product.id,
              name: product.name,
              type: 'composite',
              quantityNeeded: ingredient.quantityRequired,
              unit: ingredient.unit,
              currentStock: product.quantity,
              hasStock,
              dependencies: subDeps,
            });
          }
        }
      }

      // Only add to dependencies if there are composite ingredients
      if (dishDeps.length > 0) {
        dependencies.push({
          id: dish.id,
          name: dish.name,
          type: 'dish',
          quantityNeeded: 1,
          unit: 'portion',
          currentStock: 0,
          hasStock: true,
          dependencies: dishDeps,
        });
      }
    }

    // Process composite products
    for (const product of products) {
      const subDeps = await analyzeDependencies(product.id, 1);

      dependencies.push({
        id: product.id,
        name: product.name,
        type: 'composite',
        quantityNeeded: 1,
        unit: product.unit,
        currentStock: product.quantity,
        hasStock: product.quantity >= 1,
        dependencies: subDeps,
      });
    }

    return { success: true, data: dependencies };
  } catch (error) {
    console.error('Error analyzing dependencies:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze dependencies',
    };
  }
}
