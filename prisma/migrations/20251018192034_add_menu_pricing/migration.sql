-- CreateEnum
CREATE TYPE "PricingType" AS ENUM ('A_LA_CARTE', 'PRIX_FIXE', 'CHOICE');

-- AlterTable
ALTER TABLE "dishes" ADD COLUMN     "sellingPrice" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "menu_dishes" ADD COLUMN     "priceOverride" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "menu_sections" ADD COLUMN     "isOptional" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isRequired" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "menus" ADD COLUMN     "fixedPrice" DOUBLE PRECISION,
ADD COLUMN     "maxCourses" INTEGER,
ADD COLUMN     "minCourses" INTEGER,
ADD COLUMN     "pricingType" "PricingType" NOT NULL DEFAULT 'A_LA_CARTE';
