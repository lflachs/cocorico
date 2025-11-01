'use server';

import { revalidatePath } from 'next/cache';
import * as productionService from '@/lib/services/production.service';

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
