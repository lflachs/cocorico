# Category System Migration Plan

## Goal
Transform the folder system into a hierarchical category/chapter system that matches the cookbook metaphor.

## Database Changes

### 1. Rename and Enhance DishFolder → RecipeCategory

**Changes to existing DishFolder:**
- Rename to `RecipeCategory` (more semantic)
- Add `parentId` for hierarchical structure (self-referencing)
- Add `icon` field for visual representation
- Add `categoryType` to distinguish between DISH and PREPARED_INGREDIENT categories
- Add `isPredefined` to mark system categories vs custom user categories
- Keep existing `name`, `color`, `order` fields

### 2. New Schema Structure

```prisma
model RecipeCategory {
  id        String   @id @default(cuid())
  name      String
  icon      String?  // Emoji or icon identifier
  color     String?  // Hex color for visual organization
  order     Int      @default(0) // Display order within same level

  // Hierarchical structure
  parentId  String?
  parent    RecipeCategory?  @relation("CategoryHierarchy", fields: [parentId], references: [id], onDelete: Cascade)
  children  RecipeCategory[] @relation("CategoryHierarchy")

  // Category type
  categoryType CategoryType @default(DISH) // DISH or PREPARED_INGREDIENT
  isPredefined Boolean      @default(false) // System-defined vs user-created

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  dishes            Dish[]
  preparedProducts  Product[] @relation("PreparedProductCategory") // For composite products

  @@index([order])
  @@index([parentId])
  @@index([categoryType])
  @@map("recipe_categories")
}

enum CategoryType {
  DISH                // For recipes/dishes
  PREPARED_INGREDIENT // For prepared/composite ingredients
}
```

### 3. Update Dish Model
- Change `folderId` → `categoryId`
- Change relation from `folder` → `category`

```prisma
model Dish {
  // ... existing fields ...

  // Category organization (changed from folderId)
  categoryId String?
  category   RecipeCategory? @relation(fields: [categoryId], references: [id], onDelete: SetNull)

  // ... rest of model ...

  @@index([categoryId]) // Changed from folderId
}
```

### 4. Update Product Model (for prepared ingredients)
Add category relationship for composite products:

```prisma
model Product {
  // ... existing fields ...

  // Category for composite/prepared products
  categoryId String?
  category   RecipeCategory? @relation("PreparedProductCategory", fields: [categoryId], references: [id], onDelete: SetNull)

  // ... rest of model ...

  @@index([categoryId])
}
```

## Migration Strategy

### Step 1: Create RecipeCategory table and enum
```sql
-- Create enum
CREATE TYPE "CategoryType" AS ENUM ('DISH', 'PREPARED_INGREDIENT');

-- Create new table
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

-- Add self-referencing foreign key
ALTER TABLE "recipe_categories"
  ADD CONSTRAINT "recipe_categories_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "recipe_categories"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes
CREATE INDEX "recipe_categories_order_idx" ON "recipe_categories"("order");
CREATE INDEX "recipe_categories_parentId_idx" ON "recipe_categories"("parentId");
CREATE INDEX "recipe_categories_categoryType_idx" ON "recipe_categories"("categoryType");
```

### Step 2: Migrate existing DishFolder data
```sql
-- Copy all dish folders to recipe_categories
INSERT INTO "recipe_categories" (id, name, color, "order", "categoryType", "isPredefined", "createdAt", "updatedAt")
SELECT id, name, color, "order", 'DISH'::"CategoryType", false, "createdAt", "updatedAt"
FROM "dish_folders";
```

### Step 3: Update Dish table
```sql
-- Add categoryId column
ALTER TABLE "dishes" ADD COLUMN "categoryId" TEXT;

-- Migrate folderId to categoryId
UPDATE "dishes" SET "categoryId" = "folderId";

-- Add foreign key constraint
ALTER TABLE "dishes"
  ADD CONSTRAINT "dishes_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "recipe_categories"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Create index
CREATE INDEX "dishes_categoryId_idx" ON "dishes"("categoryId");

-- Drop old folderId (after verification)
-- ALTER TABLE "dishes" DROP CONSTRAINT "dishes_folderId_fkey";
-- DROP INDEX "dishes_folderId_idx";
-- ALTER TABLE "dishes" DROP COLUMN "folderId";
```

### Step 4: Update Product table for composite products
```sql
-- Add categoryId column for prepared ingredients
ALTER TABLE "products" ADD COLUMN "categoryId" TEXT;

-- Add foreign key constraint
ALTER TABLE "products"
  ADD CONSTRAINT "products_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "recipe_categories"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Create index
CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");
```

### Step 5: Insert predefined categories

```sql
-- Predefined DISH categories (parent chapters)
INSERT INTO "recipe_categories" (id, name, icon, color, "order", "categoryType", "isPredefined") VALUES
  (gen_random_uuid(), 'Bases & Fonds', '📚', '#8B4513', 1, 'DISH', true),
  (gen_random_uuid(), 'Sauces', '🥫', '#DC143C', 2, 'DISH', true),
  (gen_random_uuid(), 'Entrées Froides', '🥗', '#32CD32', 3, 'DISH', true),
  (gen_random_uuid(), 'Entrées Chaudes', '🍲', '#FF8C00', 4, 'DISH', true),
  (gen_random_uuid(), 'Poissons', '🐟', '#4682B4', 5, 'DISH', true),
  (gen_random_uuid(), 'Viandes', '🥩', '#8B0000', 6, 'DISH', true),
  (gen_random_uuid(), 'Desserts', '🍰', '#FF69B4', 7, 'DISH', true);

-- Get parent IDs for sub-categories
-- Sub-categories for "Bases & Fonds"
WITH parent AS (SELECT id FROM "recipe_categories" WHERE name = 'Bases & Fonds' AND "isPredefined" = true LIMIT 1)
INSERT INTO "recipe_categories" (id, name, "parentId", "order", "categoryType", "isPredefined")
SELECT gen_random_uuid(), 'Fonds Blancs', parent.id, 1, 'DISH', true FROM parent
UNION ALL
SELECT gen_random_uuid(), 'Fonds Bruns', parent.id, 2, 'DISH', true FROM parent
UNION ALL
SELECT gen_random_uuid(), 'Fumets', parent.id, 3, 'DISH', true FROM parent;

-- Sub-categories for "Sauces"
WITH parent AS (SELECT id FROM "recipe_categories" WHERE name = 'Sauces' AND "isPredefined" = true LIMIT 1)
INSERT INTO "recipe_categories" (id, name, "parentId", "order", "categoryType", "isPredefined")
SELECT gen_random_uuid(), 'Sauces Mères', parent.id, 1, 'DISH', true FROM parent
UNION ALL
SELECT gen_random_uuid(), 'Sauces Dérivées', parent.id, 2, 'DISH', true FROM parent
UNION ALL
SELECT gen_random_uuid(), 'Émulsions', parent.id, 3, 'DISH', true FROM parent;

-- Sub-categories for "Desserts"
WITH parent AS (SELECT id FROM "recipe_categories" WHERE name = 'Desserts' AND "isPredefined" = true LIMIT 1)
INSERT INTO "recipe_categories" (id, name, "parentId", "order", "categoryType", "isPredefined")
SELECT gen_random_uuid(), 'Pâtisserie', parent.id, 1, 'DISH', true FROM parent
UNION ALL
SELECT gen_random_uuid(), 'Glaces & Sorbets', parent.id, 2, 'DISH', true FROM parent
UNION ALL
SELECT gen_random_uuid(), 'Desserts à l''Assiette', parent.id, 3, 'DISH', true FROM parent;

-- Predefined PREPARED_INGREDIENT categories
INSERT INTO "recipe_categories" (id, name, icon, color, "order", "categoryType", "isPredefined") VALUES
  (gen_random_uuid(), 'Assaisonnements', '🧂', '#FFD700', 1, 'PREPARED_INGREDIENT', true),
  (gen_random_uuid(), 'Herbes & Mélanges', '🌿', '#228B22', 2, 'PREPARED_INGREDIENT', true),
  (gen_random_uuid(), 'Crèmes & Bases', '🥛', '#F5F5DC', 3, 'PREPARED_INGREDIENT', true),
  (gen_random_uuid(), 'Sirops & Coulis', '🍯', '#DAA520', 4, 'PREPARED_INGREDIENT', true),
  (gen_random_uuid(), 'Pâtes', '🥖', '#D2691E', 5, 'PREPARED_INGREDIENT', true);
```

### Step 6: Drop old dish_folders table (after complete verification)
```sql
-- DROP TABLE "dish_folders";
```

## Predefined Categories Reference

### Dish Categories (Hierarchical)
```
📚 Bases & Fonds
  └─ Fonds Blancs
  └─ Fonds Bruns
  └─ Fumets

🥫 Sauces
  └─ Sauces Mères
  └─ Sauces Dérivées
  └─ Émulsions

🥗 Entrées Froides
🍲 Entrées Chaudes
🐟 Poissons
🥩 Viandes

🍰 Desserts
  └─ Pâtisserie
  └─ Glaces & Sorbets
  └─ Desserts à l'Assiette
```

### Prepared Ingredient Categories
```
🧂 Assaisonnements
🌿 Herbes & Mélanges
🥛 Crèmes & Bases
🍯 Sirops & Coulis
🥖 Pâtes
```

## Breaking Changes

1. **API Changes:**
   - `folderId` → `categoryId` on Dish
   - `folder` → `category` relation
   - DishFolder endpoints → RecipeCategory endpoints

2. **Component Changes:**
   - Update all components using `DishFolder` to use `RecipeCategory`
   - Add support for hierarchical display
   - Update forms to allow category selection with hierarchy

3. **Action Changes:**
   - Rename dish-folder.actions.ts → recipe-category.actions.ts
   - Update all CRUD operations

## Rollback Plan

If migration fails:
1. Keep dish_folders table intact during migration
2. Don't drop folderId column until verified
3. Can rollback by dropping new tables and restoring old foreign keys
