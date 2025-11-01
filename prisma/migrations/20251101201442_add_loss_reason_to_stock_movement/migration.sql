-- CreateEnum
CREATE TYPE "LossReason" AS ENUM ('EXPIRED', 'DAMAGED', 'THEFT', 'SPILLAGE', 'QUALITY_ISSUE', 'MISSING', 'OTHER');

-- AlterTable
ALTER TABLE "stock_movements" ADD COLUMN     "lossReason" "LossReason";
