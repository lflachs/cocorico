import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Deleting all byproduct suggestions...');

  const result = await prisma.byproductSuggestion.deleteMany({});

  console.log(`✅ Deleted ${result.count} byproduct suggestions`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
