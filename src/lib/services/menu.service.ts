import { db } from '@/lib/db/client';
import {
  type CreateMenuInput,
  type UpdateMenuInput,
  type MenuQuery,
} from '@/lib/validations/menu.schema';
import type { Menu, MenuSection, MenuDish, Dish } from '@prisma/client';

/**
 * Menu with Sections and Dishes
 */
export type MenuWithSections = Menu & {
  sections: (MenuSection & {
    dishes: (MenuDish & {
      dish: Dish;
    })[];
  })[];
};

/**
 * Get all menus with optional filtering
 */
export async function getMenus(query: MenuQuery = {}, restaurantId?: string): Promise<MenuWithSections[]> {
  const { isActive, search, includeSections, includeDishes, currentOnly } = query;

  const now = new Date();

  const menus = await db.menu.findMany({
    where: {
      ...(restaurantId && { restaurantId }),
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(currentOnly && {
        OR: [
          // No date range specified
          { AND: [{ startDate: null }, { endDate: null }] },
          // Current date is within range
          {
            AND: [
              { startDate: { lte: now } },
              { endDate: { gte: now } },
            ],
          },
          // Only start date, and it's in the past
          {
            AND: [
              { startDate: { lte: now } },
              { endDate: null },
            ],
          },
          // Only end date, and it's in the future
          {
            AND: [
              { startDate: null },
              { endDate: { gte: now } },
            ],
          },
        ],
      }),
    },
    include: {
      sections: includeSections || includeDishes
        ? {
            include: {
              dishes: includeDishes
                ? {
                    include: {
                      dish: true,
                    },
                    orderBy: { displayOrder: 'asc' },
                  }
                : false,
            },
            orderBy: { displayOrder: 'asc' },
          }
        : false,
    },
    orderBy: { name: 'asc' },
  });

  return menus as MenuWithSections[];
}

/**
 * Get menu by ID
 */
export async function getMenuById(id: string, restaurantId?: string): Promise<MenuWithSections | null> {
  const menu = await db.menu.findUnique({
    where: { id },
    include: {
      sections: {
        include: {
          dishes: {
            include: {
              dish: {
                include: {
                  recipeIngredients: {
                    include: {
                      product: true,
                    },
                  },
                },
              },
            },
            orderBy: { displayOrder: 'asc' },
          },
        },
        orderBy: { displayOrder: 'asc' },
      },
    },
  });

  // Verify menu belongs to restaurant if restaurantId provided
  if (menu && restaurantId && menu.restaurantId !== restaurantId) {
    return null;
  }

  return menu as MenuWithSections | null;
}

/**
 * Create a new menu
 * Automatically creates 3 default sections: Appetizers, Main Course, Dessert
 */
export async function createMenu(data: CreateMenuInput, restaurantId?: string): Promise<Menu> {
  // Get restaurant ID if not provided
  if (!restaurantId) {
    const { getSelectedRestaurantId } = await import('@/lib/actions/restaurant.actions');
    restaurantId = await getSelectedRestaurantId();
    if (!restaurantId) {
      throw new Error('No restaurant selected');
    }
  }

  const { sections, ...menuData } = data;

  // Default sections if none provided
  const defaultSections = [
    { name: 'Appetizers', displayOrder: 1, dishes: [] },
    { name: 'Main Course', displayOrder: 2, dishes: [] },
    { name: 'Dessert', displayOrder: 3, dishes: [] },
  ];

  const sectionsToCreate = sections && sections.length > 0 ? sections : defaultSections;

  const menu = await db.menu.create({
    data: {
      ...menuData,
      restaurantId,
      sections: {
        create: sectionsToCreate.map((section, sectionIndex) => ({
          restaurantId,
          name: section.name,
          displayOrder: section.displayOrder !== undefined ? section.displayOrder : sectionIndex + 1,
          isRequired: section.isRequired !== undefined ? section.isRequired : true,
          isOptional: section.isOptional !== undefined ? section.isOptional : false,
          dishes: section.dishes
            ? {
                create: section.dishes.map((dish, dishIndex) => ({
                  dishId: dish.dishId,
                  displayOrder: dish.displayOrder || dishIndex,
                  notes: dish.notes,
                  priceOverride: dish.priceOverride,
                })),
              }
            : undefined,
        })),
      },
    },
    include: {
      sections: {
        include: {
          dishes: {
            include: {
              dish: true,
            },
          },
        },
      },
    },
  });

  return menu;
}

/**
 * Update an existing menu
 */
export async function updateMenu(id: string, data: UpdateMenuInput): Promise<Menu> {
  const { sections, ...menuData } = data;

  // If sections are provided, replace all existing ones
  if (sections) {
    // Get the menu's restaurantId
    const menu = await db.menu.findUnique({
      where: { id },
      select: { restaurantId: true },
    });

    if (!menu) {
      throw new Error('Menu not found');
    }

    // Delete existing sections and their dishes (cascade should handle dishes)
    await db.menuSection.deleteMany({
      where: { menuId: id },
    });

    // Create new sections
    await db.menuSection.createMany({
      data: sections.map((section) => ({
        restaurantId: menu.restaurantId,
        menuId: id,
        name: section.name,
        displayOrder: section.displayOrder,
        isRequired: section.isRequired !== undefined ? section.isRequired : true,
        isOptional: section.isOptional !== undefined ? section.isOptional : false,
      })),
      skipDuplicates: true,
    });

    // Get the created sections
    const createdSections = await db.menuSection.findMany({
      where: { menuId: id },
      orderBy: { displayOrder: 'asc' },
    });

    // Create menu dishes for each section
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const createdSection = createdSections[i];

      if (section.dishes && section.dishes.length > 0) {
        await db.menuDish.createMany({
          data: section.dishes.map((dish) => ({
            menuSectionId: createdSection.id,
            dishId: dish.dishId,
            displayOrder: dish.displayOrder || 0,
            notes: dish.notes,
            priceOverride: dish.priceOverride,
          })),
        });
      }
    }
  }

  // Update the menu
  const menu = await db.menu.update({
    where: { id },
    data: menuData,
    include: {
      sections: {
        include: {
          dishes: {
            include: {
              dish: true,
            },
          },
        },
      },
    },
  });

  return menu;
}

/**
 * Delete a menu
 */
export async function deleteMenu(id: string): Promise<void> {
  // Cascade delete will handle sections and menu dishes
  await db.menu.delete({
    where: { id },
  });
}

/**
 * Add a dish to a menu section
 */
export async function addDishToSection(
  menuSectionId: string,
  dishId: string,
  displayOrder?: number,
  notes?: string,
  priceOverride?: number
): Promise<MenuDish> {
  // Get the max display order if not provided
  if (displayOrder === undefined) {
    const maxOrder = await db.menuDish.aggregate({
      where: { menuSectionId },
      _max: { displayOrder: true },
    });
    displayOrder = (maxOrder._max.displayOrder || 0) + 1;
  }

  const menuDish = await db.menuDish.create({
    data: {
      menuSectionId,
      dishId,
      displayOrder,
      notes,
      priceOverride,
    },
    include: {
      dish: true,
    },
  });

  return menuDish;
}

/**
 * Remove a dish from a menu section
 */
export async function removeDishFromSection(menuDishId: string): Promise<void> {
  await db.menuDish.delete({
    where: { id: menuDishId },
  });
}

/**
 * Reorder dishes in a section
 */
export async function reorderDishes(
  menuSectionId: string,
  dishOrders: { id: string; displayOrder: number }[]
): Promise<void> {
  // Update each dish's display order
  await Promise.all(
    dishOrders.map((order) =>
      db.menuDish.update({
        where: { id: order.id },
        data: { displayOrder: order.displayOrder },
      })
    )
  );
}

/**
 * Get active menus for a specific date
 */
export async function getActiveMenusForDate(date: Date): Promise<MenuWithSections[]> {
  return getMenus({
    isActive: true,
    currentOnly: true,
    includeSections: true,
    includeDishes: true,
  });
}

/**
 * Get today's daily menu (Menu du jour)
 */
export async function getTodayDailyMenu(restaurantId?: string): Promise<MenuWithSections | null> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const menus = await db.menu.findMany({
    where: {
      ...(restaurantId && { restaurantId }),
      menuType: 'DAILY',
      isActive: true,
      OR: [
        // No date range specified
        { AND: [{ startDate: null }, { endDate: null }] },
        // Current date is within range
        {
          AND: [
            { startDate: { lte: today } },
            { endDate: { gte: today } },
          ],
        },
        // Only start date, and it's in the past
        {
          AND: [
            { startDate: { lte: today } },
            { endDate: null },
          ],
        },
        // Only end date, and it's in the future
        {
          AND: [
            { startDate: null },
            { endDate: { gte: today } },
          ],
        },
      ],
    },
    include: {
      sections: {
        include: {
          dishes: {
            include: {
              dish: true,
            },
            orderBy: { displayOrder: 'asc' },
          },
        },
        orderBy: { displayOrder: 'asc' },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: 1,
  });

  return menus[0] || null;
}

/**
 * Set today's daily menu
 * Creates or updates the DAILY menu type with selected dishes
 */
export async function setTodayDailyMenu(
  appetizerId: string,
  mainId: string,
  dessertId: string,
  restaurantId?: string
): Promise<Menu> {
  // Get restaurant ID if not provided
  if (!restaurantId) {
    const { getSelectedRestaurantId } = await import('@/lib/actions/restaurant.actions');
    restaurantId = await getSelectedRestaurantId();
    if (!restaurantId) {
      throw new Error('No restaurant selected');
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if a daily menu already exists for today
  const existingMenu = await getTodayDailyMenu(restaurantId);

  if (existingMenu) {
    // Update existing menu
    // First, delete all existing menu dishes
    await db.menuDish.deleteMany({
      where: {
        menuSectionId: {
          in: existingMenu.sections.map((s) => s.id),
        },
      },
    });

    // Delete existing sections
    await db.menuSection.deleteMany({
      where: { menuId: existingMenu.id },
    });

    // Create new sections with dishes
    await db.menuSection.create({
      data: {
        restaurantId,
        menuId: existingMenu.id,
        name: 'Entrée',
        displayOrder: 1,
        dishes: {
          create: {
            dishId: appetizerId,
            displayOrder: 0,
          },
        },
      },
    });

    await db.menuSection.create({
      data: {
        restaurantId,
        menuId: existingMenu.id,
        name: 'Plat',
        displayOrder: 2,
        dishes: {
          create: {
            dishId: mainId,
            displayOrder: 0,
          },
        },
      },
    });

    await db.menuSection.create({
      data: {
        restaurantId,
        menuId: existingMenu.id,
        name: 'Dessert',
        displayOrder: 3,
        dishes: {
          create: {
            dishId: dessertId,
            displayOrder: 0,
          },
        },
      },
    });

    // Update the menu's updatedAt
    const updatedMenu = await db.menu.update({
      where: { id: existingMenu.id },
      data: { updatedAt: new Date() },
    });

    return updatedMenu;
  } else {
    // Create new daily menu
    const menu = await db.menu.create({
      data: {
        restaurantId,
        name: 'Menu du jour',
        description: 'Menu quotidien',
        menuType: 'DAILY',
        isActive: true,
        pricingType: 'PRIX_FIXE',
        sections: {
          create: [
            {
              restaurantId,
              name: 'Entrée',
              displayOrder: 1,
              dishes: {
                create: {
                  dishId: appetizerId,
                  displayOrder: 0,
                },
              },
            },
            {
              restaurantId,
              name: 'Plat',
              displayOrder: 2,
              dishes: {
                create: {
                  dishId: mainId,
                  displayOrder: 0,
                },
              },
            },
            {
              restaurantId,
              name: 'Dessert',
              displayOrder: 3,
              dishes: {
                create: {
                  dishId: dessertId,
                  displayOrder: 0,
                },
              },
            },
          ],
        },
      },
    });

    return menu;
  }
}
