-- AlterTable
ALTER TABLE "dishes" ADD COLUMN     "folderId" TEXT;

-- CreateTable
CREATE TABLE "dish_folders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dish_folders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dish_folders_order_idx" ON "dish_folders"("order");

-- CreateIndex
CREATE INDEX "dishes_folderId_idx" ON "dishes"("folderId");

-- AddForeignKey
ALTER TABLE "dishes" ADD CONSTRAINT "dishes_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "dish_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
