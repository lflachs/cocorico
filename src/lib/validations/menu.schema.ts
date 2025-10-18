import { z } from 'zod';

/**
 * Pricing Type Enum
 */
export const pricingTypeSchema = z.enum(['PRIX_FIXE', 'CHOICE']);
export type PricingType = z.infer<typeof pricingTypeSchema>;

/**
 * Menu Dish Schema
 * Validates dishes within a menu section
 */
export const menuDishSchema = z.object({
  dishId: z.string().min(1, 'Dish is required'),
  displayOrder: z.number().int().min(0).default(0),
  notes: z.string().optional(),
  priceOverride: z.number().positive().optional(),
});

export type MenuDishInput = z.infer<typeof menuDishSchema>;

/**
 * Menu Dish with ID (for updates)
 */
export const menuDishWithIdSchema = menuDishSchema.extend({
  id: z.string().optional(),
  menuSectionId: z.string().optional(),
});

export type MenuDishWithId = z.infer<typeof menuDishWithIdSchema>;

/**
 * Menu Section Schema
 * Validates sections within a menu
 */
export const menuSectionSchema = z.object({
  name: z.string().min(1, 'Section name is required').max(100, 'Name too long'),
  displayOrder: z.number().int().min(0),
  isRequired: z.boolean().default(true),
  isOptional: z.boolean().default(false),
  dishes: z.array(menuDishSchema).default([]),
});

export type MenuSectionInput = z.infer<typeof menuSectionSchema>;

/**
 * Menu Section with ID (for updates)
 */
export const menuSectionWithIdSchema = menuSectionSchema.extend({
  id: z.string().optional(),
  menuId: z.string().optional(),
  dishes: z.array(menuDishWithIdSchema).default([]),
});

export type MenuSectionWithId = z.infer<typeof menuSectionWithIdSchema>;

/**
 * Menu Create Schema
 * Validates menu creation data
 */
export const createMenuSchema = z.object({
  name: z.string().min(1, 'Menu name is required').max(100, 'Name too long'),
  description: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  isActive: z.boolean().default(true),

  // Pricing fields
  fixedPrice: z.number().positive(),
  pricingType: pricingTypeSchema.default('PRIX_FIXE'),
  minCourses: z.number().int().positive().optional(),
  maxCourses: z.number().int().positive().optional(),

  sections: z.array(menuSectionSchema).optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.endDate >= data.startDate;
    }
    return true;
  },
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
).refine(
  (data) => {
    // If pricing type is PRIX_FIXE, fixedPrice is required
    if (data.pricingType === 'PRIX_FIXE' && !data.fixedPrice) {
      return false;
    }
    return true;
  },
  {
    message: 'Fixed price is required for PRIX_FIXE menus',
    path: ['fixedPrice'],
  }
).refine(
  (data) => {
    // If pricing type is CHOICE, minCourses and maxCourses are required
    if (data.pricingType === 'CHOICE' && (!data.minCourses || !data.maxCourses)) {
      return false;
    }
    return true;
  },
  {
    message: 'Min and max courses are required for CHOICE menus',
    path: ['minCourses'],
  }
).refine(
  (data) => {
    // If both minCourses and maxCourses are set, minCourses <= maxCourses
    if (data.minCourses && data.maxCourses && data.minCourses > data.maxCourses) {
      return false;
    }
    return true;
  },
  {
    message: 'Min courses must be less than or equal to max courses',
    path: ['maxCourses'],
  }
);

export type CreateMenuInput = z.infer<typeof createMenuSchema>;

/**
 * Menu Update Schema
 * Validates menu update data
 */
export const updateMenuSchema = z.object({
  name: z.string().min(1, 'Menu name is required').max(100, 'Name too long').optional(),
  description: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  isActive: z.boolean().optional(),

  // Pricing fields
  fixedPrice: z.number().positive().optional().nullable(),
  pricingType: pricingTypeSchema.optional(),
  minCourses: z.number().int().positive().optional().nullable(),
  maxCourses: z.number().int().positive().optional().nullable(),

  sections: z.array(menuSectionWithIdSchema).optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.endDate >= data.startDate;
    }
    return true;
  },
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
).refine(
  (data) => {
    // If pricing type is PRIX_FIXE, fixedPrice is required
    if (data.pricingType === 'PRIX_FIXE' && !data.fixedPrice) {
      return false;
    }
    return true;
  },
  {
    message: 'Fixed price is required for PRIX_FIXE menus',
    path: ['fixedPrice'],
  }
).refine(
  (data) => {
    // If pricing type is CHOICE, minCourses and maxCourses are required
    if (data.pricingType === 'CHOICE' && (!data.minCourses || !data.maxCourses)) {
      return false;
    }
    return true;
  },
  {
    message: 'Min and max courses are required for CHOICE menus',
    path: ['minCourses'],
  }
).refine(
  (data) => {
    // If both minCourses and maxCourses are set, minCourses <= maxCourses
    if (data.minCourses && data.maxCourses && data.minCourses > data.maxCourses) {
      return false;
    }
    return true;
  },
  {
    message: 'Min courses must be less than or equal to max courses',
    path: ['maxCourses'],
  }
);

export type UpdateMenuInput = z.infer<typeof updateMenuSchema>;

/**
 * Menu Query Schema
 * Validates query parameters for listing menus
 */
export const menuQuerySchema = z.object({
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  includeSections: z.boolean().default(false),
  includeDishes: z.boolean().default(false),
  currentOnly: z.boolean().default(false), // Only menus active in current date range
});

export type MenuQuery = z.infer<typeof menuQuerySchema>;
