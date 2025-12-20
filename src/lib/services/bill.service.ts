import { db } from '@/lib/db/client';
import type { Bill, BillProduct } from '@prisma/client';
import { calculateWeightedAverage, calculatePriceChange } from '@/lib/utils/price-calculations';

/**
 * Bill Service
 * Business logic for bill management
 */

type CreateBillData = {
  restaurantId: string;
  filename: string;
  supplier: string;
  billDate: Date;
  totalAmount: number;
  rawContent?: string;
};

type CreateBillProductData = {
  productId: string;
  quantityExtracted: number;
  unitPriceExtracted: number;
  totalValueExtracted: number;
};

export async function createBill(data: CreateBillData): Promise<Bill> {
  // Don't create supplier here - it will be created/linked during confirmation
  // This allows the user to review and correct the supplier name first
  return await db.bill.create({
    data: {
      restaurantId: data.restaurantId,
      filename: data.filename,
      billDate: data.billDate,
      totalAmount: data.totalAmount,
      rawContent: data.rawContent,
      // supplierId will be set during confirmation
    },
  });
}

export async function getBillById(id: string, restaurantId?: string) {
  const bill = await db.bill.findUnique({
    where: { id },
    include: {
      supplier: true,
      products: {
        include: {
          product: true,
        },
      },
      disputes: true,
    },
  });

  // Verify bill belongs to restaurant if restaurantId provided
  if (bill && restaurantId && bill.restaurantId !== restaurantId) {
    return null;
  }

  return bill;
}

export async function getAllBills(restaurantId?: string) {
  return await db.bill.findMany({
    where: restaurantId ? { restaurantId } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      supplier: true,
      products: {
        include: {
          product: true,
        },
      },
    },
  });
}

export async function addProductsToBill(
  billId: string,
  products: CreateBillProductData[]
): Promise<void> {
  await db.billProduct.createMany({
    data: products.map((p) => ({
      billId,
      ...p,
    })),
  });
}

export type PriceChangeInfo = {
  productId: string;
  productName: string;
  oldPrice: number;
  newPrice: number;
  purchasePrice: number;
  changePercent: number;
  currentQuantity: number;
  purchaseQuantity: number;
  newTotalQuantity: number;
};

export async function confirmBill(
  billId: string,
  productMappings: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>
): Promise<PriceChangeInfo[]> {
  // Get bill details for price history
  const bill = await db.bill.findUnique({
    where: { id: billId },
    select: { supplierId: true },
  });

  const priceChanges: PriceChangeInfo[] = [];

  // Start a transaction to update stock and create movements
  await db.$transaction(async (tx) => {
    for (const mapping of productMappings) {
      // Get current product state
      const product = await tx.product.findUnique({
        where: { id: mapping.productId },
      });

      if (!product) continue;

      // Current state
      const currentQuantity = product.quantity;
      const currentPrice = product.unitPrice || 0;
      const purchasePrice = mapping.unitPrice;
      const purchaseQuantity = mapping.quantity;

      // Calculate weighted average price
      // Example: 2kg at €2.00 + 4kg at €2.10 = 6kg at €2.07
      const newWeightedPrice = calculateWeightedAverage(
        currentQuantity,
        currentPrice,
        purchaseQuantity,
        purchasePrice
      );

      // Calculate new total quantity
      const newTotalQuantity = currentQuantity + purchaseQuantity;

      // Calculate price change percentage
      const priceChangePercent = currentPrice > 0
        ? calculatePriceChange(currentPrice, newWeightedPrice)
        : 0;

      // Create price history if price actually changed
      const hasPriceChange = currentPrice > 0 && Math.abs(priceChangePercent) > 0.01;

      if (hasPriceChange) {
        await tx.priceHistory.create({
          data: {
            restaurantId: product.restaurantId,
            productId: mapping.productId,
            oldPrice: currentPrice,
            newPrice: newWeightedPrice,
            changePercent: priceChangePercent,
            quantityPurchased: purchaseQuantity,
            billId,
            supplierId: bill?.supplierId,
          },
        });

        // Record price change for UI display
        priceChanges.push({
          productId: mapping.productId,
          productName: product.name,
          oldPrice: currentPrice,
          newPrice: newWeightedPrice,
          purchasePrice,
          changePercent: priceChangePercent,
          currentQuantity,
          purchaseQuantity,
          newTotalQuantity,
        });
      }

      // Update product with new weighted average price and quantity
      await tx.product.update({
        where: { id: mapping.productId },
        data: {
          quantity: newTotalQuantity,
          unitPrice: newWeightedPrice, // Weighted average, not purchase price!
          totalValue: newTotalQuantity * newWeightedPrice,
        },
      });

      // Create stock movement record (stores the ACTUAL purchase price)
      await tx.stockMovement.create({
        data: {
          productId: mapping.productId,
          movementType: 'IN',
          quantity: purchaseQuantity,
          balanceAfter: newTotalQuantity,
          billId,
          reason: hasPriceChange
            ? `Purchase - Price ${priceChangePercent > 0 ? 'increased' : 'decreased'} ${Math.abs(priceChangePercent).toFixed(1)}%`
            : 'Purchase',
          unitPrice: purchasePrice, // Actual purchase price from bill
          totalValue: purchaseQuantity * purchasePrice,
          source: 'SCAN_RECEPTION',
        },
      });
    }
  });

  return priceChanges;
}
