-- Add default inventory categories
-- These are predefined categories that users can use as a starting point

INSERT INTO "recipe_categories" ("id", "name", "icon", "color", "order", "parentId", "categoryType", "isPredefined", "createdAt", "updatedAt")
VALUES
  -- Top-level inventory categories
  ('inv-cat-herbs', 'Herbes aromatiques', '🌿', '#228B22', 1, NULL, 'INVENTORY', true, NOW(), NOW()),
  ('inv-cat-condiments', 'Condiments', '🧂', '#DAA520', 2, NULL, 'INVENTORY', true, NOW(), NOW()),
  ('inv-cat-vegetables', 'Légumes', '🥬', '#3CB371', 3, NULL, 'INVENTORY', true, NOW(), NOW()),
  ('inv-cat-proteins', 'Protéines', '🥩', '#8B4513', 4, NULL, 'INVENTORY', true, NOW(), NOW()),
  ('inv-cat-dairy', 'Produits laitiers', '🥛', '#F0E68C', 5, NULL, 'INVENTORY', true, NOW(), NOW()),
  ('inv-cat-dry-goods', 'Produits secs', '📦', '#D2B48C', 6, NULL, 'INVENTORY', true, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;
