-- CreateEnum for CategoryType
CREATE TYPE "CategoryType" AS ENUM ('DISH', 'PREPARED_INGREDIENT');

-- CreateTable: recipe_categories
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

-- CreateIndex
CREATE INDEX "recipe_categories_order_idx" ON "recipe_categories"("order");
CREATE INDEX "recipe_categories_parentId_idx" ON "recipe_categories"("parentId");
CREATE INDEX "recipe_categories_categoryType_idx" ON "recipe_categories"("categoryType");

-- AddForeignKey (self-referencing for hierarchy)
ALTER TABLE "recipe_categories" ADD CONSTRAINT "recipe_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "recipe_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing DishFolder data to RecipeCategory
INSERT INTO "recipe_categories" (id, name, color, "order", "categoryType", "isPredefined", "createdAt", "updatedAt")
SELECT id, name, color, "order", 'DISH'::"CategoryType", false, "createdAt", "updatedAt"
FROM "dish_folders";

-- Add categoryId column to dishes table
ALTER TABLE "dishes" ADD COLUMN "categoryId" TEXT;

-- Migrate folderId to categoryId
UPDATE "dishes" SET "categoryId" = "folderId";

-- Create index for categoryId
CREATE INDEX "dishes_categoryId_idx" ON "dishes"("categoryId");

-- Add foreign key constraint
ALTER TABLE "dishes" ADD CONSTRAINT "dishes_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "recipe_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add categoryId column to products table (for prepared ingredients)
ALTER TABLE "products" ADD COLUMN "categoryId" TEXT;

-- Create index for products categoryId
CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");

-- Add foreign key constraint for products
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "recipe_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Insert predefined DISH categories (parent chapters)
INSERT INTO "recipe_categories" (id, name, icon, color, "order", "categoryType", "isPredefined", "createdAt", "updatedAt") VALUES
  (gen_random_uuid()::text, 'Bases & Fonds', '📚', '#8B4513', 1, 'DISH', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Sauces', '🥫', '#DC143C', 2, 'DISH', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Entrées Froides', '🥗', '#32CD32', 3, 'DISH', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Entrées Chaudes', '🍲', '#FF8C00', 4, 'DISH', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Poissons', '🐟', '#4682B4', 5, 'DISH', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Viandes', '🥩', '#8B0000', 6, 'DISH', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Desserts', '🍰', '#FF69B4', 7, 'DISH', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert sub-categories for "Bases & Fonds"
WITH parent AS (SELECT id FROM "recipe_categories" WHERE name = 'Bases & Fonds' AND "isPredefined" = true LIMIT 1)
INSERT INTO "recipe_categories" (id, name, "parentId", "order", "categoryType", "isPredefined", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 'Fonds Blancs', parent.id, 1, 'DISH', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM parent
UNION ALL
SELECT gen_random_uuid()::text, 'Fonds Bruns', parent.id, 2, 'DISH', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM parent
UNION ALL
SELECT gen_random_uuid()::text, 'Fumets', parent.id, 3, 'DISH', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM parent;

-- Insert sub-categories for "Sauces"
WITH parent AS (SELECT id FROM "recipe_categories" WHERE name = 'Sauces' AND "isPredefined" = true LIMIT 1)
INSERT INTO "recipe_categories" (id, name, "parentId", "order", "categoryType", "isPredefined", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 'Sauces Mères', parent.id, 1, 'DISH', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM parent
UNION ALL
SELECT gen_random_uuid()::text, 'Sauces Dérivées', parent.id, 2, 'DISH', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM parent
UNION ALL
SELECT gen_random_uuid()::text, 'Émulsions', parent.id, 3, 'DISH', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM parent;

-- Insert sub-categories for "Desserts"
WITH parent AS (SELECT id FROM "recipe_categories" WHERE name = 'Desserts' AND "isPredefined" = true LIMIT 1)
INSERT INTO "recipe_categories" (id, name, "parentId", "order", "categoryType", "isPredefined", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 'Pâtisserie', parent.id, 1, 'DISH', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM parent
UNION ALL
SELECT gen_random_uuid()::text, 'Glaces & Sorbets', parent.id, 2, 'DISH', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM parent
UNION ALL
SELECT gen_random_uuid()::text, 'Desserts à l''Assiette', parent.id, 3, 'DISH', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM parent;

-- Insert predefined PREPARED_INGREDIENT categories
INSERT INTO "recipe_categories" (id, name, icon, color, "order", "categoryType", "isPredefined", "createdAt", "updatedAt") VALUES
  (gen_random_uuid()::text, 'Assaisonnements', '🧂', '#FFD700', 1, 'PREPARED_INGREDIENT', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Herbes & Mélanges', '🌿', '#228B22', 2, 'PREPARED_INGREDIENT', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Crèmes & Bases', '🥛', '#F5F5DC', 3, 'PREPARED_INGREDIENT', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Sirops & Coulis', '🍯', '#DAA520', 4, 'PREPARED_INGREDIENT', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Pâtes', '🥖', '#D2691E', 5, 'PREPARED_INGREDIENT', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Note: We keep the dish_folders table and folderId column for now
-- They can be dropped in a future migration after verifying the new system works
-- To drop them later:
-- ALTER TABLE "dishes" DROP CONSTRAINT "dishes_folderId_fkey";
-- DROP INDEX "dishes_folderId_idx";
-- ALTER TABLE "dishes" DROP COLUMN "folderId";
-- DROP TABLE "dish_folders";
