import { db } from '@/lib/db/client';

/**
 * Calculate weighted average price when receiving new stock
 *
 * Example:
 * - Current: 2 steaks at €2.00 = €4.00 total
 * - New: 4 steaks at €2.10 = €8.40 total
 * - Weighted average: (€4.00 + €8.40) / (2 + 4) = €12.40 / 6 = €2.07 per steak
 *
 * @param currentQuantity Current stock quantity
 * @param currentPrice Current unit price
 * @param newQuantity Newly purchased quantity
 * @param newPrice New purchase price
 * @returns Weighted average unit price
 */
export function calculateWeightedAverage(
  currentQuantity: number,
  currentPrice: number,
  newQuantity: number,
  newPrice: number
): number {
  // If no current stock, use new price
  if (currentQuantity <= 0) {
    return newPrice;
  }

  // Calculate total value before and after
  const currentValue = currentQuantity * currentPrice;
  const newValue = newQuantity * newPrice;
  const totalValue = currentValue + newValue;

  // Calculate total quantity
  const totalQuantity = currentQuantity + newQuantity;

  // Weighted average = total value / total quantity
  const weightedAverage = totalValue / totalQuantity;

  // Round to 2 decimal places
  return Math.round(weightedAverage * 100) / 100;
}

/**
 * Calculate percentage change between two prices
 */
export function calculatePriceChange(oldPrice: number, newPrice: number): number {
  if (oldPrice === 0) return 0;
  const change = ((newPrice - oldPrice) / oldPrice) * 100;
  return Math.round(change * 100) / 100; // Round to 2 decimals
}

/**
 * Determine if a price change is significant enough to alert
 */
export function isSignificantPriceChange(changePercent: number, threshold: number = 10): boolean {
  return Math.abs(changePercent) >= threshold;
}

/**
 * Update product price with weighted average and create price history record
 *
 * This is called when processing a bill with a new price
 */
export async function updateProductPriceWithHistory(params: {
  productId: string;
  newPurchasePrice: number;
  quantityPurchased: number;
  billId?: string;
  supplierId?: string;
}) {
  const { productId, newPurchasePrice, quantityPurchased, billId, supplierId } = params;

  // Get current product state
  const product = await db.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new Error(`Product not found: ${productId}`);
  }

  const currentPrice = product.unitPrice || 0;
  const currentQuantity = product.quantity || 0;

  // Calculate weighted average price
  const newWeightedPrice = calculateWeightedAverage(
    currentQuantity,
    currentPrice,
    quantityPurchased,
    newPurchasePrice
  );

  // Calculate change percentage
  const changePercent = calculatePriceChange(currentPrice, newWeightedPrice);

  // Only create price history if there was actually a change
  const hasPriceChange = currentPrice !== 0 && Math.abs(changePercent) > 0.01;

  if (hasPriceChange) {
    // Create price history record
    await db.priceHistory.create({
      data: {
        productId,
        oldPrice: currentPrice,
        newPrice: newWeightedPrice,
        changePercent,
        quantityPurchased,
        billId,
        supplierId,
      },
    });
  }

  // Update product with new weighted average price
  await db.product.update({
    where: { id: productId },
    data: {
      unitPrice: newWeightedPrice,
    },
  });

  return {
    oldPrice: currentPrice,
    newPrice: newWeightedPrice,
    changePercent,
    isSignificant: isSignificantPriceChange(changePercent),
    priceHistoryCreated: hasPriceChange,
  };
}

/**
 * Get recent price changes for a product
 */
export async function getProductPriceHistory(productId: string, limit: number = 10) {
  return await db.priceHistory.findMany({
    where: { productId },
    include: {
      bill: {
        select: {
          filename: true,
          billDate: true,
        },
      },
      supplier: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      changedAt: 'desc',
    },
    take: limit,
  });
}

/**
 * Get all significant price changes in a date range
 */
export async function getSignificantPriceChanges(params: {
  startDate: Date;
  endDate: Date;
  threshold?: number;
}) {
  const { startDate, endDate, threshold = 10 } = params;

  const changes = await db.priceHistory.findMany({
    where: {
      changedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      product: {
        select: {
          name: true,
          unit: true,
        },
      },
      supplier: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      changedAt: 'desc',
    },
  });

  // Filter for significant changes
  return changes.filter((change) => Math.abs(change.changePercent) >= threshold);
}
