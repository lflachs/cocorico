'use server';

import { db as prisma } from '@/lib/db/client';
import type { CategoryType } from '@prisma/client';

/**
 * Recipe Category Actions
 * Server actions for managing recipe categories
 */

export async function getRecipeCategoriesAction(categoryType: CategoryType) {
  try {
    const categories = await prisma.recipeCategory.findMany({
      where: {
        categoryType,
        parentId: null, // Only get top-level categories
      },
      include: {
        _count: {
          select: {
            dishes: categoryType === 'DISH',
            products: categoryType === 'PREPARED_INGREDIENT' || categoryType === 'INVENTORY',
          },
        },
        children: {
          include: {
            _count: {
              select: {
                dishes: categoryType === 'DISH',
                products: categoryType === 'PREPARED_INGREDIENT' || categoryType === 'INVENTORY',
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });

    return { success: true, data: categories };
  } catch (error) {
    console.error('Error fetching recipe categories:', error);
    return { success: false, error: 'Failed to fetch categories' };
  }
}

export async function createRecipeCategoryAction(data: {
  name: string;
  icon?: string;
  color?: string;
  categoryType: CategoryType;
  parentId?: string;
}) {
  try {
    // Get the highest order number for the same parent
    const lastCategory = await prisma.recipeCategory.findFirst({
      where: {
        categoryType: data.categoryType,
        parentId: data.parentId ?? null,
      },
      orderBy: { order: 'desc' },
    });

    const order = (lastCategory?.order ?? 0) + 1;

    const category = await prisma.recipeCategory.create({
      data: {
        name: data.name,
        icon: data.icon,
        color: data.color,
        categoryType: data.categoryType,
        parentId: data.parentId,
        isPredefined: false,
        order,
      },
    });

    return { success: true, data: category };
  } catch (error) {
    console.error('Error creating category:', error);
    return { success: false, error: 'Failed to create category' };
  }
}

export async function deleteRecipeCategoryAction(categoryId: string) {
  try {
    // Check if it's a predefined category
    const category = await prisma.recipeCategory.findUnique({
      where: { id: categoryId },
    });

    if (category?.isPredefined) {
      return { success: false, error: 'Cannot delete predefined categories' };
    }

    // Delete the category (cascades to children, sets dishes to null)
    await prisma.recipeCategory.delete({
      where: { id: categoryId },
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting category:', error);
    return { success: false, error: 'Failed to delete category' };
  }
}

export async function updateRecipeCategoryAction(
  categoryId: string,
  data: {
    name?: string;
    icon?: string;
    color?: string;
    order?: number;
  }
) {
  try {
    const category = await prisma.recipeCategory.update({
      where: { id: categoryId },
      data,
    });

    return { success: true, data: category };
  } catch (error) {
    console.error('Error updating category:', error);
    return { success: false, error: 'Failed to update category' };
  }
}

export async function moveDishesToCategoryAction(
  dishIds: string[],
  categoryId: string | null
) {
  try {
    await prisma.dish.updateMany({
      where: { id: { in: dishIds } },
      data: { categoryId },
    });

    return { success: true };
  } catch (error) {
    console.error('Error moving dishes:', error);
    return { success: false, error: 'Failed to move dishes' };
  }
}
