-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "Unit" AS ENUM ('KG', 'G', 'L', 'ML', 'CL', 'PC', 'BUNCH', 'CLOVE');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('IN', 'OUT', 'ADJUSTMENT', 'INITIAL');

-- CreateEnum
CREATE TYPE "MovementSource" AS ENUM ('MANUAL', 'SCAN_RECEPTION', 'SCAN_SALES', 'RECIPE_DEDUCTION', 'PRODUCTION', 'SYSTEM_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "LossReason" AS ENUM ('EXPIRED', 'DAMAGED', 'THEFT', 'SPILLAGE', 'QUALITY_ISSUE', 'MISSING', 'OTHER');

-- CreateEnum
CREATE TYPE "BillStatus" AS ENUM ('PENDING', 'PROCESSED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "DisputeType" AS ENUM ('RETURN', 'COMPLAINT', 'REFUND');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('DISH', 'PREPARED_INGREDIENT');

-- CreateEnum
CREATE TYPE "MenuType" AS ENUM ('REGULAR', 'DAILY');

-- CreateEnum
CREATE TYPE "PricingType" AS ENUM ('PRIX_FIXE', 'CHOICE');

-- CreateEnum
CREATE TYPE "DLCStatus" AS ENUM ('ACTIVE', 'CONSUMED', 'EXPIRED', 'DISCARDED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" "Unit" NOT NULL DEFAULT 'PC',
    "unitPrice" DOUBLE PRECISION,
    "totalValue" DOUBLE PRECISION,
    "trackable" BOOLEAN NOT NULL DEFAULT false,
    "parLevel" DOUBLE PRECISION,
    "category" TEXT,
    "isComposite" BOOLEAN NOT NULL DEFAULT false,
    "yieldQuantity" DOUBLE PRECISION,
    "categoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastVerifiedAt" TIMESTAMP(3),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

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
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "movementType" "MovementType" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "balanceAfter" DOUBLE PRECISION NOT NULL,
    "movementDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "billId" TEXT,
    "disputeId" TEXT,
    "saleId" TEXT,
    "productionId" TEXT,
    "userId" TEXT,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "unitPrice" DOUBLE PRECISION,
    "totalValue" DOUBLE PRECISION,
    "source" "MovementSource" NOT NULL DEFAULT 'MANUAL',
    "lossReason" "LossReason",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "bills" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "supplierId" TEXT,
    "billDate" TIMESTAMP(3),
    "totalAmount" DOUBLE PRECISION,
    "rawContent" TEXT,
    "status" "BillStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_products" (
    "id" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantityExtracted" DOUBLE PRECISION NOT NULL,
    "unitPriceExtracted" DOUBLE PRECISION,
    "totalValueExtracted" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bill_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "type" "DisputeType" NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amountDisputed" DOUBLE PRECISION,
    "resolvedAt" TIMESTAMP(3),
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispute_products" (
    "id" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "quantityDisputed" DOUBLE PRECISION,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispute_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "parentId" TEXT,
    "categoryType" "CategoryType" NOT NULL DEFAULT 'DISH',
    "isPredefined" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipe_categories_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "dishes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sellingPrice" DOUBLE PRECISION,
    "categoryId" TEXT,
    "folderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dishes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_ingredients" (
    "id" TEXT NOT NULL,
    "dishId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantityRequired" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recipe_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menus" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "menuType" "MenuType" NOT NULL DEFAULT 'REGULAR',
    "fixedPrice" DOUBLE PRECISION,
    "pricingType" "PricingType" NOT NULL DEFAULT 'PRIX_FIXE',
    "minCourses" INTEGER,
    "maxCourses" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_sections" (
    "id" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "menu_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_dishes" (
    "id" TEXT NOT NULL,
    "menuSectionId" TEXT NOT NULL,
    "dishId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "priceOverride" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "menu_dishes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" TEXT NOT NULL,
    "dishId" TEXT NOT NULL,
    "quantitySold" INTEGER NOT NULL,
    "saleDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "dlcs" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "expirationDate" TIMESTAMP(3) NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" "Unit" NOT NULL DEFAULT 'PC',
    "batchNumber" TEXT,
    "supplierId" TEXT,
    "status" "DLCStatus" NOT NULL DEFAULT 'ACTIVE',
    "imageFilename" TEXT,
    "ocrRawData" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dlcs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_history" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "oldPrice" DOUBLE PRECISION NOT NULL,
    "newPrice" DOUBLE PRECISION NOT NULL,
    "changePercent" DOUBLE PRECISION NOT NULL,
    "quantityPurchased" DOUBLE PRECISION,
    "billId" TEXT,
    "supplierId" TEXT,
    "reason" TEXT,
    "changedBy" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "products_name_idx" ON "products"("name");

-- CreateIndex
CREATE INDEX "products_displayName_idx" ON "products"("displayName");

-- CreateIndex
CREATE INDEX "products_category_idx" ON "products"("category");

-- CreateIndex
CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");

-- CreateIndex
CREATE INDEX "products_isComposite_idx" ON "products"("isComposite");

-- CreateIndex
CREATE INDEX "composite_ingredients_compositeProductId_idx" ON "composite_ingredients"("compositeProductId");

-- CreateIndex
CREATE INDEX "composite_ingredients_baseProductId_idx" ON "composite_ingredients"("baseProductId");

-- CreateIndex
CREATE INDEX "stock_movements_productId_idx" ON "stock_movements"("productId");

-- CreateIndex
CREATE INDEX "stock_movements_movementDate_idx" ON "stock_movements"("movementDate");

-- CreateIndex
CREATE INDEX "stock_movements_billId_idx" ON "stock_movements"("billId");

-- CreateIndex
CREATE INDEX "stock_movements_saleId_idx" ON "stock_movements"("saleId");

-- CreateIndex
CREATE INDEX "stock_movements_productionId_idx" ON "stock_movements"("productionId");

-- CreateIndex
CREATE INDEX "stock_movements_source_idx" ON "stock_movements"("source");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_name_key" ON "suppliers"("name");

-- CreateIndex
CREATE INDEX "suppliers_name_idx" ON "suppliers"("name");

-- CreateIndex
CREATE INDEX "suppliers_isActive_idx" ON "suppliers"("isActive");

-- CreateIndex
CREATE INDEX "bills_billDate_idx" ON "bills"("billDate");

-- CreateIndex
CREATE INDEX "bills_supplierId_idx" ON "bills"("supplierId");

-- CreateIndex
CREATE INDEX "bills_status_idx" ON "bills"("status");

-- CreateIndex
CREATE INDEX "bill_products_billId_idx" ON "bill_products"("billId");

-- CreateIndex
CREATE INDEX "bill_products_productId_idx" ON "bill_products"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "bill_products_billId_productId_key" ON "bill_products"("billId", "productId");

-- CreateIndex
CREATE INDEX "disputes_billId_idx" ON "disputes"("billId");

-- CreateIndex
CREATE INDEX "disputes_status_idx" ON "disputes"("status");

-- CreateIndex
CREATE INDEX "dispute_products_disputeId_idx" ON "dispute_products"("disputeId");

-- CreateIndex
CREATE INDEX "dispute_products_productId_idx" ON "dispute_products"("productId");

-- CreateIndex
CREATE INDEX "recipe_categories_order_idx" ON "recipe_categories"("order");

-- CreateIndex
CREATE INDEX "recipe_categories_parentId_idx" ON "recipe_categories"("parentId");

-- CreateIndex
CREATE INDEX "recipe_categories_categoryType_idx" ON "recipe_categories"("categoryType");

-- CreateIndex
CREATE INDEX "dish_folders_order_idx" ON "dish_folders"("order");

-- CreateIndex
CREATE INDEX "dishes_name_idx" ON "dishes"("name");

-- CreateIndex
CREATE INDEX "dishes_categoryId_idx" ON "dishes"("categoryId");

-- CreateIndex
CREATE INDEX "dishes_folderId_idx" ON "dishes"("folderId");

-- CreateIndex
CREATE INDEX "recipe_ingredients_dishId_idx" ON "recipe_ingredients"("dishId");

-- CreateIndex
CREATE INDEX "recipe_ingredients_productId_idx" ON "recipe_ingredients"("productId");

-- CreateIndex
CREATE INDEX "menus_name_idx" ON "menus"("name");

-- CreateIndex
CREATE INDEX "menus_menuType_idx" ON "menus"("menuType");

-- CreateIndex
CREATE INDEX "menu_sections_menuId_idx" ON "menu_sections"("menuId");

-- CreateIndex
CREATE INDEX "menu_dishes_menuSectionId_idx" ON "menu_dishes"("menuSectionId");

-- CreateIndex
CREATE INDEX "menu_dishes_dishId_idx" ON "menu_dishes"("dishId");

-- CreateIndex
CREATE INDEX "sales_dishId_idx" ON "sales"("dishId");

-- CreateIndex
CREATE INDEX "sales_saleDate_idx" ON "sales"("saleDate");

-- CreateIndex
CREATE INDEX "sales_userId_idx" ON "sales"("userId");

-- CreateIndex
CREATE INDEX "productions_dishId_idx" ON "productions"("dishId");

-- CreateIndex
CREATE INDEX "productions_productionDate_idx" ON "productions"("productionDate");

-- CreateIndex
CREATE INDEX "productions_userId_idx" ON "productions"("userId");

-- CreateIndex
CREATE INDEX "dlcs_productId_idx" ON "dlcs"("productId");

-- CreateIndex
CREATE INDEX "dlcs_expirationDate_idx" ON "dlcs"("expirationDate");

-- CreateIndex
CREATE INDEX "dlcs_status_idx" ON "dlcs"("status");

-- CreateIndex
CREATE INDEX "dlcs_supplierId_idx" ON "dlcs"("supplierId");

-- CreateIndex
CREATE INDEX "price_history_productId_idx" ON "price_history"("productId");

-- CreateIndex
CREATE INDEX "price_history_changedAt_idx" ON "price_history"("changedAt");

-- CreateIndex
CREATE INDEX "price_history_billId_idx" ON "price_history"("billId");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "recipe_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "composite_ingredients" ADD CONSTRAINT "composite_ingredients_compositeProductId_fkey" FOREIGN KEY ("compositeProductId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "composite_ingredients" ADD CONSTRAINT "composite_ingredients_baseProductId_fkey" FOREIGN KEY ("baseProductId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_billId_fkey" FOREIGN KEY ("billId") REFERENCES "bills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "disputes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_productionId_fkey" FOREIGN KEY ("productionId") REFERENCES "productions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_products" ADD CONSTRAINT "bill_products_billId_fkey" FOREIGN KEY ("billId") REFERENCES "bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_products" ADD CONSTRAINT "bill_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_billId_fkey" FOREIGN KEY ("billId") REFERENCES "bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_products" ADD CONSTRAINT "dispute_products_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "disputes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_products" ADD CONSTRAINT "dispute_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_categories" ADD CONSTRAINT "recipe_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "recipe_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dishes" ADD CONSTRAINT "dishes_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "recipe_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dishes" ADD CONSTRAINT "dishes_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "dish_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "dishes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_sections" ADD CONSTRAINT "menu_sections_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_dishes" ADD CONSTRAINT "menu_dishes_menuSectionId_fkey" FOREIGN KEY ("menuSectionId") REFERENCES "menu_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_dishes" ADD CONSTRAINT "menu_dishes_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "dishes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "dishes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productions" ADD CONSTRAINT "productions_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "dishes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productions" ADD CONSTRAINT "productions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dlcs" ADD CONSTRAINT "dlcs_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dlcs" ADD CONSTRAINT "dlcs_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_billId_fkey" FOREIGN KEY ("billId") REFERENCES "bills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
