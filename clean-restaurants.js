const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning orphaned restaurants...\n');

  // Delete the orphaned restaurant
  const deleted = await prisma.restaurant.deleteMany({
    where: {
      users: {
        none: {}
      }
    }
  });

  console.log(`✅ Deleted ${deleted.count} orphaned restaurant(s)\n`);

  // Show current state
  const restaurants = await prisma.restaurant.findMany({
    include: {
      users: true
    }
  });

  console.log(`Remaining restaurants: ${restaurants.length}`);

  if (restaurants.length === 0) {
    console.log('✅ Database is clean! You should now be prompted to create a restaurant.\n');
    console.log('Next steps:');
    console.log('1. Refresh your browser');
    console.log('2. You should be redirected to /select-restaurant');
    console.log('3. Create your restaurant');
  }

  await prisma.$disconnect();
}

main().catch(console.error);
