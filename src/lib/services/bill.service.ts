import { db } from '@/lib/db/client';
import type { Bill, BillProduct } from '@prisma/client';

/**
 * Bill Service
 * Business logic for bill management
 */

type CreateBillData = {
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
      filename: data.filename,
      billDate: data.billDate,
      totalAmount: data.totalAmount,
      rawContent: data.rawContent,
      // supplierId will be set during confirmation
    },
  });
}

export async function getBillById(id: string) {
  return await db.bill.findUnique({
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
}

export async function getAllBills() {
  return await db.bill.findMany({
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

export async function confirmBill(
  billId: string,
  productMappings: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>
): Promise<void> {
  // Start a transaction to update stock and create movements
  await db.$transaction(async (tx) => {
    for (const mapping of productMappings) {
      // Get current product
      const product = await tx.product.findUnique({
        where: { id: mapping.productId },
      });

      if (!product) continue;

      const newQuantity = product.quantity + mapping.quantity;
      const totalValue = mapping.quantity * mapping.unitPrice;

      // Update product quantity
      await tx.product.update({
        where: { id: mapping.productId },
        data: {
          quantity: newQuantity,
          unitPrice: mapping.unitPrice,
          totalValue: newQuantity * mapping.unitPrice,
        },
      });

      // Create stock movement (event sourcing)
      await tx.stockMovement.create({
        data: {
          productId: mapping.productId,
          movementType: 'IN',
          quantity: mapping.quantity,
          balanceAfter: newQuantity,
          billId,
          reason: 'Bill confirmation',
          unitPrice: mapping.unitPrice,
          totalValue,
        },
      });
    }
  });
}
