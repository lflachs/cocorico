import { z } from 'zod';

/**
 * Product validation schemas
 * Used for creating and updating products
 */

export const productSchema = z.object({
  name: z
    .string()
    .min(1, 'Product name is required')
    .max(255, 'Product name must be less than 255 characters'),
  quantity: z.number().positive('Quantity must be positive'),
  unit: z.enum(['KG', 'L', 'PC'], {
    errorMap: () => ({ message: 'Unit must be KG, L, or PC' }),
  }),
  unitPrice: z.number().positive().optional(),
  totalValue: z.number().positive().optional(),
  category: z.string().max(50).optional(),
  trackable: z.boolean().default(false),
  parLevel: z.number().positive().optional(),
});

export const updateProductSchema = productSchema.partial();

export type ProductInput = z.infer<typeof productSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
