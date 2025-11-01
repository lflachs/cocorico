-- AlterTable
ALTER TABLE "products" ADD COLUMN     "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "displayName" TEXT;

-- CreateIndex
CREATE INDEX "products_displayName_idx" ON "products"("displayName");
