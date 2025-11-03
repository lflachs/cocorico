-- CreateEnum
CREATE TYPE "ByproductType" AS ENUM ('COMPOST', 'STOCK', 'WASTE', 'REUSE');

-- CreateTable
CREATE TABLE "byproducts" (
    "id" TEXT NOT NULL,
    "productionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" "Unit" NOT NULL,
    "byproductType" "ByproductType" NOT NULL DEFAULT 'WASTE',
    "productId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "byproducts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "byproducts_productionId_idx" ON "byproducts"("productionId");

-- CreateIndex
CREATE INDEX "byproducts_byproductType_idx" ON "byproducts"("byproductType");

-- AddForeignKey
ALTER TABLE "byproducts" ADD CONSTRAINT "byproducts_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "byproducts" ADD CONSTRAINT "byproducts_productionId_fkey" FOREIGN KEY ("productionId") REFERENCES "productions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
