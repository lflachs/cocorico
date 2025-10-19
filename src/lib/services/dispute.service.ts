import { db } from '@/lib/db/client';
import type { Dispute, DisputeProduct, DisputeType, DisputeStatus } from '@prisma/client';

/**
 * Dispute Service
 * Business logic for dispute and returns management
 */

type CreateDisputeData = {
  billId: string;
  type: DisputeType;
  title: string;
  description?: string;
  amountDisputed?: number;
  products?: Array<{
    productId: string;
    reason: string;
    quantityDisputed?: number;
    description?: string;
  }>;
};

type UpdateDisputeData = {
  status?: DisputeStatus;
  resolutionNotes?: string;
};

/**
 * Get all disputes with bill and product information
 */
export async function getAllDisputes() {
  return await db.dispute.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      bill: {
        select: {
          id: true,
          filename: true,
          supplier: true,
          billDate: true,
          totalAmount: true,
        },
      },
      products: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              unit: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Get open disputes (OPEN and IN_PROGRESS status)
 */
export async function getOpenDisputes() {
  return await db.dispute.findMany({
    where: {
      status: {
        in: ['OPEN', 'IN_PROGRESS'],
      },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      bill: {
        select: {
          id: true,
          filename: true,
          supplier: true,
          billDate: true,
        },
      },
      products: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              unit: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Get dispute by ID
 */
export async function getDisputeById(id: string) {
  return await db.dispute.findUnique({
    where: { id },
    include: {
      bill: {
        include: {
          products: {
            include: {
              product: true,
            },
          },
        },
      },
      products: {
        include: {
          product: true,
        },
      },
      stockMovements: true,
    },
  });
}

/**
 * Create a new dispute
 */
export async function createDispute(data: CreateDisputeData): Promise<Dispute> {
  return await db.$transaction(async (tx) => {
    // Create the dispute
    const dispute = await tx.dispute.create({
      data: {
        billId: data.billId,
        type: data.type,
        title: data.title,
        description: data.description,
        amountDisputed: data.amountDisputed,
      },
    });

    // Add products if provided
    if (data.products && data.products.length > 0) {
      await tx.disputeProduct.createMany({
        data: data.products.map((p) => ({
          disputeId: dispute.id,
          productId: p.productId,
          reason: p.reason,
          quantityDisputed: p.quantityDisputed,
          description: p.description,
        })),
      });
    }

    return dispute;
  });
}

/**
 * Update dispute status and resolution
 */
export async function updateDispute(id: string, data: UpdateDisputeData): Promise<Dispute> {
  const updateData: any = {};

  if (data.status) {
    updateData.status = data.status;
  }

  if (data.resolutionNotes !== undefined) {
    updateData.resolutionNotes = data.resolutionNotes;
  }

  // If status is being set to RESOLVED or CLOSED, set resolvedAt
  if (data.status === 'RESOLVED' || data.status === 'CLOSED') {
    updateData.resolvedAt = new Date();
  }

  return await db.dispute.update({
    where: { id },
    data: updateData,
  });
}

/**
 * Resolve dispute and process return/refund
 */
export async function resolveDispute(
  id: string,
  resolutionNotes: string,
  productReturns?: Array<{
    productId: string;
    quantityReturned: number;
  }>
): Promise<void> {
  await db.$transaction(async (tx) => {
    // Update dispute status
    await tx.dispute.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolutionNotes,
      },
    });

    // Process product returns (reduce stock)
    if (productReturns && productReturns.length > 0) {
      for (const productReturn of productReturns) {
        const product = await tx.product.findUnique({
          where: { id: productReturn.productId },
        });

        if (!product) continue;

        const newQuantity = product.quantity - productReturn.quantityReturned;

        // Update product quantity
        await tx.product.update({
          where: { id: productReturn.productId },
          data: {
            quantity: newQuantity,
            totalValue: product.unitPrice ? newQuantity * product.unitPrice : null,
          },
        });

        // Create stock movement for the return
        await tx.stockMovement.create({
          data: {
            productId: productReturn.productId,
            movementType: 'OUT',
            quantity: productReturn.quantityReturned,
            balanceAfter: newQuantity,
            disputeId: id,
            reason: 'Dispute resolution - product return',
            description: resolutionNotes,
            unitPrice: product.unitPrice,
            totalValue: product.unitPrice
              ? productReturn.quantityReturned * product.unitPrice
              : null,
          },
        });
      }
    }
  });
}

/**
 * Delete a dispute
 */
export async function deleteDispute(id: string): Promise<void> {
  await db.dispute.delete({
    where: { id },
  });
}
