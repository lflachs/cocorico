import { getAllProducts } from './product.service';
import { getUpcomingDlcs } from './dlc.service';
import { db } from '@/lib/db/client';
import {
  AlertUrgency,
  AlertType,
  getDaysUntilExpiration,
  getDaysSince,
  getExpirationUrgency,
  getLowStockUrgency,
  getDisputeUrgency,
  sortAlertsByUrgency,
} from '@/lib/utils/alerts';

/**
 * Alert Service - Server-side data fetching and processing for alerts
 */

export interface Alert {
  id: string;
  type: AlertType;
  title: string;
  description: string;
  urgency: AlertUrgency;
  href: string;
  badge?: string;
}

interface IngredientUsage {
  productId: string;
  productName: string;
  unit: string;
  totalNeeded: number;
  currentStock: number;
  usedInDishes: string[]; // Dish names that use this ingredient
}

/**
 * Analyzes active menus and dishes to determine critical ingredients
 * Returns ingredients that are needed for current menu items
 */
async function getMenuCriticalIngredients(): Promise<Map<string, IngredientUsage>> {
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

    const ingredientMap = new Map<string, IngredientUsage>();

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
                productName: ingredient.product.name,
                unit: ingredient.unit,
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
            productName: ingredient.product.name,
            unit: ingredient.unit,
            totalNeeded: ingredient.quantityRequired,
            currentStock: ingredient.product.quantity,
            usedInDishes: [dish.name],
          });
        }
      });
    });

    return ingredientMap;
  } catch (error) {
    console.error('Error analyzing menu ingredients:', error);
    return new Map();
  }
}

/**
 * Fetches and processes all alerts from the database
 * This function runs on the server and should be called from Server Components
 */
export async function getAllAlerts(t: (key: any) => string): Promise<Alert[]> {
  try {
    const { getOpenDisputes } = await import('./dispute.service');

    const [products, dlcs, menuIngredients, disputes] = await Promise.all([
      getAllProducts(),
      getUpcomingDlcs(7),
      getMenuCriticalIngredients(),
      getOpenDisputes(),
    ]);

    const alerts: Alert[] = [];

    // Process expiring products
    dlcs.forEach((dlc) => {
      const days = getDaysUntilExpiration(dlc.expirationDate);
      const urgency = getExpirationUrgency(days);

      let title = '';
      let badge = '';

      if (days <= 0) {
        title = `${dlc.product.name} has expired`;
        badge = t('dlc.status.expired');
      } else if (days === 1) {
        title = `${dlc.product.name} expires tomorrow`;
        badge = t('dlc.status.tomorrow');
      } else if (days <= 3) {
        title = `${dlc.product.name} expires very soon`;
        badge = `${days} ${t('dlc.status.days')}`;
      } else {
        title = `${dlc.product.name} expires in ${days} days`;
        badge = `${days} ${t('dlc.status.days')}`;
      }

      alerts.push({
        id: `dlc-${dlc.id}`,
        type: 'expiring',
        title,
        description: `${dlc.quantity} ${dlc.unit}`,
        urgency,
        href: '/dlc',
        badge,
      });
    });

    // Process low stock items - MENU-AWARE ALERTS
    // Priority 1: Ingredients used in active menus/dishes
    menuIngredients.forEach((ingredient) => {
      const servingsAvailable = Math.floor(ingredient.currentStock / ingredient.totalNeeded);

      // Alert if stock is very low (less than 10 servings worth)
      if (servingsAvailable < 10) {
        const urgency: AlertUrgency =
          servingsAvailable === 0 ? 'critical' :
          servingsAvailable <= 3 ? 'high' : 'medium';

        const dishList = ingredient.usedInDishes.length > 2
          ? `${ingredient.usedInDishes.slice(0, 2).join(', ')} +${ingredient.usedInDishes.length - 2}`
          : ingredient.usedInDishes.join(', ');

        let title = '';
        if (servingsAvailable === 0) {
          title = `${ingredient.productName} is out of stock`;
        } else if (servingsAvailable === 1) {
          title = `${ingredient.productName} is almost out of stock`;
        } else if (servingsAvailable <= 3) {
          title = `${ingredient.productName} is running very low`;
        } else {
          title = `${ingredient.productName} is running low`;
        }

        alerts.push({
          id: `menu-stock-${ingredient.productId}`,
          type: 'lowStock',
          title,
          description: `${servingsAvailable} serving${servingsAvailable !== 1 ? 's' : ''} left • Used in: ${dishList}`,
          urgency,
          href: '/inventory',
          badge: servingsAvailable === 0 ? 'OUT' : `${servingsAvailable}×`,
        });
      }
    });

    // Priority 2: Products below par level (but not in active menus)
    products.forEach((product) => {
      // Skip if already alerted as menu ingredient
      if (menuIngredients.has(product.id)) return;

      if (product.parLevel && product.quantity < product.parLevel) {
        const urgency = getLowStockUrgency(product.quantity, product.parLevel);
        const percentageLeft = (product.quantity / product.parLevel) * 100;

        let title = '';
        if (product.quantity === 0) {
          title = `${product.name} is out of stock`;
        } else if (percentageLeft <= 25) {
          title = `${product.name} is critically low`;
        } else if (percentageLeft <= 50) {
          title = `${product.name} is below par level`;
        } else {
          title = `${product.name} is running low`;
        }

        alerts.push({
          id: `stock-${product.id}`,
          type: 'lowStock',
          title,
          description: `${product.quantity.toFixed(1)} / ${product.parLevel.toFixed(1)} ${product.unit}`,
          urgency,
          href: '/inventory',
          badge: t('inventory.status.low'),
        });
      }
    });

    // Process open disputes
    disputes.forEach((dispute) => {
      const daysSince = getDaysSince(dispute.createdAt);
      const urgency = getDisputeUrgency(daysSince);

      let title = '';
      if (daysSince >= 7) {
        title = `Urgent: ${dispute.title} (${daysSince} days old)`;
      } else if (daysSince >= 3) {
        title = `${dispute.title} needs attention`;
      } else {
        title = dispute.title;
      }

      let description = '';
      if (dispute.bill.supplier) {
        description = `Supplier: ${dispute.bill.supplier}`;
      }
      if (dispute.products.length > 0) {
        description += ` • ${dispute.products.length} product${dispute.products.length > 1 ? 's' : ''}`;
      }
      if (dispute.amountDisputed) {
        description += ` • €${dispute.amountDisputed.toFixed(2)}`;
      }

      alerts.push({
        id: `dispute-${dispute.id}`,
        type: 'dispute',
        title,
        description: description || 'Pending resolution',
        urgency,
        href: '/disputes',
        badge: dispute.status === 'IN_PROGRESS' ? 'IN PROGRESS' : 'OPEN',
      });
    });

    // Sort by urgency
    return sortAlertsByUrgency(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return [];
  }
}

/**
 * Get alerts count by type
 */
export function getAlertsCounts(alerts: Alert[]) {
  return {
    all: alerts.length,
    expiring: alerts.filter((a) => a.type === 'expiring').length,
    lowStock: alerts.filter((a) => a.type === 'lowStock').length,
    disputes: alerts.filter((a) => a.type === 'dispute').length,
  };
}
