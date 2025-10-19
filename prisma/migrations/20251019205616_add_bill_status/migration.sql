/*
  Warnings:

  - The values [A_LA_CARTE] on the enum `PricingType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `supplier` on the `bills` table. All the data in the column will be lost.
  - You are about to drop the column `supplier` on the `dlcs` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "BillStatus" AS ENUM ('PENDING', 'PROCESSED', 'DISPUTED');

-- AlterEnum
BEGIN;
CREATE TYPE "PricingType_new" AS ENUM ('PRIX_FIXE', 'CHOICE');
ALTER TABLE "public"."menus" ALTER COLUMN "pricingType" DROP DEFAULT;
ALTER TABLE "menus" ALTER COLUMN "pricingType" TYPE "PricingType_new" USING ("pricingType"::text::"PricingType_new");
ALTER TYPE "PricingType" RENAME TO "PricingType_old";
ALTER TYPE "PricingType_new" RENAME TO "PricingType";
DROP TYPE "public"."PricingType_old";
ALTER TABLE "menus" ALTER COLUMN "pricingType" SET DEFAULT 'PRIX_FIXE';
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Unit" ADD VALUE 'G';
ALTER TYPE "Unit" ADD VALUE 'ML';
ALTER TYPE "Unit" ADD VALUE 'CL';
ALTER TYPE "Unit" ADD VALUE 'BUNCH';
ALTER TYPE "Unit" ADD VALUE 'CLOVE';

-- DropIndex
DROP INDEX "public"."bills_supplier_idx";

-- AlterTable
ALTER TABLE "bills" DROP COLUMN "supplier",
ADD COLUMN     "status" "BillStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "supplierId" TEXT;

-- AlterTable
ALTER TABLE "dlcs" DROP COLUMN "supplier",
ADD COLUMN     "supplierId" TEXT;

-- AlterTable
ALTER TABLE "menus" ALTER COLUMN "pricingType" SET DEFAULT 'PRIX_FIXE';

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_name_key" ON "suppliers"("name");

-- CreateIndex
CREATE INDEX "suppliers_name_idx" ON "suppliers"("name");

-- CreateIndex
CREATE INDEX "suppliers_isActive_idx" ON "suppliers"("isActive");

-- CreateIndex
CREATE INDEX "bills_supplierId_idx" ON "bills"("supplierId");

-- CreateIndex
CREATE INDEX "bills_status_idx" ON "bills"("status");

-- CreateIndex
CREATE INDEX "dlcs_supplierId_idx" ON "dlcs"("supplierId");

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dlcs" ADD CONSTRAINT "dlcs_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
