import { getProducts } from '@/lib/queries/product.queries';
import { InventoryView } from './_components/InventoryView';
import { Package } from 'lucide-react';
import { getTranslation } from '@/lib/i18n';
import { cookies } from 'next/headers';
import { PageHeader } from '@/components/PageHeader';
import { MissingPriceAlert } from '@/components/MissingPriceAlert';
import { db } from '@/lib/db/client';
import { getRecipeCategoriesAction } from '@/lib/actions/recipe-category.actions';

/**
 * Inventory Page (Server Component)
 * Comprehensive inventory management with table view, search, and inline editing
 */

export const dynamic = 'force-dynamic';

async function getMenuCriticalIngredients() {
  try {
    // Get active menus with their dishes
    const activeMenus = await db.menu.findMany({
      where: { isActive: true },
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
            },
          },
        },
      },
    });

    // Also get standalone active dishes (not in menus)
    const activeDishes = await db.dish.findMany({
      where: { isActive: true },
      include: {
        recipeIngredients: {
          include: {
            product: true,
          },
        },
      },
    });

    const ingredientMap = new Map<string, {
      productId: string;
      totalNeeded: number;
      currentStock: number;
      usedInDishes: string[];
    }>();

    // Process menu dishes
    activeMenus.forEach((menu) => {
      menu.sections.forEach((section) => {
        section.dishes.forEach((menuDish) => {
          const dish = menuDish.dish;

          dish.recipeIngredients?.forEach((ingredient) => {
            const productId = ingredient.productId;
            const existing = ingredientMap.get(productId);

            if (existing) {
              existing.totalNeeded += ingredient.quantityRequired;
              if (!existing.usedInDishes.includes(dish.name)) {
                existing.usedInDishes.push(dish.name);
              }
            } else {
              ingredientMap.set(productId, {
                productId,
                totalNeeded: ingredient.quantityRequired,
                currentStock: ingredient.product.quantity,
                usedInDishes: [dish.name],
              });
            }
          });
        });
      });
    });

    // Process standalone active dishes
    activeDishes.forEach((dish) => {
      dish.recipeIngredients?.forEach((ingredient) => {
        const productId = ingredient.productId;
        const existing = ingredientMap.get(productId);

        if (existing) {
          existing.totalNeeded += ingredient.quantityRequired;
          if (!existing.usedInDishes.includes(dish.name)) {
            existing.usedInDishes.push(dish.name);
          }
        } else {
          ingredientMap.set(productId, {
            productId,
            totalNeeded: ingredient.quantityRequired,
            currentStock: ingredient.product.quantity,
            usedInDishes: [dish.name],
          });
        }
      });
    });

    return Object.fromEntries(ingredientMap);
  } catch (error) {
    console.error('Error analyzing menu ingredients:', error);
    return {};
  }
}

export default async function InventoryPage() {
  const [products, menuIngredients, categoriesResult] = await Promise.all([
    getProducts(),
    getMenuCriticalIngredients(),
    getRecipeCategoriesAction('INVENTORY'),
  ]);

  const cookieStore = await cookies();
  const language = (cookieStore.get('language')?.value as 'en' | 'fr') || 'en';
  const t = getTranslation(language);

  const categories = categoriesResult.success ? categoriesResult.data : [];

  return (
    <div className="space-y-4 overflow-hidden">
      {/* Header with gradient background */}
      <PageHeader
        title={t('inventory.title')}
        subtitle={t('inventory.subtitle')}
        icon={Package}
      />

      <MissingPriceAlert />
      <InventoryView
        initialProducts={products}
        menuIngredients={menuIngredients}
        categories={categories}
      />
    </div>
  );
}
