-- CreateEnum
CREATE TYPE "MenuType" AS ENUM ('REGULAR', 'DAILY');

-- AlterTable
ALTER TABLE "menus" ADD COLUMN     "menuType" "MenuType" NOT NULL DEFAULT 'REGULAR';

-- CreateIndex
CREATE INDEX "menus_menuType_idx" ON "menus"("menuType");
