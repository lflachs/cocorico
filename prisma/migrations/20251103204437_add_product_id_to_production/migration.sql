-- AlterTable
ALTER TABLE "productions" ADD COLUMN     "productId" TEXT,
ALTER COLUMN "dishId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "productions_productId_idx" ON "productions"("productId");

-- AddForeignKey
ALTER TABLE "productions" ADD CONSTRAINT "productions_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
