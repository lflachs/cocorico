import { db as prisma } from '../src/lib/db/client';

async function main() {
  console.log('🚀 Starting migration to recipe categories...\n');

  // Step 1: Migrate existing DishFolders to RecipeCategories
  console.log('📂 Step 1: Migrating existing dish folders to categories...');
  const existingFolders = await prisma.dishFolder.findMany();

  if (existingFolders.length > 0) {
    console.log(`   Found ${existingFolders.length} existing folders to migrate`);

    for (const folder of existingFolders) {
      const existingCategory = await prisma.recipeCategory.findFirst({
        where: { id: folder.id }
      });

      if (!existingCategory) {
        await prisma.recipeCategory.create({
          data: {
            id: folder.id,
            name: folder.name,
            color: folder.color,
            order: folder.order,
            categoryType: 'DISH',
            isPredefined: false,
            createdAt: folder.createdAt,
            updatedAt: folder.updatedAt,
          },
        });
        console.log(`   ✓ Migrated folder: ${folder.name}`);
      }
    }
  } else {
    console.log('   No existing folders to migrate');
  }

  // Step 2: Copy folderId to categoryId for all dishes
  console.log('\n🍽️  Step 2: Updating dishes with category references...');
  const dishesWithFolders = await prisma.dish.findMany({
    where: {
      folderId: { not: null },
    },
  });

  if (dishesWithFolders.length > 0) {
    console.log(`   Found ${dishesWithFolders.length} dishes with folder assignments`);

    for (const dish of dishesWithFolders) {
      await prisma.dish.update({
        where: { id: dish.id },
        data: { categoryId: dish.folderId },
      });
    }
    console.log(`   ✓ Updated ${dishesWithFolders.length} dishes`);
  } else {
    console.log('   No dishes to update');
  }

  // Step 3: Insert predefined DISH categories
  console.log('\n📚 Step 3: Creating predefined recipe categories...');

  const predefinedDishCategories = [
    { name: 'Bases & Fonds', icon: '📚', color: '#8B4513', order: 1 },
    { name: 'Sauces', icon: '🥫', color: '#DC143C', order: 2 },
    { name: 'Entrées Froides', icon: '🥗', color: '#32CD32', order: 3 },
    { name: 'Entrées Chaudes', icon: '🍲', color: '#FF8C00', order: 4 },
    { name: 'Poissons', icon: '🐟', color: '#4682B4', order: 5 },
    { name: 'Viandes', icon: '🥩', color: '#8B0000', order: 6 },
    { name: 'Desserts', icon: '🍰', color: '#FF69B4', order: 7 },
  ];

  for (const category of predefinedDishCategories) {
    const existing = await prisma.recipeCategory.findFirst({
      where: {
        name: category.name,
        categoryType: 'DISH',
        isPredefined: true,
      },
    });

    if (!existing) {
      await prisma.recipeCategory.create({
        data: {
          ...category,
          categoryType: 'DISH',
          isPredefined: true,
        },
      });
      console.log(`   ✓ Created: ${category.icon} ${category.name}`);
    }
  }

  // Step 4: Insert sub-categories for "Bases & Fonds"
  console.log('\n📖 Step 4: Creating sub-categories...');

  const basesFonds = await prisma.recipeCategory.findFirst({
    where: { name: 'Bases & Fonds', isPredefined: true },
  });

  if (basesFonds) {
    const subCategories = [
      { name: 'Fonds Blancs', order: 1 },
      { name: 'Fonds Bruns', order: 2 },
      { name: 'Fumets', order: 3 },
    ];

    for (const sub of subCategories) {
      const existing = await prisma.recipeCategory.findFirst({
        where: { name: sub.name, parentId: basesFonds.id },
      });

      if (!existing) {
        await prisma.recipeCategory.create({
          data: {
            name: sub.name,
            order: sub.order,
            parentId: basesFonds.id,
            categoryType: 'DISH',
            isPredefined: true,
          },
        });
        console.log(`   ✓ Created sub-category: ${sub.name}`);
      }
    }
  }

  // Step 5: Insert sub-categories for "Sauces"
  const sauces = await prisma.recipeCategory.findFirst({
    where: { name: 'Sauces', isPredefined: true },
  });

  if (sauces) {
    const subCategories = [
      { name: 'Sauces Mères', order: 1 },
      { name: 'Sauces Dérivées', order: 2 },
      { name: 'Émulsions', order: 3 },
    ];

    for (const sub of subCategories) {
      const existing = await prisma.recipeCategory.findFirst({
        where: { name: sub.name, parentId: sauces.id },
      });

      if (!existing) {
        await prisma.recipeCategory.create({
          data: {
            name: sub.name,
            order: sub.order,
            parentId: sauces.id,
            categoryType: 'DISH',
            isPredefined: true,
          },
        });
        console.log(`   ✓ Created sub-category: ${sub.name}`);
      }
    }
  }

  // Step 6: Insert sub-categories for "Desserts"
  const desserts = await prisma.recipeCategory.findFirst({
    where: { name: 'Desserts', isPredefined: true },
  });

  if (desserts) {
    const subCategories = [
      { name: 'Pâtisserie', order: 1 },
      { name: 'Glaces & Sorbets', order: 2 },
      { name: "Desserts à l'Assiette", order: 3 },
    ];

    for (const sub of subCategories) {
      const existing = await prisma.recipeCategory.findFirst({
        where: { name: sub.name, parentId: desserts.id },
      });

      if (!existing) {
        await prisma.recipeCategory.create({
          data: {
            name: sub.name,
            order: sub.order,
            parentId: desserts.id,
            categoryType: 'DISH',
            isPredefined: true,
          },
        });
        console.log(`   ✓ Created sub-category: ${sub.name}`);
      }
    }
  }

  // Step 7: Insert predefined PREPARED_INGREDIENT categories
  console.log('\n🧪 Step 5: Creating prepared ingredient categories...');

  const preparedCategories = [
    { name: 'Assaisonnements', icon: '🧂', color: '#FFD700', order: 1 },
    { name: 'Herbes & Mélanges', icon: '🌿', color: '#228B22', order: 2 },
    { name: 'Crèmes & Bases', icon: '🥛', color: '#F5F5DC', order: 3 },
    { name: 'Sirops & Coulis', icon: '🍯', color: '#DAA520', order: 4 },
    { name: 'Pâtes', icon: '🥖', color: '#D2691E', order: 5 },
  ];

  for (const category of preparedCategories) {
    const existing = await prisma.recipeCategory.findFirst({
      where: {
        name: category.name,
        categoryType: 'PREPARED_INGREDIENT',
        isPredefined: true,
      },
    });

    if (!existing) {
      await prisma.recipeCategory.create({
        data: {
          ...category,
          categoryType: 'PREPARED_INGREDIENT',
          isPredefined: true,
        },
      });
      console.log(`   ✓ Created: ${category.icon} ${category.name}`);
    }
  }

  console.log('\n✅ Migration complete!\n');
  console.log('Summary:');
  const totalCategories = await prisma.recipeCategory.count();
  const dishCategories = await prisma.recipeCategory.count({
    where: { categoryType: 'DISH' },
  });
  const preparedCategories_count = await prisma.recipeCategory.count({
    where: { categoryType: 'PREPARED_INGREDIENT' },
  });
  const dishesWithCategories = await prisma.dish.count({
    where: { categoryId: { not: null } },
  });

  console.log(`   Total categories: ${totalCategories}`);
  console.log(`   - Dish categories: ${dishCategories}`);
  console.log(`   - Prepared ingredient categories: ${preparedCategories_count}`);
  console.log(`   Dishes with categories: ${dishesWithCategories}`);
}

main()
  .catch((e) => {
    console.error('Error during migration:', e);
    process.exit(1);
  });
