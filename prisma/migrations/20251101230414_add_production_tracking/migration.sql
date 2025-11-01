-- AlterEnum
ALTER TYPE "MovementSource" ADD VALUE 'PRODUCTION';

-- AlterTable
ALTER TABLE "stock_movements" ADD COLUMN     "productionId" TEXT;

-- CreateTable
CREATE TABLE "productions" (
    "id" TEXT NOT NULL,
    "dishId" TEXT NOT NULL,
    "quantityProduced" DOUBLE PRECISION NOT NULL,
    "productionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "productions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "productions_dishId_idx" ON "productions"("dishId");

-- CreateIndex
CREATE INDEX "productions_productionDate_idx" ON "productions"("productionDate");

-- CreateIndex
CREATE INDEX "productions_userId_idx" ON "productions"("userId");

-- CreateIndex
CREATE INDEX "stock_movements_productionId_idx" ON "stock_movements"("productionId");

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_productionId_fkey" FOREIGN KEY ("productionId") REFERENCES "productions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productions" ADD CONSTRAINT "productions_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "dishes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productions" ADD CONSTRAINT "productions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
