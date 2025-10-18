import { db } from "@/lib/db/client";
import { DlcInput, UpdateDlcInput } from "@/lib/validations/dlc.schema";
import { DLCStatus } from "@prisma/client";

/**
 * DLC Service
 * Business logic for managing product expiration dates
 */

export async function createDlc(data: DlcInput) {
  return await db.dLC.create({
    data,
    include: {
      product: true,
    },
  });
}

export async function updateDlc(id: string, data: UpdateDlcInput) {
  return await db.dLC.update({
    where: { id },
    data,
    include: {
      product: true,
    },
  });
}

export async function deleteDlc(id: string) {
  return await db.dLC.delete({
    where: { id },
  });
}

export async function getDlcById(id: string) {
  return await db.dLC.findUnique({
    where: { id },
    include: {
      product: true,
    },
  });
}

export async function getAllDlcs(filters?: {
  status?: DLCStatus;
  productId?: string;
}) {
  return await db.dLC.findMany({
    where: {
      status: filters?.status,
      productId: filters?.productId,
    },
    include: {
      product: true,
    },
    orderBy: {
      expirationDate: "asc",
    },
  });
}

export async function getUpcomingDlcs(daysAhead: number = 7) {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + daysAhead);

  return await db.dLC.findMany({
    where: {
      status: "ACTIVE",
      expirationDate: {
        gte: today,
        lte: futureDate,
      },
    },
    include: {
      product: true,
    },
    orderBy: {
      expirationDate: "asc",
    },
  });
}

export async function getExpiredDlcs() {
  return await db.dLC.findMany({
    where: {
      status: "ACTIVE",
      expirationDate: {
        lt: new Date(),
      },
    },
    include: {
      product: true,
    },
    orderBy: {
      expirationDate: "asc",
    },
  });
}

export async function markDlcAsConsumed(id: string) {
  return await db.dLC.update({
    where: { id },
    data: { status: "CONSUMED" },
  });
}

export async function markDlcAsDiscarded(id: string) {
  return await db.dLC.update({
    where: { id },
    data: { status: "DISCARDED" },
  });
}

export async function autoMarkExpiredDlcs() {
  const expired = await getExpiredDlcs();

  await db.dLC.updateMany({
    where: {
      id: {
        in: expired.map((dlc) => dlc.id),
      },
    },
    data: {
      status: "EXPIRED",
    },
  });

  return expired.length;
}

export async function getDlcStats() {
  const [total, active, expired, expiringSoon] = await Promise.all([
    db.dLC.count(),
    db.dLC.count({ where: { status: "ACTIVE" } }),
    db.dLC.count({ where: { status: "EXPIRED" } }),
    db.dLC.count({
      where: {
        status: "ACTIVE",
        expirationDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  return {
    total,
    active,
    expired,
    expiringSoon,
  };
}
