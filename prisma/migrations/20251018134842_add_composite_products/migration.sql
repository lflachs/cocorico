-- CreateEnum
CREATE TYPE "DLCStatus" AS ENUM ('ACTIVE', 'CONSUMED', 'EXPIRED', 'DISCARDED');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "isComposite" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "yieldQuantity" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "composite_ingredients" (
    "id" TEXT NOT NULL,
    "compositeProductId" TEXT NOT NULL,
    "baseProductId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" "Unit" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "composite_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dlcs" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "expirationDate" TIMESTAMP(3) NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" "Unit" NOT NULL DEFAULT 'PC',
    "batchNumber" TEXT,
    "supplier" TEXT,
    "status" "DLCStatus" NOT NULL DEFAULT 'ACTIVE',
    "imageFilename" TEXT,
    "ocrRawData" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dlcs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "composite_ingredients_compositeProductId_idx" ON "composite_ingredients"("compositeProductId");

-- CreateIndex
CREATE INDEX "composite_ingredients_baseProductId_idx" ON "composite_ingredients"("baseProductId");

-- CreateIndex
CREATE INDEX "dlcs_productId_idx" ON "dlcs"("productId");

-- CreateIndex
CREATE INDEX "dlcs_expirationDate_idx" ON "dlcs"("expirationDate");

-- CreateIndex
CREATE INDEX "dlcs_status_idx" ON "dlcs"("status");

-- CreateIndex
CREATE INDEX "products_isComposite_idx" ON "products"("isComposite");

-- AddForeignKey
ALTER TABLE "composite_ingredients" ADD CONSTRAINT "composite_ingredients_compositeProductId_fkey" FOREIGN KEY ("compositeProductId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "composite_ingredients" ADD CONSTRAINT "composite_ingredients_baseProductId_fkey" FOREIGN KEY ("baseProductId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dlcs" ADD CONSTRAINT "dlcs_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
