'use server';

import { revalidatePath } from 'next/cache';
import * as menuService from '@/lib/services/menu.service';
import {
  createMenuSchema,
  updateMenuSchema,
  type CreateMenuInput,
  type UpdateMenuInput,
  type MenuQuery,
} from '@/lib/validations/menu.schema';

/**
 * Get all menus
 */
export async function getMenusAction(query?: MenuQuery) {
  try {
    const menus = await menuService.getMenus(query);
    return { success: true, data: menus };
  } catch (error) {
    console.error('Error fetching menus:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch menus',
    };
  }
}

/**
 * Get menu by ID
 */
export async function getMenuByIdAction(id: string) {
  try {
    const menu = await menuService.getMenuById(id);
    if (!menu) {
      return { success: false, error: 'Menu not found' };
    }
    return { success: true, data: menu };
  } catch (error) {
    console.error('Error fetching menu:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch menu',
    };
  }
}

/**
 * Create a new menu
 */
export async function createMenuAction(input: CreateMenuInput) {
  try {
    const validatedData = createMenuSchema.parse(input);
    const menu = await menuService.createMenu(validatedData);
    revalidatePath('/menu');
    return { success: true, data: menu };
  } catch (error) {
    console.error('Error creating menu:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create menu',
    };
  }
}

/**
 * Update a menu
 */
export async function updateMenuAction(id: string, input: UpdateMenuInput) {
  try {
    const validatedData = updateMenuSchema.parse(input);
    const menu = await menuService.updateMenu(id, validatedData);
    revalidatePath('/menu');
    revalidatePath(`/menu/${id}`);
    return { success: true, data: menu };
  } catch (error) {
    console.error('Error updating menu:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update menu',
    };
  }
}

/**
 * Delete a menu
 */
export async function deleteMenuAction(id: string) {
  try {
    await menuService.deleteMenu(id);
    revalidatePath('/menu');
    return { success: true };
  } catch (error) {
    console.error('Error deleting menu:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete menu',
    };
  }
}

/**
 * Add a dish to a menu section
 */
export async function addDishToSectionAction(
  menuSectionId: string,
  dishId: string,
  displayOrder?: number,
  notes?: string,
  priceOverride?: number
) {
  try {
    const menuDish = await menuService.addDishToSection(
      menuSectionId,
      dishId,
      displayOrder,
      notes,
      priceOverride
    );
    revalidatePath('/menu');
    return { success: true, data: menuDish };
  } catch (error) {
    console.error('Error adding dish to section:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add dish',
    };
  }
}

/**
 * Remove a dish from a menu section
 */
export async function removeDishFromSectionAction(menuDishId: string) {
  try {
    await menuService.removeDishFromSection(menuDishId);
    revalidatePath('/menu');
    return { success: true };
  } catch (error) {
    console.error('Error removing dish from section:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove dish',
    };
  }
}

/**
 * Reorder dishes in a section
 */
export async function reorderDishesAction(
  menuSectionId: string,
  dishOrders: { id: string; displayOrder: number }[]
) {
  try {
    await menuService.reorderDishes(menuSectionId, dishOrders);
    revalidatePath('/menu');
    return { success: true };
  } catch (error) {
    console.error('Error reordering dishes:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reorder dishes',
    };
  }
}

/**
 * Get active menus for today
 */
export async function getActiveMenusAction() {
  try {
    const menus = await menuService.getActiveMenusForDate(new Date());
    return { success: true, data: menus };
  } catch (error) {
    console.error('Error fetching active menus:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch active menus',
    };
  }
}

/**
 * Import a scanned menu
 * Creates new dishes as needed and creates the menu with sections
 */
export async function importScannedMenuAction(scannedData: {
  menuName: string;
  menuDescription: string | null;
  pricingType: 'PRIX_FIXE' | 'CHOICE';
  fixedPrice: number | null;
  minCourses: number | null;
  maxCourses: number | null;
  sections: Array<{
    name: string;
    dishes: Array<{
      name: string;
      description: string | null;
      price: number | null;
    }>;
  }>;
}) {
  try {
    const { createDish } = await import('@/lib/services/dish.service');
    const { getDishes } = await import('@/lib/services/dish.service');

    // Get all existing dishes to check for matches
    const existingDishes = await getDishes({ isActive: true });

    // Process each section and create dishes if needed
    const sectionsWithDishIds = await Promise.all(
      scannedData.sections.map(async (section, sectionIndex) => {
        const dishesWithIds = await Promise.all(
          section.dishes.map(async (scannedDish, dishIndex) => {
            // Try to find existing dish by exact name match
            const existingDish = existingDishes.find(
              (d) => d.name.toLowerCase() === scannedDish.name.toLowerCase()
            );

            if (existingDish) {
              // Use existing dish
              return {
                dishId: existingDish.id,
                displayOrder: dishIndex,
                notes: null,
                priceOverride: scannedDish.price,
              };
            } else {
              // Create new dish
              const newDish = await createDish({
                name: scannedDish.name,
                description: scannedDish.description || undefined,
                sellingPrice: scannedDish.price || undefined,
                isActive: true,
              });

              return {
                dishId: newDish.id,
                displayOrder: dishIndex,
                notes: null,
                priceOverride: null,
              };
            }
          })
        );

        return {
          name: section.name,
          displayOrder: sectionIndex + 1,
          dishes: dishesWithIds,
        };
      })
    );

    // Create the menu with sections and dishes
    const menuInput: CreateMenuInput = {
      name: scannedData.menuName,
      description: scannedData.menuDescription || undefined,
      isActive: true,
      pricingType: scannedData.pricingType,
      fixedPrice: scannedData.fixedPrice || undefined,
      minCourses: scannedData.minCourses || undefined,
      maxCourses: scannedData.maxCourses || undefined,
      sections: sectionsWithDishIds,
    };

    const menu = await menuService.createMenu(menuInput);
    revalidatePath('/menu');
    revalidatePath(`/menu/${menu.id}`);

    return {
      success: true,
      data: {
        menu,
        createdDishesCount: sectionsWithDishIds.reduce(
          (count, section) => count + section.dishes.length,
          0
        ),
      },
    };
  } catch (error) {
    console.error('Error importing scanned menu:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to import menu',
    };
  }
}
