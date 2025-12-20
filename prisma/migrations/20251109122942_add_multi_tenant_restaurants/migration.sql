-- Step 1: Create the new tables and enums
CREATE TYPE "RestaurantRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- Create Restaurant table
CREATE TABLE "restaurants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id")
);

-- Create UserRestaurant join table
CREATE TABLE "user_restaurants" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "role" "RestaurantRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_restaurants_pkey" PRIMARY KEY ("id")
);

-- Step 2: Create a default restaurant for existing data
INSERT INTO "restaurants" ("id", "name", "slug", "description", "createdAt", "updatedAt")
VALUES (
    'default-restaurant-' || gen_random_uuid()::text,
    'My Restaurant',
    'my-restaurant',
    'Default restaurant migrated from existing data',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Step 3: Add restaurantId columns as NULLABLE first
ALTER TABLE "products" ADD COLUMN "restaurantId" TEXT;
ALTER TABLE "suppliers" ADD COLUMN "restaurantId" TEXT;
ALTER TABLE "bills" ADD COLUMN "restaurantId" TEXT;
ALTER TABLE "disputes" ADD COLUMN "restaurantId" TEXT;
ALTER TABLE "recipe_categories" ADD COLUMN "restaurantId" TEXT;
ALTER TABLE "dish_folders" ADD COLUMN "restaurantId" TEXT;
ALTER TABLE "dishes" ADD COLUMN "restaurantId" TEXT;
ALTER TABLE "menus" ADD COLUMN "restaurantId" TEXT;
ALTER TABLE "menu_sections" ADD COLUMN "restaurantId" TEXT;
ALTER TABLE "sales" ADD COLUMN "restaurantId" TEXT;
ALTER TABLE "productions" ADD COLUMN "restaurantId" TEXT;
ALTER TABLE "byproducts" ADD COLUMN "restaurantId" TEXT;
ALTER TABLE "byproduct_suggestions" ADD COLUMN "restaurantId" TEXT;
ALTER TABLE "dlcs" ADD COLUMN "restaurantId" TEXT;
ALTER TABLE "price_history" ADD COLUMN "restaurantId" TEXT;

-- Step 4: Populate restaurantId for all existing records
UPDATE "products" SET "restaurantId" = (SELECT "id" FROM "restaurants" LIMIT 1) WHERE "restaurantId" IS NULL;
UPDATE "suppliers" SET "restaurantId" = (SELECT "id" FROM "restaurants" LIMIT 1) WHERE "restaurantId" IS NULL;
UPDATE "bills" SET "restaurantId" = (SELECT "id" FROM "restaurants" LIMIT 1) WHERE "restaurantId" IS NULL;
UPDATE "disputes" SET "restaurantId" = (SELECT "id" FROM "restaurants" LIMIT 1) WHERE "restaurantId" IS NULL;
UPDATE "recipe_categories" SET "restaurantId" = (SELECT "id" FROM "restaurants" LIMIT 1) WHERE "restaurantId" IS NULL;
UPDATE "dish_folders" SET "restaurantId" = (SELECT "id" FROM "restaurants" LIMIT 1) WHERE "restaurantId" IS NULL;
UPDATE "dishes" SET "restaurantId" = (SELECT "id" FROM "restaurants" LIMIT 1) WHERE "restaurantId" IS NULL;
UPDATE "menus" SET "restaurantId" = (SELECT "id" FROM "restaurants" LIMIT 1) WHERE "restaurantId" IS NULL;
UPDATE "menu_sections" SET "restaurantId" = (SELECT "id" FROM "restaurants" LIMIT 1) WHERE "restaurantId" IS NULL;
UPDATE "sales" SET "restaurantId" = (SELECT "id" FROM "restaurants" LIMIT 1) WHERE "restaurantId" IS NULL;
UPDATE "productions" SET "restaurantId" = (SELECT "id" FROM "restaurants" LIMIT 1) WHERE "restaurantId" IS NULL;
UPDATE "byproducts" SET "restaurantId" = (SELECT "id" FROM "restaurants" LIMIT 1) WHERE "restaurantId" IS NULL;
UPDATE "byproduct_suggestions" SET "restaurantId" = (SELECT "id" FROM "restaurants" LIMIT 1) WHERE "restaurantId" IS NULL;
UPDATE "dlcs" SET "restaurantId" = (SELECT "id" FROM "restaurants" LIMIT 1) WHERE "restaurantId" IS NULL;
UPDATE "price_history" SET "restaurantId" = (SELECT "id" FROM "restaurants" LIMIT 1) WHERE "restaurantId" IS NULL;

-- Step 5: Make restaurantId columns NOT NULL
ALTER TABLE "products" ALTER COLUMN "restaurantId" SET NOT NULL;
ALTER TABLE "suppliers" ALTER COLUMN "restaurantId" SET NOT NULL;
ALTER TABLE "bills" ALTER COLUMN "restaurantId" SET NOT NULL;
ALTER TABLE "disputes" ALTER COLUMN "restaurantId" SET NOT NULL;
ALTER TABLE "recipe_categories" ALTER COLUMN "restaurantId" SET NOT NULL;
ALTER TABLE "dish_folders" ALTER COLUMN "restaurantId" SET NOT NULL;
ALTER TABLE "dishes" ALTER COLUMN "restaurantId" SET NOT NULL;
ALTER TABLE "menus" ALTER COLUMN "restaurantId" SET NOT NULL;
ALTER TABLE "menu_sections" ALTER COLUMN "restaurantId" SET NOT NULL;
ALTER TABLE "sales" ALTER COLUMN "restaurantId" SET NOT NULL;
ALTER TABLE "productions" ALTER COLUMN "restaurantId" SET NOT NULL;
ALTER TABLE "byproducts" ALTER COLUMN "restaurantId" SET NOT NULL;
ALTER TABLE "byproduct_suggestions" ALTER COLUMN "restaurantId" SET NOT NULL;
ALTER TABLE "dlcs" ALTER COLUMN "restaurantId" SET NOT NULL;
ALTER TABLE "price_history" ALTER COLUMN "restaurantId" SET NOT NULL;

-- Step 6: Make passwordHash optional for OAuth users
ALTER TABLE "users" ALTER COLUMN "passwordHash" DROP NOT NULL;

-- Step 7: Create indexes
CREATE UNIQUE INDEX "restaurants_slug_key" ON "restaurants"("slug");
CREATE INDEX "restaurants_slug_idx" ON "restaurants"("slug");
CREATE INDEX "user_restaurants_userId_idx" ON "user_restaurants"("userId");
CREATE INDEX "user_restaurants_restaurantId_idx" ON "user_restaurants"("restaurantId");
CREATE UNIQUE INDEX "user_restaurants_userId_restaurantId_key" ON "user_restaurants"("userId", "restaurantId");
CREATE INDEX "products_restaurantId_idx" ON "products"("restaurantId");
CREATE INDEX "suppliers_restaurantId_idx" ON "suppliers"("restaurantId");
CREATE INDEX "bills_restaurantId_idx" ON "bills"("restaurantId");
CREATE INDEX "disputes_restaurantId_idx" ON "disputes"("restaurantId");
CREATE INDEX "recipe_categories_restaurantId_idx" ON "recipe_categories"("restaurantId");
CREATE INDEX "dish_folders_restaurantId_idx" ON "dish_folders"("restaurantId");
CREATE INDEX "dishes_restaurantId_idx" ON "dishes"("restaurantId");
CREATE INDEX "menus_restaurantId_idx" ON "menus"("restaurantId");
CREATE INDEX "menu_sections_restaurantId_idx" ON "menu_sections"("restaurantId");
CREATE INDEX "sales_restaurantId_idx" ON "sales"("restaurantId");
CREATE INDEX "productions_restaurantId_idx" ON "productions"("restaurantId");
CREATE INDEX "byproducts_restaurantId_idx" ON "byproducts"("restaurantId");
CREATE INDEX "byproduct_suggestions_restaurantId_idx" ON "byproduct_suggestions"("restaurantId");
CREATE INDEX "dlcs_restaurantId_idx" ON "dlcs"("restaurantId");
CREATE INDEX "price_history_restaurantId_idx" ON "price_history"("restaurantId");

-- Step 8: Add foreign key constraints
ALTER TABLE "user_restaurants" ADD CONSTRAINT "user_restaurants_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_restaurants" ADD CONSTRAINT "user_restaurants_restaurantId_fkey"
    FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "products" ADD CONSTRAINT "products_restaurantId_fkey"
    FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_restaurantId_fkey"
    FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bills" ADD CONSTRAINT "bills_restaurantId_fkey"
    FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "disputes" ADD CONSTRAINT "disputes_restaurantId_fkey"
    FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "recipe_categories" ADD CONSTRAINT "recipe_categories_restaurantId_fkey"
    FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "dish_folders" ADD CONSTRAINT "dish_folders_restaurantId_fkey"
    FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "dishes" ADD CONSTRAINT "dishes_restaurantId_fkey"
    FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "menus" ADD CONSTRAINT "menus_restaurantId_fkey"
    FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "menu_sections" ADD CONSTRAINT "menu_sections_restaurantId_fkey"
    FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sales" ADD CONSTRAINT "sales_restaurantId_fkey"
    FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "productions" ADD CONSTRAINT "productions_restaurantId_fkey"
    FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "byproducts" ADD CONSTRAINT "byproducts_restaurantId_fkey"
    FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "byproduct_suggestions" ADD CONSTRAINT "byproduct_suggestions_restaurantId_fkey"
    FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "dlcs" ADD CONSTRAINT "dlcs_restaurantId_fkey"
    FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "price_history" ADD CONSTRAINT "price_history_restaurantId_fkey"
    FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
