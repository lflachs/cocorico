import { cache } from 'react';
import { db } from '@/lib/db/client';
import type { Product } from '@prisma/client';

/**
 * Product Queries
 * Data fetching functions for Server Components
 * Uses React cache() for request memoization
 */

export const getProducts = cache(async (): Promise<Product[]> => {
  return await db.product.findMany({
    orderBy: { name: 'asc' },
  });
});

export const getProductById = cache(async (id: string): Promise<Product | null> => {
  return await db.product.findUnique({
    where: { id },
    include: {
      movements: {
        orderBy: { movementDate: 'desc' },
        take: 10,
      },
      recipeIngredients: {
        include: {
          dish: true,
        },
      },
    },
  });
});

export const getLowStockProducts = cache(async (): Promise<Product[]> => {
  return await db.product.findMany({
    where: {
      trackable: true,
      parLevel: { not: null },
    },
  }).then((products) => products.filter((p) => p.parLevel && p.quantity < p.parLevel));
});

export const getProductsByCategory = cache(async (category: string): Promise<Product[]> => {
  return await db.product.findMany({
    where: { category },
    orderBy: { name: 'asc' },
  });
});

/**
 * Composite Product Queries
 */

export const getCompositeProducts = cache(async () => {
  return await db.product.findMany({
    where: { isComposite: true },
    include: {
      compositeIngredients: {
        include: {
          baseProduct: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });
});

export const getCompositeProductById = cache(async (id: string) => {
  return await db.product.findUnique({
    where: { id, isComposite: true },
    include: {
      compositeIngredients: {
        include: {
          baseProduct: true,
        },
      },
    },
  });
});

export const getBaseProducts = cache(async (): Promise<Product[]> => {
  return await db.product.findMany({
    where: { isComposite: false },
    orderBy: { name: 'asc' },
  });
});
