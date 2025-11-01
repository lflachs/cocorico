'use server';

import { db as prisma } from '@/lib/db/client';
import { revalidatePath } from 'next/cache';

export type ActionResult<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function getDishFoldersAction(): Promise<ActionResult> {
  try {
    const folders = await prisma.dishFolder.findMany({
      include: {
        _count: {
          select: { dishes: true },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });

    return { success: true, data: folders };
  } catch (error) {
    console.error('Error fetching dish folders:', error);
    return { success: false, error: 'Failed to fetch folders' };
  }
}

export async function createDishFolderAction(name: string, color?: string): Promise<ActionResult> {
  try {
    // Get the highest order number
    const maxOrder = await prisma.dishFolder.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const folder = await prisma.dishFolder.create({
      data: {
        name,
        color,
        order: (maxOrder?.order ?? -1) + 1,
      },
    });

    revalidatePath('/menu');
    return { success: true, data: folder };
  } catch (error) {
    console.error('Error creating dish folder:', error);
    return { success: false, error: 'Failed to create folder' };
  }
}

export async function updateDishFolderAction(
  id: string,
  data: { name?: string; color?: string; order?: number }
): Promise<ActionResult> {
  try {
    const folder = await prisma.dishFolder.update({
      where: { id },
      data,
    });

    revalidatePath('/menu');
    return { success: true, data: folder };
  } catch (error) {
    console.error('Error updating dish folder:', error);
    return { success: false, error: 'Failed to update folder' };
  }
}

export async function deleteDishFolderAction(id: string): Promise<ActionResult> {
  try {
    // Dishes will be set to null (onDelete: SetNull)
    await prisma.dishFolder.delete({
      where: { id },
    });

    revalidatePath('/menu');
    return { success: true };
  } catch (error) {
    console.error('Error deleting dish folder:', error);
    return { success: false, error: 'Failed to delete folder' };
  }
}

export async function moveDishesToFolderAction(
  dishIds: string[],
  folderId: string | null
): Promise<ActionResult> {
  try {
    await prisma.dish.updateMany({
      where: {
        id: { in: dishIds },
      },
      data: {
        folderId,
      },
    });

    revalidatePath('/menu');
    return { success: true };
  } catch (error) {
    console.error('Error moving dishes to folder:', error);
    return { success: false, error: 'Failed to move dishes' };
  }
}
