'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { productSchema } from '@/lib/validations/product.schema';
import { createProduct, updateProduct, deleteProduct, getAllProducts } from '@/lib/services/product.service';
import type { Product } from '@prisma/client';

/**
 * Product Server Actions
 * Handle form submissions and mutations from Client Components
 */

type ActionResult<T = Product> = {
  success: boolean;
  error?: string;
  data?: T;
};

export async function createProductAction(formData: FormData): Promise<ActionResult> {
  try {
    const category = formData.get('category');
    const unitPrice = formData.get('unitPrice');
    const parLevel = formData.get('parLevel');

    const rawData = {
      name: formData.get('name') as string,
      quantity: Number(formData.get('quantity')),
      unit: formData.get('unit') as 'KG' | 'L' | 'PC',
      unitPrice: unitPrice ? Number(unitPrice) : undefined,
      category: category ? (category as string) : undefined,
      trackable: formData.get('trackable') === 'true',
      parLevel: parLevel ? Number(parLevel) : undefined,
    };

    const validated = productSchema.parse(rawData);
    const product = await createProduct(validated);

    revalidatePath('/inventory');
    redirect(`/inventory/${product.id}`);
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to create product' };
  }
}

export async function deleteProductAction(productId: string): Promise<ActionResult> {
  try {
    await deleteProduct(productId);
    revalidatePath('/inventory');
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to delete product' };
  }
}

export async function getProductsAction(): Promise<ActionResult<Product[]>> {
  try {
    const products = await getAllProducts();
    return { success: true, data: products };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to fetch products' };
  }
}

/**
 * Create product without redirecting
 * Used when creating products as part of another flow (like adding dishes)
 */
export async function createProductWithoutRedirectAction(formData: FormData): Promise<ActionResult> {
  try {
    const category = formData.get('category');
    const unitPrice = formData.get('unitPrice');
    const parLevel = formData.get('parLevel');

    const rawData = {
      name: formData.get('name') as string,
      quantity: Number(formData.get('quantity')),
      unit: formData.get('unit') as 'KG' | 'L' | 'PC',
      unitPrice: unitPrice ? Number(unitPrice) : undefined,
      category: category ? (category as string) : undefined,
      trackable: formData.get('trackable') === 'true',
      parLevel: parLevel ? Number(parLevel) : undefined,
    };

    const validated = productSchema.parse(rawData);
    const product = await createProduct(validated);

    revalidatePath('/inventory');
    return { success: true, data: product };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to create product' };
  }
}
