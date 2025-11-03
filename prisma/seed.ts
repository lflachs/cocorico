import { PrismaClient, Unit, UserRole, MovementType, PricingType, DLCStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clean up existing data (in reverse order of dependencies)
  console.log('🧹 Cleaning up existing data...');
  await prisma.sale.deleteMany();
  await prisma.production.deleteMany();
  await prisma.dLC.deleteMany();
  await prisma.menuDish.deleteMany();
  await prisma.menuSection.deleteMany();
  await prisma.menu.deleteMany();
  await prisma.recipeIngredient.deleteMany();
  await prisma.dish.deleteMany();
  await prisma.recipeCategory.deleteMany(); // Delete recipe categories
  await prisma.stockMovement.deleteMany();
  await prisma.billProduct.deleteMany();
  await prisma.disputeProduct.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.priceHistory.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.compositeIngredient.deleteMany();
  await prisma.product.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Cleanup complete\n');

  // ============================================================================
  // USERS
  // ============================================================================
  console.log('👤 Creating users...');
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@cocorico.fr',
      name: 'Chef Alexandre',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
    },
  });

  const user = await prisma.user.create({
    data: {
      email: 'user@cocorico.fr',
      name: 'Sous-Chef Marie',
      passwordHash: userPassword,
      role: UserRole.USER,
    },
  });
  console.log('✅ Created 2 users\n');

  // ============================================================================
  // SUPPLIERS
  // ============================================================================
  console.log('🏢 Creating suppliers...');

  const metro = await prisma.supplier.create({
    data: {
      name: 'Metro Cash & Carry',
      contactName: 'Jean Dupont',
      email: 'commandes@metro.fr',
      phone: '+33 1 40 12 34 56',
      address: '15 Avenue des Champs, 75008 Paris',
      notes: 'Livraisons du lundi au vendredi, 7h-10h',
      isActive: true,
    },
  });

  const rungis = await prisma.supplier.create({
    data: {
      name: 'Rungis Marée',
      contactName: 'Marie Leclerc',
      email: 'poissons@rungis-maree.fr',
      phone: '+33 1 45 67 89 01',
      address: 'MIN de Rungis, Pavillon B3, 94150 Rungis',
      notes: 'Spécialiste poissons et fruits de mer. Livraison quotidienne.',
      isActive: true,
    },
  });

  const lactalis = await prisma.supplier.create({
    data: {
      name: 'Lactalis',
      contactName: 'Pierre Martin',
      email: 'pro@lactalis.fr',
      phone: '+33 2 43 59 00 00',
      address: '10 rue Adolphe Beck, 53000 Laval',
      notes: 'Produits laitiers premium',
      isActive: true,
    },
  });

  const legumes = await prisma.supplier.create({
    data: {
      name: 'Les Jardins du Marais',
      contactName: 'Sophie Dubois',
      email: 'contact@jardins-marais.fr',
      phone: '+33 1 48 87 65 43',
      address: '28 rue des Maraîchers, 75020 Paris',
      notes: 'Légumes bio et de saison',
      isActive: true,
    },
  });

  const epicerie = await prisma.supplier.create({
    data: {
      name: 'Épicerie Centrale',
      contactName: 'Luc Bernard',
      email: 'commandes@epicerie-centrale.fr',
      phone: '+33 1 42 36 78 90',
      address: '5 boulevard Haussmann, 75009 Paris',
      notes: 'Épicerie sèche et conserves',
      isActive: true,
    },
  });

  console.log('✅ Created 5 suppliers\n');

  // ============================================================================
  // INVENTORY CATEGORIES
  // ============================================================================
  console.log('📦 Creating inventory categories...');

  const herbesAromatiquesCat = await prisma.recipeCategory.create({
    data: {
      name: 'Herbes aromatiques',
      icon: '🌿',
      color: '#228B22',
      order: 1,
      categoryType: 'INVENTORY',
      isPredefined: true,
    },
  });

  const condimentsCat = await prisma.recipeCategory.create({
    data: {
      name: 'Condiments',
      icon: '🧂',
      color: '#DAA520',
      order: 2,
      categoryType: 'INVENTORY',
      isPredefined: true,
    },
  });

  const legumesCat = await prisma.recipeCategory.create({
    data: {
      name: 'Légumes',
      icon: '🥬',
      color: '#3CB371',
      order: 3,
      categoryType: 'INVENTORY',
      isPredefined: true,
    },
  });

  const proteinesCat = await prisma.recipeCategory.create({
    data: {
      name: 'Protéines',
      icon: '🥩',
      color: '#8B4513',
      order: 4,
      categoryType: 'INVENTORY',
      isPredefined: true,
    },
  });

  const produitslaitiersCat = await prisma.recipeCategory.create({
    data: {
      name: 'Produits laitiers',
      icon: '🥛',
      color: '#F0E68C',
      order: 5,
      categoryType: 'INVENTORY',
      isPredefined: true,
    },
  });

  const produitsSecsCat = await prisma.recipeCategory.create({
    data: {
      name: 'Produits secs',
      icon: '📦',
      color: '#D2B48C',
      order: 6,
      categoryType: 'INVENTORY',
      isPredefined: true,
    },
  });

  console.log('✅ Created 6 inventory categories\n');

  // ============================================================================
  // BASE PRODUCTS (Ingredients)
  // ============================================================================
  console.log('📦 Creating base products...');
  const products = await Promise.all([
    // Dairy
    prisma.product.create({
      data: {
        name: 'Lait entier',
        quantity: 12, // BELOW parLevel (30) -> CRITICAL
        unit: Unit.L,
        unitPrice: 1.2,
        trackable: true,
        parLevel: 30,
        category: 'Produits laitiers',
        categoryId: produitslaitiersCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Crème fraîche 35%',
        quantity: 6, // BELOW parLevel (15) -> CRITICAL
        unit: Unit.L,
        unitPrice: 4.5,
        trackable: true,
        parLevel: 15,
        category: 'Produits laitiers',
        categoryId: produitslaitiersCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Beurre doux',
        quantity: 8, // BELOW parLevel (10) -> LOW
        unit: Unit.KG,
        unitPrice: 8.5,
        trackable: true,
        parLevel: 10,
        category: 'Produits laitiers',
        categoryId: produitslaitiersCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Œufs frais',
        quantity: 85, // BELOW parLevel (200) -> CRITICAL
        unit: Unit.PC,
        unitPrice: 0.25,
        trackable: true,
        parLevel: 200,
        category: 'Produits laitiers',
        categoryId: produitslaitiersCat.id,
        isComposite: false,
      },
    }),

    // Dry goods
    prisma.product.create({
      data: {
        name: 'Farine T55',
        quantity: 100,
        unit: Unit.KG,
        unitPrice: 1.1,
        trackable: true,
        parLevel: 50,
        category: 'Épicerie sèche',
        categoryId: produitsSecsCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Sucre en poudre',
        quantity: 45,
        unit: Unit.KG,
        unitPrice: 1.5,
        trackable: true,
        parLevel: 30,
        category: 'Épicerie sèche',
        categoryId: produitsSecsCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Sel fin',
        quantity: 25,
        unit: Unit.KG,
        unitPrice: 0.8,
        trackable: true,
        parLevel: 15,
        category: 'Épicerie sèche',
        categoryId: condimentsCat.id,
        isComposite: false,
      },
    }),

    // Proteins - Meats
    prisma.product.create({
      data: {
        name: 'Poulet fermier (entier)',
        quantity: 8, // BELOW parLevel (20) -> CRITICAL
        unit: Unit.PC,
        unitPrice: 12.5,
        trackable: true,
        parLevel: 20,
        category: 'Viandes',
        categoryId: proteinesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Magret de canard',
        quantity: 2, // BELOW parLevel (5) -> CRITICAL
        unit: Unit.PC,
        unitPrice: 15.0,
        trackable: true,
        parLevel: 5,
        category: 'Viandes',
        categoryId: proteinesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Filet de bœuf',
        quantity: 3, // BELOW parLevel (8) -> CRITICAL
        unit: Unit.KG,
        unitPrice: 35.0,
        trackable: true,
        parLevel: 8,
        category: 'Viandes',
        categoryId: proteinesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Onglet de bœuf',
        quantity: 10,
        unit: Unit.KG,
        unitPrice: 28.0,
        trackable: true,
        parLevel: 6,
        category: 'Viandes',
        categoryId: proteinesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Quasi de veau',
        quantity: 6,
        unit: Unit.KG,
        unitPrice: 38.0,
        trackable: true,
        parLevel: 4,
        category: 'Viandes',
        categoryId: proteinesCat.id,
        isComposite: false,
      },
    }),
    // Proteins - Seafood
    prisma.product.create({
      data: {
        name: 'Saumon norvégien',
        quantity: 15,
        unit: Unit.KG,
        unitPrice: 22.0,
        trackable: true,
        parLevel: 10,
        category: 'Poissons',
        categoryId: proteinesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Bar de ligne',
        quantity: 3, // BELOW parLevel (6) -> CRITICAL
        unit: Unit.KG,
        unitPrice: 28.0,
        trackable: true,
        parLevel: 6,
        categoryId: proteinesCat.id,
        category: 'Poissons',
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Daurade royale',
        quantity: 5, // BELOW parLevel (8) -> LOW
        unit: Unit.KG,
        unitPrice: 24.0,
        trackable: true,
        parLevel: 8,
        category: 'Poissons',
        categoryId: proteinesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Gambas (grosses crevettes)',
        quantity: 5,
        unit: Unit.KG,
        unitPrice: 32.0,
        trackable: true,
        parLevel: 3,
        category: 'Poissons',
        categoryId: proteinesCat.id,
        isComposite: false,
      },
    }),

    // Vegetables
    prisma.product.create({
      data: {
        name: 'Pommes de terre',
        quantity: 80,
        unit: Unit.KG,
        unitPrice: 1.8,
        trackable: true,
        parLevel: 50,
        category: 'Légumes',
        categoryId: legumesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Carottes',
        quantity: 25,
        unit: Unit.KG,
        unitPrice: 2.0,
        trackable: true,
        parLevel: 15,
        category: 'Légumes',
        categoryId: legumesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Oignons',
        quantity: 30,
        unit: Unit.KG,
        unitPrice: 1.5,
        trackable: true,
        parLevel: 20,
        category: 'Légumes',
        categoryId: legumesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Tomates',
        quantity: 20,
        unit: Unit.KG,
        unitPrice: 3.5,
        trackable: true,
        parLevel: 15,
        category: 'Légumes',
        categoryId: legumesCat.id,
        isComposite: false,
      },
    }),

    // Herbs & Spices
    prisma.product.create({
      data: {
        name: 'Persil frais',
        quantity: 8,
        unit: Unit.BUNCH,
        unitPrice: 2.5,
        trackable: true,
        parLevel: 5,
        category: 'Herbes',
        categoryId: herbesAromatiquesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Thym frais',
        quantity: 6,
        unit: Unit.BUNCH,
        unitPrice: 3.0,
        trackable: true,
        parLevel: 4,
        category: 'Herbes',
        categoryId: herbesAromatiquesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Basilic frais',
        quantity: 5,
        unit: Unit.BUNCH,
        unitPrice: 2.8,
        trackable: true,
        parLevel: 4,
        category: 'Herbes',
        categoryId: herbesAromatiquesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Romarin frais',
        quantity: 4,
        unit: Unit.BUNCH,
        unitPrice: 2.5,
        trackable: true,
        parLevel: 3,
        category: 'Herbes',
        categoryId: herbesAromatiquesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Coriandre fraîche',
        quantity: 6,
        unit: Unit.BUNCH,
        unitPrice: 2.3,
        trackable: true,
        parLevel: 4,
        category: 'Herbes',
        categoryId: herbesAromatiquesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Menthe fraîche',
        quantity: 4,
        unit: Unit.BUNCH,
        unitPrice: 2.5,
        trackable: true,
        parLevel: 3,
        category: 'Herbes',
        categoryId: herbesAromatiquesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Estragon',
        quantity: 3,
        unit: Unit.BUNCH,
        unitPrice: 3.2,
        trackable: true,
        parLevel: 2,
        category: 'Herbes',
        categoryId: herbesAromatiquesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Ciboulette',
        quantity: 5,
        unit: Unit.BUNCH,
        unitPrice: 2.2,
        trackable: true,
        parLevel: 3,
        category: 'Herbes',
        categoryId: herbesAromatiquesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Laurier (feuilles)',
        quantity: 100,
        unit: Unit.G,
        unitPrice: 8.5,
        trackable: true,
        parLevel: 50,
        category: 'Herbes',
        categoryId: herbesAromatiquesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Poivre noir moulu',
        quantity: 500,
        unit: Unit.G,
        unitPrice: 12.0,
        trackable: true,
        parLevel: 200,
        category: 'Condiments',
        categoryId: condimentsCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Poivre noir en grains',
        quantity: 300,
        unit: Unit.G,
        unitPrice: 14.0,
        trackable: true,
        parLevel: 150,
        category: 'Condiments',
        categoryId: condimentsCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Paprika',
        quantity: 200,
        unit: Unit.G,
        unitPrice: 9.5,
        trackable: true,
        parLevel: 100,
        category: 'Condiments',
        categoryId: condimentsCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Cumin',
        quantity: 150,
        unit: Unit.G,
        unitPrice: 10.0,
        trackable: true,
        parLevel: 80,
        category: 'Condiments',
        categoryId: condimentsCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Noix de muscade',
        quantity: 100,
        unit: Unit.G,
        unitPrice: 15.0,
        trackable: true,
        parLevel: 50,
        category: 'Condiments',
        categoryId: condimentsCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Cannelle en poudre',
        quantity: 150,
        unit: Unit.G,
        unitPrice: 11.0,
        trackable: true,
        parLevel: 80,
        category: 'Condiments',
        categoryId: condimentsCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Gousses de vanille',
        quantity: 20,
        unit: Unit.PC,
        unitPrice: 3.5,
        trackable: true,
        parLevel: 10,
        category: 'Condiments',
        categoryId: condimentsCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Curry en poudre',
        quantity: 180,
        unit: Unit.G,
        unitPrice: 8.0,
        trackable: true,
        parLevel: 100,
        category: 'Condiments',
        categoryId: condimentsCat.id,
        isComposite: false,
      },
    }),

    // Oils & Vinegars
    prisma.product.create({
      data: {
        name: 'Huile d\'olive extra vierge',
        quantity: 15,
        unit: Unit.L,
        unitPrice: 12.5,
        trackable: true,
        parLevel: 10,
        category: 'Condiments',
        categoryId: condimentsCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Huile de tournesol',
        quantity: 20,
        unit: Unit.L,
        unitPrice: 3.5,
        trackable: true,
        parLevel: 15,
        category: 'Condiments',
        categoryId: condimentsCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Huile de noix',
        quantity: 2,
        unit: Unit.L,
        unitPrice: 22.0,
        trackable: true,
        parLevel: 1,
        category: 'Condiments',
        categoryId: condimentsCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Vinaigre balsamique',
        quantity: 3,
        unit: Unit.L,
        unitPrice: 8.5,
        trackable: true,
        parLevel: 2,
        category: 'Condiments',
        categoryId: condimentsCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Vinaigre de vin rouge',
        quantity: 4,
        unit: Unit.L,
        unitPrice: 4.5,
        trackable: true,
        parLevel: 2,
        category: 'Condiments',
        categoryId: condimentsCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Vinaigre de vin blanc',
        quantity: 4,
        unit: Unit.L,
        unitPrice: 4.5,
        trackable: true,
        parLevel: 2,
        category: 'Condiments',
        categoryId: condimentsCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Vinaigre de Xérès',
        quantity: 2,
        unit: Unit.L,
        unitPrice: 9.0,
        trackable: true,
        parLevel: 1,
        category: 'Condiments',
        categoryId: condimentsCat.id,
        isComposite: false,
      },
    }),

    // More Vegetables
    prisma.product.create({
      data: {
        name: 'Laitue',
        quantity: 15,
        unit: Unit.PC,
        unitPrice: 1.5,
        trackable: true,
        parLevel: 10,
        category: 'Légumes',
        categoryId: legumesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Champignons de Paris',
        quantity: 8,
        unit: Unit.KG,
        unitPrice: 4.5,
        trackable: true,
        parLevel: 5,
        category: 'Légumes',
        categoryId: legumesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Champignons shiitake',
        quantity: 3,
        unit: Unit.KG,
        unitPrice: 12.0,
        trackable: true,
        parLevel: 2,
        category: 'Légumes',
        categoryId: legumesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Poireaux',
        quantity: 12,
        unit: Unit.KG,
        unitPrice: 2.8,
        trackable: true,
        parLevel: 8,
        category: 'Légumes',
        categoryId: legumesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Céleri branche',
        quantity: 8,
        unit: Unit.PC,
        unitPrice: 2.0,
        trackable: true,
        parLevel: 5,
        category: 'Légumes',
        categoryId: legumesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Courgettes',
        quantity: 15,
        unit: Unit.KG,
        unitPrice: 2.5,
        trackable: true,
        parLevel: 10,
        category: 'Légumes',
        categoryId: legumesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Aubergines',
        quantity: 10,
        unit: Unit.KG,
        unitPrice: 3.0,
        trackable: true,
        parLevel: 6,
        category: 'Légumes',
        categoryId: legumesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Poivrons rouges',
        quantity: 8,
        unit: Unit.KG,
        unitPrice: 3.5,
        trackable: true,
        parLevel: 5,
        category: 'Légumes',
        categoryId: legumesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Poivrons verts',
        quantity: 7,
        unit: Unit.KG,
        unitPrice: 3.2,
        trackable: true,
        parLevel: 5,
        category: 'Légumes',
        categoryId: legumesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Asperges vertes',
        quantity: 5,
        unit: Unit.KG,
        unitPrice: 8.5,
        trackable: true,
        parLevel: 3,
        category: 'Légumes',
        categoryId: legumesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Épinards frais',
        quantity: 6,
        unit: Unit.KG,
        unitPrice: 4.0,
        trackable: true,
        parLevel: 4,
        category: 'Légumes',
        categoryId: legumesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Endives',
        quantity: 8,
        unit: Unit.KG,
        unitPrice: 3.8,
        trackable: true,
        parLevel: 5,
        category: 'Légumes',
        categoryId: legumesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Ail',
        quantity: 2,
        unit: Unit.KG,
        unitPrice: 6.5,
        trackable: true,
        parLevel: 1,
        category: 'Légumes',
        categoryId: legumesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Échalotes',
        quantity: 3,
        unit: Unit.KG,
        unitPrice: 5.0,
        trackable: true,
        parLevel: 2,
        category: 'Légumes',
        categoryId: legumesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Haricots verts',
        quantity: 10,
        unit: Unit.KG,
        unitPrice: 5.5,
        trackable: true,
        parLevel: 6,
        category: 'Légumes',
        categoryId: legumesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Betteraves',
        quantity: 8,
        unit: Unit.KG,
        unitPrice: 2.8,
        trackable: true,
        parLevel: 5,
        category: 'Légumes',
        categoryId: legumesCat.id,
        isComposite: false,
      },
    }),

    // Cheese
    prisma.product.create({
      data: {
        name: 'Parmesan (Parmigiano Reggiano)',
        quantity: 3,
        unit: Unit.KG,
        unitPrice: 24.0,
        trackable: true,
        parLevel: 2,
        category: 'Produits laitiers',
        categoryId: produitslaitiersCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Fromage de chèvre',
        quantity: 4,
        unit: Unit.KG,
        unitPrice: 16.0,
        trackable: true,
        parLevel: 2,
        category: 'Produits laitiers',
        categoryId: produitslaitiersCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Comté',
        quantity: 3,
        unit: Unit.KG,
        unitPrice: 18.0,
        trackable: true,
        parLevel: 2,
        category: 'Produits laitiers',
        categoryId: produitslaitiersCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Roquefort',
        quantity: 2,
        unit: Unit.KG,
        unitPrice: 22.0,
        trackable: true,
        parLevel: 1,
        category: 'Produits laitiers',
        categoryId: produitslaitiersCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Brie',
        quantity: 2,
        unit: Unit.KG,
        unitPrice: 12.0,
        trackable: true,
        parLevel: 1,
        category: 'Produits laitiers',
        categoryId: produitslaitiersCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Camembert',
        quantity: 2,
        unit: Unit.KG,
        unitPrice: 10.0,
        trackable: true,
        parLevel: 1,
        category: 'Produits laitiers',
        categoryId: produitslaitiersCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Mascarpone',
        quantity: 3,
        unit: Unit.KG,
        unitPrice: 8.5,
        trackable: true,
        parLevel: 2,
        category: 'Produits laitiers',
        categoryId: produitslaitiersCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Yaourt nature',
        quantity: 10,
        unit: Unit.L,
        unitPrice: 2.5,
        trackable: true,
        parLevel: 5,
        category: 'Produits laitiers',
        categoryId: produitslaitiersCat.id,
        isComposite: false,
      },
    }),

    // Pasta & Rice
    prisma.product.create({
      data: {
        name: 'Spaghetti',
        quantity: 15,
        unit: Unit.KG,
        unitPrice: 2.8,
        trackable: true,
        parLevel: 10,
        category: 'Épicerie sèche',
        categoryId: produitsSecsCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Penne',
        quantity: 12,
        unit: Unit.KG,
        unitPrice: 2.5,
        trackable: true,
        parLevel: 8,
        category: 'Épicerie sèche',
        categoryId: produitsSecsCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Tagliatelles fraîches',
        quantity: 8,
        unit: Unit.KG,
        unitPrice: 6.5,
        trackable: true,
        parLevel: 5,
        category: 'Épicerie sèche',
        categoryId: produitsSecsCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Riz arborio (risotto)',
        quantity: 10,
        unit: Unit.KG,
        unitPrice: 4.5,
        trackable: true,
        parLevel: 6,
        category: 'Épicerie sèche',
        categoryId: produitsSecsCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Riz basmati',
        quantity: 12,
        unit: Unit.KG,
        unitPrice: 3.8,
        trackable: true,
        parLevel: 8,
        category: 'Épicerie sèche',
        categoryId: produitsSecsCat.id,
        isComposite: false,
      },
    }),

    // Fruits
    prisma.product.create({
      data: {
        name: 'Citrons',
        quantity: 30,
        unit: Unit.PC,
        unitPrice: 0.5,
        trackable: true,
        parLevel: 20,
        category: 'Légumes',
        categoryId: legumesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Citrons verts',
        quantity: 20,
        unit: Unit.PC,
        unitPrice: 0.6,
        trackable: true,
        parLevel: 15,
        category: 'Légumes',
        categoryId: legumesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Pommes Granny Smith',
        quantity: 10,
        unit: Unit.KG,
        unitPrice: 2.8,
        trackable: true,
        parLevel: 6,
        category: 'Légumes',
        categoryId: legumesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Poires',
        quantity: 8,
        unit: Unit.KG,
        unitPrice: 3.2,
        trackable: true,
        parLevel: 5,
        category: 'Légumes',
        categoryId: legumesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Fraises',
        quantity: 5,
        unit: Unit.KG,
        unitPrice: 8.5,
        trackable: true,
        parLevel: 3,
        category: 'Légumes',
        categoryId: legumesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Framboises',
        quantity: 3,
        unit: Unit.KG,
        unitPrice: 12.0,
        trackable: true,
        parLevel: 2,
        category: 'Légumes',
        categoryId: legumesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Rhubarbe',
        quantity: 4,
        unit: Unit.KG,
        unitPrice: 5.5,
        trackable: true,
        parLevel: 2,
        category: 'Légumes',
        categoryId: legumesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Oranges',
        quantity: 15,
        unit: Unit.PC,
        unitPrice: 0.8,
        trackable: true,
        parLevel: 10,
        category: 'Légumes',
        categoryId: legumesCat.id,
        isComposite: false,
      },
    }),

    // Wines & Spirits
    prisma.product.create({
      data: {
        name: 'Vin blanc sec (cuisine)',
        quantity: 12,
        unit: Unit.L,
        unitPrice: 4.5,
        trackable: true,
        parLevel: 8,
        category: 'Épicerie sèche',
        categoryId: produitsSecsCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Vin rouge (cuisine)',
        quantity: 10,
        unit: Unit.L,
        unitPrice: 4.0,
        trackable: true,
        parLevel: 6,
        category: 'Épicerie sèche',
        categoryId: produitsSecsCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Cognac',
        quantity: 2,
        unit: Unit.L,
        unitPrice: 35.0,
        trackable: true,
        parLevel: 1,
        category: 'Épicerie sèche',
        categoryId: produitsSecsCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Porto',
        quantity: 2,
        unit: Unit.L,
        unitPrice: 18.0,
        trackable: true,
        parLevel: 1,
        category: 'Épicerie sèche',
        categoryId: produitsSecsCat.id,
        isComposite: false,
      },
    }),

    // Canned Goods
    prisma.product.create({
      data: {
        name: 'Concentré de tomate',
        quantity: 20,
        unit: Unit.PC,
        unitPrice: 1.5,
        trackable: true,
        parLevel: 10,
        category: 'Épicerie sèche',
        categoryId: produitsSecsCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Tomates pelées en conserve',
        quantity: 30,
        unit: Unit.PC,
        unitPrice: 1.8,
        trackable: true,
        parLevel: 15,
        category: 'Épicerie sèche',
        categoryId: produitsSecsCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Anchois à l\'huile',
        quantity: 12,
        unit: Unit.PC,
        unitPrice: 3.5,
        trackable: true,
        parLevel: 6,
        category: 'Épicerie sèche',
        categoryId: produitsSecsCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Olives noires',
        quantity: 5,
        unit: Unit.KG,
        unitPrice: 8.0,
        trackable: true,
        parLevel: 3,
        category: 'Épicerie sèche',
        categoryId: produitsSecsCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Olives vertes',
        quantity: 5,
        unit: Unit.KG,
        unitPrice: 7.5,
        trackable: true,
        parLevel: 3,
        category: 'Épicerie sèche',
        categoryId: produitsSecsCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Câpres',
        quantity: 8,
        unit: Unit.PC,
        unitPrice: 2.5,
        trackable: true,
        parLevel: 4,
        category: 'Épicerie sèche',
        categoryId: produitsSecsCat.id,
        isComposite: false,
      },
    }),

    // Baking Items
    prisma.product.create({
      data: {
        name: 'Levure chimique',
        quantity: 500,
        unit: Unit.G,
        unitPrice: 6.0,
        trackable: true,
        parLevel: 250,
        category: 'Épicerie sèche',
        categoryId: produitsSecsCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Levure de boulanger',
        quantity: 400,
        unit: Unit.G,
        unitPrice: 4.5,
        trackable: true,
        parLevel: 200,
        category: 'Épicerie sèche',
        categoryId: produitsSecsCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Cacao en poudre',
        quantity: 1,
        unit: Unit.KG,
        unitPrice: 15.0,
        trackable: true,
        parLevel: 0.5,
        category: 'Épicerie sèche',
        categoryId: produitsSecsCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Chocolat noir 70%',
        quantity: 4,
        unit: Unit.KG,
        unitPrice: 18.0,
        trackable: true,
        parLevel: 2,
        category: 'Épicerie sèche',
        categoryId: produitsSecsCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Chocolat au lait',
        quantity: 3,
        unit: Unit.KG,
        unitPrice: 14.0,
        trackable: true,
        parLevel: 2,
        category: 'Épicerie sèche',
        categoryId: produitsSecsCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Chocolat blanc',
        quantity: 2,
        unit: Unit.KG,
        unitPrice: 16.0,
        trackable: true,
        parLevel: 1,
        category: 'Épicerie sèche',
        categoryId: produitsSecsCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Gélatine en feuilles',
        quantity: 200,
        unit: Unit.G,
        unitPrice: 12.0,
        trackable: true,
        parLevel: 100,
        category: 'Épicerie sèche',
        categoryId: produitsSecsCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Sucre vanillé',
        quantity: 500,
        unit: Unit.G,
        unitPrice: 8.0,
        trackable: true,
        parLevel: 250,
        category: 'Épicerie sèche',
        categoryId: produitsSecsCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Sucre glace',
        quantity: 2,
        unit: Unit.KG,
        unitPrice: 3.5,
        trackable: true,
        parLevel: 1,
        category: 'Épicerie sèche',
        categoryId: produitsSecsCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Miel',
        quantity: 3,
        unit: Unit.KG,
        unitPrice: 15.0,
        trackable: true,
        parLevel: 2,
        category: 'Épicerie sèche',
        categoryId: produitsSecsCat.id,
        isComposite: false,
      },
    }),

    // Nuts & Dried Fruits
    prisma.product.create({
      data: {
        name: 'Amandes effilées',
        quantity: 2,
        unit: Unit.KG,
        unitPrice: 14.0,
        trackable: true,
        parLevel: 1,
        category: 'Épicerie sèche',
        categoryId: produitsSecsCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Noix',
        quantity: 2,
        unit: Unit.KG,
        unitPrice: 16.0,
        trackable: true,
        parLevel: 1,
        category: 'Épicerie sèche',
        categoryId: produitsSecsCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Noisettes',
        quantity: 2,
        unit: Unit.KG,
        unitPrice: 15.0,
        trackable: true,
        parLevel: 1,
        category: 'Épicerie sèche',
        categoryId: produitsSecsCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Pignons de pin',
        quantity: 500,
        unit: Unit.G,
        unitPrice: 28.0,
        trackable: true,
        parLevel: 250,
        category: 'Épicerie sèche',
        categoryId: produitsSecsCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Raisins secs',
        quantity: 1,
        unit: Unit.KG,
        unitPrice: 8.0,
        trackable: true,
        parLevel: 0.5,
        category: 'Épicerie sèche',
        categoryId: produitsSecsCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Abricots secs',
        quantity: 1,
        unit: Unit.KG,
        unitPrice: 12.0,
        trackable: true,
        parLevel: 0.5,
        category: 'Épicerie sèche',
        categoryId: produitsSecsCat.id,
        isComposite: false,
      },
    }),

    // More Seafood
    prisma.product.create({
      data: {
        name: 'Moules',
        quantity: 8,
        unit: Unit.KG,
        unitPrice: 6.5,
        trackable: true,
        parLevel: 5,
        category: 'Poissons',
        categoryId: proteinesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Saint-Jacques',
        quantity: 3,
        unit: Unit.KG,
        unitPrice: 38.0,
        trackable: true,
        parLevel: 2,
        category: 'Poissons',
        categoryId: proteinesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Calamar',
        quantity: 5,
        unit: Unit.KG,
        unitPrice: 14.0,
        trackable: true,
        parLevel: 3,
        category: 'Poissons',
        categoryId: proteinesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Thon frais',
        quantity: 6,
        unit: Unit.KG,
        unitPrice: 25.0,
        trackable: true,
        parLevel: 4,
        category: 'Poissons',
        categoryId: proteinesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Cabillaud',
        quantity: 8,
        unit: Unit.KG,
        unitPrice: 18.0,
        trackable: true,
        parLevel: 5,
        category: 'Poissons',
        categoryId: proteinesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Sole',
        quantity: 4,
        unit: Unit.KG,
        unitPrice: 32.0,
        trackable: true,
        parLevel: 3,
        category: 'Poissons',
        categoryId: proteinesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Turbot',
        quantity: 3,
        unit: Unit.KG,
        unitPrice: 42.0,
        trackable: true,
        parLevel: 2,
        category: 'Poissons',
        categoryId: proteinesCat.id,
        isComposite: false,
      },
    }),

    // More Meats
    prisma.product.create({
      data: {
        name: 'Côtelettes d\'agneau',
        quantity: 5,
        unit: Unit.KG,
        unitPrice: 32.0,
        trackable: true,
        parLevel: 3,
        category: 'Viandes',
        categoryId: proteinesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Épaule d\'agneau',
        quantity: 4,
        unit: Unit.KG,
        unitPrice: 28.0,
        trackable: true,
        parLevel: 2,
        category: 'Viandes',
        categoryId: proteinesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Côtes de porc',
        quantity: 8,
        unit: Unit.KG,
        unitPrice: 12.0,
        trackable: true,
        parLevel: 5,
        category: 'Viandes',
        categoryId: proteinesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Filet mignon de porc',
        quantity: 6,
        unit: Unit.KG,
        unitPrice: 15.0,
        trackable: true,
        parLevel: 4,
        category: 'Viandes',
        categoryId: proteinesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Foie gras de canard',
        quantity: 2,
        unit: Unit.KG,
        unitPrice: 65.0,
        trackable: true,
        parLevel: 1,
        category: 'Viandes',
        categoryId: proteinesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Confit de canard',
        quantity: 15,
        unit: Unit.PC,
        unitPrice: 8.5,
        trackable: true,
        parLevel: 10,
        category: 'Viandes',
        categoryId: proteinesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Saucisses de Toulouse',
        quantity: 5,
        unit: Unit.KG,
        unitPrice: 9.0,
        trackable: true,
        parLevel: 3,
        category: 'Viandes',
        categoryId: proteinesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Lardons fumés',
        quantity: 4,
        unit: Unit.KG,
        unitPrice: 8.5,
        trackable: true,
        parLevel: 2,
        category: 'Viandes',
        categoryId: proteinesCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Jambon blanc',
        quantity: 3,
        unit: Unit.KG,
        unitPrice: 12.0,
        trackable: true,
        parLevel: 2,
        category: 'Viandes',
        categoryId: proteinesCat.id,
        isComposite: false,
      },
    }),

    // Broths & Stocks
    prisma.product.create({
      data: {
        name: 'Fond de volaille',
        quantity: 10,
        unit: Unit.L,
        unitPrice: 6.5,
        trackable: true,
        parLevel: 6,
        category: 'Épicerie sèche',
        categoryId: produitsSecsCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Fumet de poisson',
        quantity: 8,
        unit: Unit.L,
        unitPrice: 8.0,
        trackable: true,
        parLevel: 5,
        category: 'Épicerie sèche',
        categoryId: produitsSecsCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Fond de veau',
        quantity: 6,
        unit: Unit.L,
        unitPrice: 12.0,
        trackable: true,
        parLevel: 4,
        category: 'Épicerie sèche',
        categoryId: produitsSecsCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Bouillon de légumes',
        quantity: 8,
        unit: Unit.L,
        unitPrice: 4.5,
        trackable: true,
        parLevel: 5,
        category: 'Épicerie sèche',
        categoryId: produitsSecsCat.id,
        isComposite: false,
      },
    }),

    // Condiments & Sauces
    prisma.product.create({
      data: {
        name: 'Moutarde de Dijon',
        quantity: 3,
        unit: Unit.KG,
        unitPrice: 5.0,
        trackable: true,
        parLevel: 2,
        category: 'Condiments',
        categoryId: condimentsCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Moutarde à l\'ancienne',
        quantity: 2,
        unit: Unit.KG,
        unitPrice: 6.5,
        trackable: true,
        parLevel: 1,
        category: 'Condiments',
        categoryId: condimentsCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Mayonnaise',
        quantity: 4,
        unit: Unit.L,
        unitPrice: 6.0,
        trackable: true,
        parLevel: 2,
        category: 'Condiments',
        categoryId: condimentsCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Sauce soja',
        quantity: 2,
        unit: Unit.L,
        unitPrice: 7.5,
        trackable: true,
        parLevel: 1,
        category: 'Condiments',
        categoryId: condimentsCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Sauce worcestershire',
        quantity: 1,
        unit: Unit.L,
        unitPrice: 8.0,
        trackable: true,
        parLevel: 0.5,
        category: 'Condiments',
        categoryId: condimentsCat.id,
        isComposite: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Tabasco',
        quantity: 500,
        unit: Unit.ML,
        unitPrice: 6.5,
        trackable: true,
        parLevel: 250,
        category: 'Condiments',
        categoryId: condimentsCat.id,
        isComposite: false,
      },
    }),
  ]);
  console.log(`✅ Created ${products.length} base products\n`);

  // Store products by name for easy reference
  const productMap = Object.fromEntries(products.map((p) => [p.name, p]));

  // ============================================================================
  // RECIPE CATEGORIES
  // ============================================================================
  console.log('📚 Creating recipe categories...');

  // Main DISH categories
  const entreesFroidesCat = await prisma.recipeCategory.create({
    data: {
      name: 'Entrées Froides',
      icon: '🥗',
      color: '#32CD32',
      order: 1,
      categoryType: 'DISH',
      isPredefined: true,
    },
  });

  const entreesChaudesCat = await prisma.recipeCategory.create({
    data: {
      name: 'Entrées Chaudes',
      icon: '🍲',
      color: '#FF8C00',
      order: 2,
      categoryType: 'DISH',
      isPredefined: true,
    },
  });

  const poissonsCat = await prisma.recipeCategory.create({
    data: {
      name: 'Poissons',
      icon: '🐟',
      color: '#4682B4',
      order: 3,
      categoryType: 'DISH',
      isPredefined: true,
    },
  });

  const viandesCat = await prisma.recipeCategory.create({
    data: {
      name: 'Viandes',
      icon: '🥩',
      color: '#8B0000',
      order: 4,
      categoryType: 'DISH',
      isPredefined: true,
    },
  });

  const dessertsCat = await prisma.recipeCategory.create({
    data: {
      name: 'Desserts',
      icon: '🍰',
      color: '#FF69B4',
      order: 5,
      categoryType: 'DISH',
      isPredefined: true,
    },
  });

  // Dessert sub-categories
  const patisserieCat = await prisma.recipeCategory.create({
    data: {
      name: 'Pâtisserie',
      icon: '📄',
      color: '#FFB6C1',
      order: 1,
      parentId: dessertsCat.id,
      categoryType: 'DISH',
      isPredefined: true,
    },
  });

  const dessertsAssietteCat = await prisma.recipeCategory.create({
    data: {
      name: 'Desserts à l\'Assiette',
      icon: '🍽️',
      color: '#DDA0DD',
      order: 2,
      parentId: dessertsCat.id,
      categoryType: 'DISH',
      isPredefined: true,
    },
  });

  // PREPARED_INGREDIENT categories
  const basesCremesCat = await prisma.recipeCategory.create({
    data: {
      name: 'Bases & Crèmes',
      icon: '🥛',
      color: '#F5F5DC',
      order: 1,
      categoryType: 'PREPARED_INGREDIENT',
      isPredefined: true,
    },
  });

  const saucesCat = await prisma.recipeCategory.create({
    data: {
      name: 'Sauces',
      icon: '🥫',
      color: '#DC143C',
      order: 2,
      categoryType: 'PREPARED_INGREDIENT',
      isPredefined: true,
    },
  });

  console.log('✅ Created 9 recipe categories\n');

  // ============================================================================
  // COMPOSITE PRODUCTS (Prepared Ingredients)
  // ============================================================================
  console.log('🧪 Creating composite products...');

  // Crème pâtissière
  const cremePat = await prisma.product.create({
    data: {
      name: 'Crème pâtissière',
      quantity: 5,
      unit: Unit.L,
      unitPrice: null,
      trackable: true,
      parLevel: 3,
      category: 'Bases & Crèmes',
      categoryId: basesCremesCat.id,
      isComposite: true,
      yieldQuantity: 1, // 1L per batch
    },
  });

  await prisma.compositeIngredient.createMany({
    data: [
      {
        compositeProductId: cremePat.id,
        baseProductId: productMap['Lait entier'].id,
        quantity: 0.5,
        unit: Unit.L,
      },
      {
        compositeProductId: cremePat.id,
        baseProductId: productMap['Œufs frais'].id,
        quantity: 6,
        unit: Unit.PC,
      },
      {
        compositeProductId: cremePat.id,
        baseProductId: productMap['Sucre en poudre'].id,
        quantity: 0.15,
        unit: Unit.KG,
      },
      {
        compositeProductId: cremePat.id,
        baseProductId: productMap['Farine T55'].id,
        quantity: 0.05,
        unit: Unit.KG,
      },
    ],
  });

  // Sauce béchamel
  const bechamel = await prisma.product.create({
    data: {
      name: 'Sauce béchamel',
      quantity: 8,
      unit: Unit.L,
      unitPrice: null,
      trackable: true,
      parLevel: 5,
      category: 'Sauces',
      categoryId: saucesCat.id,
      isComposite: true,
      yieldQuantity: 1,
    },
  });

  await prisma.compositeIngredient.createMany({
    data: [
      {
        compositeProductId: bechamel.id,
        baseProductId: productMap['Lait entier'].id,
        quantity: 0.9,
        unit: Unit.L,
      },
      {
        compositeProductId: bechamel.id,
        baseProductId: productMap['Beurre doux'].id,
        quantity: 0.05,
        unit: Unit.KG,
      },
      {
        compositeProductId: bechamel.id,
        baseProductId: productMap['Farine T55'].id,
        quantity: 0.05,
        unit: Unit.KG,
      },
    ],
  });

  // Marinade pour viande rouge
  const marinade = await prisma.product.create({
    data: {
      name: 'Marinade pour viande rouge',
      quantity: 2,
      unit: Unit.L,
      unitPrice: null,
      trackable: true,
      parLevel: 1,
      category: 'Sauces',
      categoryId: saucesCat.id,
      isComposite: true,
      yieldQuantity: 1, // 1L per batch
    },
  });

  await prisma.compositeIngredient.createMany({
    data: [
      {
        compositeProductId: marinade.id,
        baseProductId: productMap['Thym frais'].id,
        quantity: 2,
        unit: Unit.BUNCH,
      },
      {
        compositeProductId: marinade.id,
        baseProductId: productMap['Persil frais'].id,
        quantity: 1,
        unit: Unit.BUNCH,
      },
      {
        compositeProductId: marinade.id,
        baseProductId: productMap['Sel fin'].id,
        quantity: 0.02,
        unit: Unit.KG,
      },
    ],
  });

  // Sauce béarnaise
  const bearnaise = await prisma.product.create({
    data: {
      name: 'Sauce béarnaise',
      quantity: 1.5,
      unit: Unit.L,
      unitPrice: null,
      trackable: true,
      parLevel: 1,
      category: 'Sauces',
      categoryId: saucesCat.id,
      isComposite: true,
      yieldQuantity: 1,
    },
  });

  await prisma.compositeIngredient.createMany({
    data: [
      {
        compositeProductId: bearnaise.id,
        baseProductId: productMap['Œufs frais'].id,
        quantity: 6,
        unit: Unit.PC,
      },
      {
        compositeProductId: bearnaise.id,
        baseProductId: productMap['Beurre doux'].id,
        quantity: 0.25,
        unit: Unit.KG,
      },
      {
        compositeProductId: bearnaise.id,
        baseProductId: productMap['Persil frais'].id,
        quantity: 1,
        unit: Unit.BUNCH,
      },
    ],
  });

  // Pommes grenailles préparées
  const pommesGrenailles = await prisma.product.create({
    data: {
      name: 'Pommes grenailles préparées',
      quantity: 10,
      unit: Unit.KG,
      unitPrice: null,
      trackable: true,
      parLevel: 5,
      category: 'Bases & Crèmes',
      categoryId: basesCremesCat.id,
      isComposite: true,
      yieldQuantity: 5, // 5kg per batch
    },
  });

  await prisma.compositeIngredient.createMany({
    data: [
      {
        compositeProductId: pommesGrenailles.id,
        baseProductId: productMap['Pommes de terre'].id,
        quantity: 5,
        unit: Unit.KG,
      },
      {
        compositeProductId: pommesGrenailles.id,
        baseProductId: productMap['Thym frais'].id,
        quantity: 1,
        unit: Unit.BUNCH,
      },
      {
        compositeProductId: pommesGrenailles.id,
        baseProductId: productMap['Beurre doux'].id,
        quantity: 0.1,
        unit: Unit.KG,
      },
      {
        compositeProductId: pommesGrenailles.id,
        baseProductId: productMap['Sel fin'].id,
        quantity: 0.025,
        unit: Unit.KG,
      },
    ],
  });

  // Mousseline de pommes de terre
  const mousseline = await prisma.product.create({
    data: {
      name: 'Mousseline de pommes de terre',
      quantity: 8,
      unit: Unit.KG,
      unitPrice: null,
      trackable: true,
      parLevel: 4,
      category: 'Bases & Crèmes',
      categoryId: basesCremesCat.id,
      isComposite: true,
      yieldQuantity: 3,
    },
  });

  await prisma.compositeIngredient.createMany({
    data: [
      {
        compositeProductId: mousseline.id,
        baseProductId: productMap['Pommes de terre'].id,
        quantity: 3,
        unit: Unit.KG,
      },
      {
        compositeProductId: mousseline.id,
        baseProductId: productMap['Crème fraîche 35%'].id,
        quantity: 0.3,
        unit: Unit.L,
      },
      {
        compositeProductId: mousseline.id,
        baseProductId: productMap['Beurre doux'].id,
        quantity: 0.15,
        unit: Unit.KG,
      },
      {
        compositeProductId: mousseline.id,
        baseProductId: productMap['Lait entier'].id,
        quantity: 0.2,
        unit: Unit.L,
      },
    ],
  });

  // Siphon à la tomate
  const siphonTomate = await prisma.product.create({
    data: {
      name: 'Siphon à la tomate',
      quantity: 2,
      unit: Unit.L,
      unitPrice: null,
      trackable: true,
      parLevel: 1,
      category: 'Sauces',
      categoryId: saucesCat.id,
      isComposite: true,
      yieldQuantity: 1,
    },
  });

  await prisma.compositeIngredient.createMany({
    data: [
      {
        compositeProductId: siphonTomate.id,
        baseProductId: productMap['Tomates'].id,
        quantity: 1,
        unit: Unit.KG,
      },
      {
        compositeProductId: siphonTomate.id,
        baseProductId: productMap['Crème fraîche 35%'].id,
        quantity: 0.2,
        unit: Unit.L,
      },
      {
        compositeProductId: siphonTomate.id,
        baseProductId: productMap['Beurre doux'].id,
        quantity: 0.05,
        unit: Unit.KG,
      },
    ],
  });

  // Bœuf mariné (uses raw beef + marinade)
  const boeufMarine = await prisma.product.create({
    data: {
      name: 'Bœuf mariné',
      quantity: 8,
      unit: Unit.KG,
      unitPrice: null,
      trackable: true,
      parLevel: 4,
      category: 'Bases & Crèmes',
      categoryId: basesCremesCat.id,
      isComposite: true,
      yieldQuantity: 2, // 2kg per batch
    },
  });

  await prisma.compositeIngredient.createMany({
    data: [
      {
        compositeProductId: boeufMarine.id,
        baseProductId: productMap['Filet de bœuf'].id,
        quantity: 2,
        unit: Unit.KG,
      },
      {
        compositeProductId: boeufMarine.id,
        baseProductId: marinade.id,
        quantity: 0.1,
        unit: Unit.L,
      },
      {
        compositeProductId: boeufMarine.id,
        baseProductId: productMap['Thym frais'].id,
        quantity: 0.5,
        unit: Unit.BUNCH,
      },
    ],
  });

  // Onglet de bœuf mariné
  const ongletMarine = await prisma.product.create({
    data: {
      name: 'Onglet de bœuf mariné',
      quantity: 6,
      unit: Unit.KG,
      unitPrice: null,
      trackable: true,
      parLevel: 3,
      category: 'Bases & Crèmes',
      categoryId: basesCremesCat.id,
      isComposite: true,
      yieldQuantity: 2,
    },
  });

  await prisma.compositeIngredient.createMany({
    data: [
      {
        compositeProductId: ongletMarine.id,
        baseProductId: productMap['Onglet de bœuf'].id,
        quantity: 2,
        unit: Unit.KG,
      },
      {
        compositeProductId: ongletMarine.id,
        baseProductId: marinade.id,
        quantity: 0.08,
        unit: Unit.L,
      },
    ],
  });

  // Gambas marinées
  const gambasMarine = await prisma.product.create({
    data: {
      name: 'Gambas marinées au thym',
      quantity: 3,
      unit: Unit.KG,
      unitPrice: null,
      trackable: true,
      parLevel: 2,
      category: 'Bases & Crèmes',
      categoryId: basesCremesCat.id,
      isComposite: true,
      yieldQuantity: 1,
    },
  });

  await prisma.compositeIngredient.createMany({
    data: [
      {
        compositeProductId: gambasMarine.id,
        baseProductId: productMap['Gambas (grosses crevettes)'].id,
        quantity: 1,
        unit: Unit.KG,
      },
      {
        compositeProductId: gambasMarine.id,
        baseProductId: productMap['Thym frais'].id,
        quantity: 1,
        unit: Unit.BUNCH,
      },
      {
        compositeProductId: gambasMarine.id,
        baseProductId: productMap['Sel fin'].id,
        quantity: 0.01,
        unit: Unit.KG,
      },
    ],
  });

  // Veau mariné
  const veauMarine = await prisma.product.create({
    data: {
      name: 'Veau mariné au thym',
      quantity: 4,
      unit: Unit.KG,
      unitPrice: null,
      trackable: true,
      parLevel: 2,
      category: 'Bases & Crèmes',
      categoryId: basesCremesCat.id,
      isComposite: true,
      yieldQuantity: 1.5,
    },
  });

  await prisma.compositeIngredient.createMany({
    data: [
      {
        compositeProductId: veauMarine.id,
        baseProductId: productMap['Quasi de veau'].id,
        quantity: 1.5,
        unit: Unit.KG,
      },
      {
        compositeProductId: veauMarine.id,
        baseProductId: productMap['Thym frais'].id,
        quantity: 1,
        unit: Unit.BUNCH,
      },
      {
        compositeProductId: veauMarine.id,
        baseProductId: marinade.id,
        quantity: 0.05,
        unit: Unit.L,
      },
    ],
  });

  console.log('✅ Created 11 composite products with ingredients\n');

  // ============================================================================
  // DISHES & RECIPES (from Sens Unique Restaurant)
  // ============================================================================
  console.log('🍽️ Creating dishes and recipes...');

  // ENTRÉES
  const laMer = await prisma.dish.create({
    data: {
      name: 'La mer',
      description: 'Croquant de chair de crabe, thon et haddock fumé, hareng mariné et douceur de choux fleurs aux betteraves multicolores',
      sellingPrice: 16.00,
      isActive: true,
      categoryId: entreesFroidesCat.id,
      recipeIngredients: {
        create: [
          {
            productId: productMap['Daurade royale'].id, // Mix of seafood (using daurade as placeholder for mixed fish)
            quantityRequired: 0.12,
            unit: 'KG',
          },
          {
            productId: productMap['Crème fraîche 35%'].id,
            quantityRequired: 0.03,
            unit: 'L',
          },
          {
            productId: productMap['Persil frais'].id,
            quantityRequired: 0.5,
            unit: 'BUNCH',
          },
        ],
      },
    },
  });

  const carpaccioVeau = await prisma.dish.create({
    data: {
      name: 'Le carpaccio de veau « cuit rosé »',
      description: 'Vitello tonnato à ma façon, aromates de saison au jambon cru et caviar aux aubergines confites',
      sellingPrice: 17.00,
      isActive: true,
      categoryId: entreesFroidesCat.id,
      recipeIngredients: {
        create: [
          {
            productId: productMap['Quasi de veau'].id,
            quantityRequired: 0.12,
            unit: 'KG',
          },
          {
            productId: productMap['Crème fraîche 35%'].id,
            quantityRequired: 0.02,
            unit: 'L',
          },
          {
            productId: productMap['Œufs frais'].id,
            quantityRequired: 1,
            unit: 'PC',
          },
          {
            productId: productMap['Persil frais'].id,
            quantityRequired: 0.3,
            unit: 'BUNCH',
          },
        ],
      },
    },
  });

  const tarteVegetarienne = await prisma.dish.create({
    data: {
      name: 'La tarte sablée végétarienne',
      description: 'Douceurs asperges vertes, crème de burrata fumée, confit et bonbons de tomates cerises confits',
      sellingPrice: 17.00,
      isActive: true,
      categoryId: entreesFroidesCat.id,
      recipeIngredients: {
        create: [
          {
            productId: productMap['Tomates'].id,
            quantityRequired: 0.15,
            unit: 'KG',
          },
          {
            productId: productMap['Farine T55'].id,
            quantityRequired: 0.1,
            unit: 'KG',
          },
          {
            productId: productMap['Beurre doux'].id,
            quantityRequired: 0.05,
            unit: 'KG',
          },
          {
            productId: productMap['Œufs frais'].id,
            quantityRequired: 2,
            unit: 'PC',
          },
          {
            productId: productMap['Crème fraîche 35%'].id,
            quantityRequired: 0.05,
            unit: 'L',
          },
        ],
      },
    },
  });

  const foieGras = await prisma.dish.create({
    data: {
      name: 'Le foie gras et le magret fumé de canard',
      description: 'Comme « un opéra », artichauts poivrades et craquants, caramel acidulé à la sauge',
      sellingPrice: 21.00,
      isActive: true,
      categoryId: entreesChaudesCat.id,
      recipeIngredients: {
        create: [
          {
            productId: productMap['Magret de canard'].id,
            quantityRequired: 0.5,
            unit: 'PC',
          },
          {
            productId: productMap['Beurre doux'].id,
            quantityRequired: 0.03,
            unit: 'KG',
          },
          {
            productId: productMap['Sucre en poudre'].id,
            quantityRequired: 0.02,
            unit: 'KG',
          },
          {
            productId: productMap['Thym frais'].id,
            quantityRequired: 0.3,
            unit: 'BUNCH',
          },
        ],
      },
    },
  });

  const escargots = await prisma.dish.create({
    data: {
      name: 'Les escargots de Bourgogne',
      description: 'Gâteau de pommes de terre croquillant aux aromates maison, pulpe de persil plat et jus onctueux au vin rouge',
      sellingPrice: 19.00,
      isActive: true,
      categoryId: entreesChaudesCat.id,
      recipeIngredients: {
        create: [
          {
            productId: productMap['Pommes de terre'].id,
            quantityRequired: 0.2,
            unit: 'KG',
          },
          {
            productId: productMap['Persil frais'].id,
            quantityRequired: 1,
            unit: 'BUNCH',
          },
          {
            productId: productMap['Beurre doux'].id,
            quantityRequired: 0.05,
            unit: 'KG',
          },
        ],
      },
    },
  });

  const cevicheBar = await prisma.dish.create({
    data: {
      name: 'Le céviché de bar',
      description: 'Fine mousseline de petits pois frais, piquilllo farci au citron caviar, salicornes/poutargue et perles de harengs',
      sellingPrice: 20.00,
      isActive: true,
      categoryId: entreesFroidesCat.id,
      recipeIngredients: {
        create: [
          {
            productId: productMap['Bar de ligne'].id,
            quantityRequired: 0.15,
            unit: 'KG',
          },
          {
            productId: productMap['Crème fraîche 35%'].id,
            quantityRequired: 0.04,
            unit: 'L',
          },
          {
            productId: productMap['Persil frais'].id,
            quantityRequired: 0.5,
            unit: 'BUNCH',
          },
          {
            productId: productMap['Oignons'].id,
            quantityRequired: 0.05,
            unit: 'KG',
          },
        ],
      },
    },
  });

  // PLATS
  const filetDaurade = await prisma.dish.create({
    data: {
      name: 'Le filet de daurade royale',
      description: 'Poêlé à l\'huile olive, condiment chimichurri au blanc de seiche, frégola sarda et petits légumes printaniers',
      sellingPrice: 30.00,
      isActive: true,
      categoryId: poissonsCat.id,
      recipeIngredients: {
        create: [
          {
            productId: productMap['Daurade royale'].id,
            quantityRequired: 0.25,
            unit: 'KG',
          },
          {
            productId: productMap['Persil frais'].id,
            quantityRequired: 1,
            unit: 'BUNCH',
          },
          {
            productId: productMap['Carottes'].id,
            quantityRequired: 0.08,
            unit: 'KG',
          },
          {
            productId: productMap['Oignons'].id,
            quantityRequired: 0.05,
            unit: 'KG',
          },
        ],
      },
    },
  });

  const gambas = await prisma.dish.create({
    data: {
      name: 'Les grosses gambas « black tiger »',
      description: 'Marinées et grillées au thym frais, siphon à la tomate et mousseline de pommes de terre à l\'huile olive, primeurs de légumes verts',
      sellingPrice: 37.00,
      isActive: true,
      categoryId: poissonsCat.id,
      recipeIngredients: {
        create: [
          {
            productId: gambasMarine.id, // Using prepared marinated gambas
            quantityRequired: 0.2,
            unit: 'KG',
          },
          {
            productId: siphonTomate.id, // Using prepared tomato siphon
            quantityRequired: 0.1,
            unit: 'L',
          },
          {
            productId: mousseline.id, // Using prepared potato mousseline
            quantityRequired: 0.15,
            unit: 'KG',
          },
          {
            productId: productMap['Carottes'].id, // Fresh vegetables
            quantityRequired: 0.05,
            unit: 'KG',
          },
        ],
      },
    },
  });

  const ongletBoeuf = await prisma.dish.create({
    data: {
      name: 'L\'onglet de bœuf « Black Angus »',
      description: 'Rôti au beurre frais, rissolée de pommes grenailles et légumes du moment, béarnaise maison',
      sellingPrice: 32.00,
      isActive: true,
      categoryId: viandesCat.id,
      recipeIngredients: {
        create: [
          {
            productId: ongletMarine.id, // Using prepared marinated onglet
            quantityRequired: 0.25,
            unit: 'KG',
          },
          {
            productId: pommesGrenailles.id, // Using prepared potatoes
            quantityRequired: 0.25,
            unit: 'KG',
          },
          {
            productId: bearnaise.id, // Using prepared béarnaise sauce
            quantityRequired: 0.1,
            unit: 'L',
          },
          {
            productId: productMap['Carottes'].id, // Fresh vegetables
            quantityRequired: 0.08,
            unit: 'KG',
          },
        ],
      },
    },
  });

  const epauleAgneau = await prisma.dish.create({
    data: {
      name: 'L\'épaule agneau française',
      description: 'Confite et pressée, crumble à la tomate/miel/épices, primeurs de pois gourmand et éryngii, jus court au thym frais',
      sellingPrice: 32.00,
      isActive: true,
      categoryId: viandesCat.id,
      recipeIngredients: {
        create: [
          {
            productId: productMap['Tomates'].id,
            quantityRequired: 0.1,
            unit: 'KG',
          },
          {
            productId: productMap['Thym frais'].id,
            quantityRequired: 0.5,
            unit: 'BUNCH',
          },
        ],
      },
    },
  });

  const quasiVeau = await prisma.dish.create({
    data: {
      name: 'Le quasi de veau français',
      description: 'Rôti au thym frais, grosses asperges blanches rôties et primeurs de petits légumes, jus court',
      sellingPrice: 36.00,
      isActive: true,
      categoryId: viandesCat.id,
      recipeIngredients: {
        create: [
          {
            productId: veauMarine.id, // Using prepared marinated veal
            quantityRequired: 0.28,
            unit: 'KG',
          },
          {
            productId: productMap['Carottes'].id, // Fresh vegetables
            quantityRequired: 0.1,
            unit: 'KG',
          },
          {
            productId: productMap['Oignons'].id,
            quantityRequired: 0.05,
            unit: 'KG',
          },
        ],
      },
    },
  });

  const poularde = await prisma.dish.create({
    data: {
      name: 'La poularde Arnaud Tauzin',
      description: 'À l\'ancienne, morilles et orges perlés, sauce gourmande émulsionnée',
      sellingPrice: 37.00,
      isActive: true,
      categoryId: viandesCat.id,
      recipeIngredients: {
        create: [
          {
            productId: productMap['Poulet fermier (entier)'].id,
            quantityRequired: 0.6,
            unit: 'PC',
          },
          {
            productId: productMap['Crème fraîche 35%'].id,
            quantityRequired: 0.1,
            unit: 'L',
          },
        ],
      },
    },
  });

  const vegetal = await prisma.dish.create({
    data: {
      name: 'Le végétal',
      description: 'Lasagnes « ouvertes », bolognaise de petits légumes printaniers, condiments de pignons et citron confit aux herbes fraîches',
      sellingPrice: 24.00,
      isActive: true,
      categoryId: entreesFroidesCat.id, // Vegetarian option
      recipeIngredients: {
        create: [
          {
            productId: productMap['Tomates'].id,
            quantityRequired: 0.2,
            unit: 'KG',
          },
          {
            productId: productMap['Carottes'].id,
            quantityRequired: 0.1,
            unit: 'KG',
          },
          {
            productId: productMap['Oignons'].id,
            quantityRequired: 0.1,
            unit: 'KG',
          },
          {
            productId: productMap['Farine T55'].id,
            quantityRequired: 0.15,
            unit: 'KG',
          },
          {
            productId: productMap['Œufs frais'].id,
            quantityRequired: 3,
            unit: 'PC',
          },
          {
            productId: bechamel.id,
            quantityRequired: 0.3,
            unit: 'L',
          },
          {
            productId: productMap['Persil frais'].id,
            quantityRequired: 1,
            unit: 'BUNCH',
          },
          {
            productId: productMap['Thym frais'].id,
            quantityRequired: 0.5,
            unit: 'BUNCH',
          },
        ],
      },
    },
  });

  const coteBoeuf = await prisma.dish.create({
    data: {
      name: 'La côte de bœuf Simmental (pour 2 personnes - 1kg)',
      description: 'Rôti au savoir, ail et thym frais, pommes grenailles et légumes de saison, béarnaise et jus court',
      sellingPrice: 92.00,
      isActive: true,
      categoryId: viandesCat.id,
      recipeIngredients: {
        create: [
          {
            productId: boeufMarine.id, // Using prepared marinated beef
            quantityRequired: 1.0,
            unit: 'KG',
          },
          {
            productId: pommesGrenailles.id, // Using prepared potatoes with herbs
            quantityRequired: 0.4,
            unit: 'KG',
          },
          {
            productId: bearnaise.id, // Using prepared béarnaise sauce
            quantityRequired: 0.15,
            unit: 'L',
          },
          {
            productId: productMap['Carottes'].id, // Fresh vegetables
            quantityRequired: 0.1,
            unit: 'KG',
          },
        ],
      },
    },
  });

  // DESSERTS
  const rhubarbe = await prisma.dish.create({
    data: {
      name: 'La rhubarbe',
      description: 'Marbré confit et chocolat dulcey, jus et sorbet à la groseille, gros sablé breton',
      sellingPrice: 14.00,
      isActive: true,
      categoryId: dessertsAssietteCat.id,
      recipeIngredients: {
        create: [
          {
            productId: productMap['Sucre en poudre'].id,
            quantityRequired: 0.08,
            unit: 'KG',
          },
          {
            productId: productMap['Farine T55'].id,
            quantityRequired: 0.06,
            unit: 'KG',
          },
          {
            productId: productMap['Beurre doux'].id,
            quantityRequired: 0.04,
            unit: 'KG',
          },
        ],
      },
    },
  });

  const primeursFrages = await prisma.dish.create({
    data: {
      name: 'Les primeurs de fraises',
      description: 'Jus et tartare, sablé croustillant et crème chiboust caramélisée aux oranges sanguines',
      sellingPrice: 14.00,
      isActive: true,
      categoryId: dessertsAssietteCat.id,
      recipeIngredients: {
        create: [
          {
            productId: productMap['Sucre en poudre'].id,
            quantityRequired: 0.07,
            unit: 'KG',
          },
          {
            productId: productMap['Œufs frais'].id,
            quantityRequired: 2,
            unit: 'PC',
          },
          {
            productId: productMap['Farine T55'].id,
            quantityRequired: 0.05,
            unit: 'KG',
          },
        ],
      },
    },
  });

  const milleFeuille = await prisma.dish.create({
    data: {
      name: 'Le véritable mille-feuille',
      description: 'Pâte caramélisée, à la vanille « bourbon» et caramel au beurre salé',
      sellingPrice: 14.00,
      isActive: true,
      categoryId: patisserieCat.id,
      recipeIngredients: {
        create: [
          {
            productId: productMap['Farine T55'].id,
            quantityRequired: 0.1,
            unit: 'KG',
          },
          {
            productId: productMap['Beurre doux'].id,
            quantityRequired: 0.08,
            unit: 'KG',
          },
          {
            productId: cremePat.id,
            quantityRequired: 0.15,
            unit: 'L',
          },
        ],
      },
    },
  });

  const madeleine = await prisma.dish.create({
    data: {
      name: 'La madeleine « de Proust » au citron',
      description: 'Confit agrumes au poivre de Timut, crémeux et perles de yuzu',
      sellingPrice: 15.00,
      isActive: true,
      categoryId: patisserieCat.id,
      recipeIngredients: {
        create: [
          {
            productId: productMap['Farine T55'].id,
            quantityRequired: 0.05,
            unit: 'KG',
          },
          {
            productId: productMap['Œufs frais'].id,
            quantityRequired: 2,
            unit: 'PC',
          },
          {
            productId: productMap['Beurre doux'].id,
            quantityRequired: 0.05,
            unit: 'KG',
          },
          {
            productId: productMap['Sucre en poudre'].id,
            quantityRequired: 0.06,
            unit: 'KG',
          },
        ],
      },
    },
  });

  const gourmand = await prisma.dish.create({
    data: {
      name: 'Le gourmand',
      description: 'Trois inspirations du moment de notre pâtissier',
      sellingPrice: 15.00,
      isActive: true,
      categoryId: dessertsAssietteCat.id,
      recipeIngredients: {
        create: [
          {
            productId: productMap['Sucre en poudre'].id,
            quantityRequired: 0.1,
            unit: 'KG',
          },
          {
            productId: productMap['Farine T55'].id,
            quantityRequired: 0.08,
            unit: 'KG',
          },
        ],
      },
    },
  });

  const chocolatXoco = await prisma.dish.create({
    data: {
      name: 'Le chocolat « Xoco »',
      description: 'Biscuit Marigny moelleux, ganache et crémeux au chocolat 70%, sorbet framboise et opaline croustillante',
      sellingPrice: 17.00,
      isActive: true,
      categoryId: dessertsAssietteCat.id,
      recipeIngredients: {
        create: [
          {
            productId: productMap['Œufs frais'].id,
            quantityRequired: 2,
            unit: 'PC',
          },
          {
            productId: productMap['Sucre en poudre'].id,
            quantityRequired: 0.12,
            unit: 'KG',
          },
          {
            productId: productMap['Farine T55'].id,
            quantityRequired: 0.06,
            unit: 'KG',
          },
          {
            productId: productMap['Beurre doux'].id,
            quantityRequired: 0.06,
            unit: 'KG',
          },
        ],
      },
    },
  });

  const fromages = await prisma.dish.create({
    data: {
      name: 'Les fromages « de la maison Guibert »',
      description: 'Composition de trois fromages à sélectionner, chutney à la figue et quelques pousses',
      sellingPrice: 15.00,
      isActive: true,
      categoryId: dessertsCat.id, // Parent category for cheese plate
      recipeIngredients: {
        create: [],
      },
    },
  });

  console.log('✅ Created 21 dishes with recipe ingredients\n');

  // ============================================================================
  // MENUS (from Sens Unique Restaurant)
  // ============================================================================
  console.log('📋 Creating menus...');

  const menuCanaille = await prisma.menu.create({
    data: {
      name: 'Menu Canaille',
      description: 'Menu servi dans son intégralité',
      fixedPrice: 49.00,
      pricingType: PricingType.PRIX_FIXE,
      isActive: true,
      sections: {
        create: [
          {
            name: 'Nos Entrées',
            displayOrder: 1,
            isRequired: true,
            dishes: {
              create: [
                {
                  dishId: laMer.id,
                  displayOrder: 1,
                  priceOverride: 0,
                },
                {
                  dishId: carpaccioVeau.id,
                  displayOrder: 2,
                  priceOverride: 0,
                },
                {
                  dishId: tarteVegetarienne.id,
                  displayOrder: 3,
                  priceOverride: 0,
                },
              ],
            },
          },
          {
            name: 'Nos Plats',
            displayOrder: 2,
            isRequired: true,
            dishes: {
              create: [
                {
                  dishId: filetDaurade.id,
                  displayOrder: 1,
                  priceOverride: 0,
                },
                {
                  dishId: ongletBoeuf.id,
                  displayOrder: 2,
                  priceOverride: 0,
                },
                {
                  dishId: epauleAgneau.id,
                  displayOrder: 3,
                  priceOverride: 0,
                },
                {
                  dishId: vegetal.id,
                  displayOrder: 4,
                  priceOverride: 0,
                },
              ],
            },
          },
          {
            name: 'Nos Desserts',
            displayOrder: 3,
            isRequired: true,
            dishes: {
              create: [
                {
                  dishId: rhubarbe.id,
                  displayOrder: 1,
                  priceOverride: 0,
                },
                {
                  dishId: primeursFrages.id,
                  displayOrder: 2,
                  priceOverride: 0,
                },
                {
                  dishId: milleFeuille.id,
                  displayOrder: 3,
                  priceOverride: 0,
                },
              ],
            },
          },
        ],
      },
    },
  });

  const menuGourmand = await prisma.menu.create({
    data: {
      name: 'Menu Gourmand',
      description: 'Menu servi dans son intégralité',
      fixedPrice: 68.00,
      pricingType: PricingType.PRIX_FIXE,
      isActive: true,
      sections: {
        create: [
          {
            name: 'Nos Entrées',
            displayOrder: 1,
            isRequired: true,
            dishes: {
              create: [
                {
                  dishId: foieGras.id,
                  displayOrder: 1,
                  priceOverride: 0,
                },
                {
                  dishId: escargots.id,
                  displayOrder: 2,
                  priceOverride: 0,
                },
                {
                  dishId: cevicheBar.id,
                  displayOrder: 3,
                  priceOverride: 0,
                },
              ],
            },
          },
          {
            name: 'Nos Plats',
            displayOrder: 2,
            isRequired: true,
            dishes: {
              create: [
                {
                  dishId: gambas.id,
                  displayOrder: 1,
                  priceOverride: 0,
                },
                {
                  dishId: quasiVeau.id,
                  displayOrder: 2,
                  priceOverride: 0,
                },
                {
                  dishId: poularde.id,
                  displayOrder: 3,
                  priceOverride: 0,
                },
                {
                  dishId: vegetal.id,
                  displayOrder: 4,
                  priceOverride: 0,
                },
              ],
            },
          },
          {
            name: 'Nos Desserts',
            displayOrder: 3,
            isRequired: true,
            dishes: {
              create: [
                {
                  dishId: madeleine.id,
                  displayOrder: 1,
                  priceOverride: 0,
                },
                {
                  dishId: gourmand.id,
                  displayOrder: 2,
                  priceOverride: 0,
                },
                {
                  dishId: chocolatXoco.id,
                  displayOrder: 3,
                  priceOverride: 0,
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log('✅ Created 2 menus with sections and dishes\n');

  // ============================================================================
  // BILLS & STOCK MOVEMENTS
  // ============================================================================
  console.log('📄 Creating bills and stock movements...');

  // Helper function to create date N days ago
  const getDaysAgo = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  };

  const bill1 = await prisma.bill.create({
    data: {
      filename: 'facture_metro_20250115.pdf',
      supplier: {
        connect: { id: metro.id }
      },
      billDate: getDaysAgo(8),
      totalAmount: 1245.80,
      status: 'PROCESSED',
      products: {
        create: [
          {
            productId: productMap['Lait entier'].id,
            quantityExtracted: 30,
            unitPriceExtracted: 1.2,
            totalValueExtracted: 36.0,
          },
          {
            productId: productMap['Farine T55'].id,
            quantityExtracted: 50,
            unitPriceExtracted: 1.1,
            totalValueExtracted: 55.0,
          },
          {
            productId: productMap['Poulet fermier (entier)'].id,
            quantityExtracted: 15,
            unitPriceExtracted: 12.5,
            totalValueExtracted: 187.5,
          },
        ],
      },
      stockMovements: {
        create: [
          {
            productId: productMap['Lait entier'].id,
            movementType: MovementType.IN,
            quantity: 30,
            balanceAfter: 80,
            reason: 'Livraison facture Metro',
            userId: admin.id,
          },
          {
            productId: productMap['Farine T55'].id,
            movementType: MovementType.IN,
            quantity: 50,
            balanceAfter: 150,
            reason: 'Livraison facture Metro',
            userId: admin.id,
          },
          {
            productId: productMap['Poulet fermier (entier)'].id,
            movementType: MovementType.IN,
            quantity: 15,
            balanceAfter: 45,
            reason: 'Livraison facture Metro',
            userId: admin.id,
          },
        ],
      },
    },
  });

  const bill2 = await prisma.bill.create({
    data: {
      filename: 'facture_rungis_20250116.pdf',
      supplier: {
        connect: { id: rungis.id }
      },
      billDate: getDaysAgo(7),
      totalAmount: 685.50,
      status: 'PROCESSED',
      products: {
        create: [
          {
            productId: productMap['Saumon norvégien'].id,
            quantityExtracted: 15,
            unitPriceExtracted: 22.0,
            totalValueExtracted: 330.0,
          },
          {
            productId: productMap['Filet de bœuf'].id,
            quantityExtracted: 8,
            unitPriceExtracted: 35.0,
            totalValueExtracted: 280.0,
          },
        ],
      },
      stockMovements: {
        create: [
          {
            productId: productMap['Saumon norvégien'].id,
            movementType: MovementType.IN,
            quantity: 15,
            balanceAfter: 30,
            reason: 'Livraison Rungis',
            userId: user.id,
          },
          {
            productId: productMap['Filet de bœuf'].id,
            movementType: MovementType.IN,
            quantity: 8,
            balanceAfter: 20,
            reason: 'Livraison Rungis',
            userId: user.id,
          },
        ],
      },
    },
  });

  const bill3 = await prisma.bill.create({
    data: {
      filename: 'facture_lactalis_20250117.pdf',
      supplier: {
        connect: { id: lactalis.id }
      },
      billDate: getDaysAgo(5),
      totalAmount: 342.00,
      status: 'PROCESSED',
      products: {
        create: [
          {
            productId: productMap['Crème fraîche 35%'].id,
            quantityExtracted: 20,
            unitPriceExtracted: 4.5,
            totalValueExtracted: 90.0,
          },
          {
            productId: productMap['Beurre doux'].id,
            quantityExtracted: 10,
            unitPriceExtracted: 8.5,
            totalValueExtracted: 85.0,
          },
          {
            productId: productMap['Œufs frais'].id,
            quantityExtracted: 200,
            unitPriceExtracted: 0.25,
            totalValueExtracted: 50.0,
          },
        ],
      },
      stockMovements: {
        create: [
          {
            productId: productMap['Crème fraîche 35%'].id,
            movementType: MovementType.IN,
            quantity: 20,
            balanceAfter: 40,
            reason: 'Livraison Lactalis',
            userId: admin.id,
          },
          {
            productId: productMap['Beurre doux'].id,
            movementType: MovementType.IN,
            quantity: 10,
            balanceAfter: 25,
            reason: 'Livraison Lactalis',
            userId: admin.id,
          },
          {
            productId: productMap['Œufs frais'].id,
            movementType: MovementType.IN,
            quantity: 200,
            balanceAfter: 500,
            reason: 'Livraison Lactalis',
            userId: admin.id,
          },
        ],
      },
    },
  });

  const bill4 = await prisma.bill.create({
    data: {
      filename: 'facture_jardins_20250118.pdf',
      supplier: {
        connect: { id: legumes.id }
      },
      billDate: getDaysAgo(3),
      totalAmount: 528.50,
      status: 'PROCESSED',
      products: {
        create: [
          {
            productId: productMap['Pommes de terre'].id,
            quantityExtracted: 100,
            unitPriceExtracted: 1.8,
            totalValueExtracted: 180.0,
          },
          {
            productId: productMap['Carottes'].id,
            quantityExtracted: 40,
            unitPriceExtracted: 2.0,
            totalValueExtracted: 80.0,
          },
          {
            productId: productMap['Oignons'].id,
            quantityExtracted: 35,
            unitPriceExtracted: 1.5,
            totalValueExtracted: 52.5,
          },
          {
            productId: productMap['Tomates'].id,
            quantityExtracted: 30,
            unitPriceExtracted: 3.5,
            totalValueExtracted: 105.0,
          },
        ],
      },
      stockMovements: {
        create: [
          {
            productId: productMap['Pommes de terre'].id,
            movementType: MovementType.IN,
            quantity: 100,
            balanceAfter: 180,
            reason: 'Livraison Jardins du Marais',
            userId: user.id,
          },
          {
            productId: productMap['Carottes'].id,
            movementType: MovementType.IN,
            quantity: 40,
            balanceAfter: 65,
            reason: 'Livraison Jardins du Marais',
            userId: user.id,
          },
          {
            productId: productMap['Oignons'].id,
            movementType: MovementType.IN,
            quantity: 35,
            balanceAfter: 65,
            reason: 'Livraison Jardins du Marais',
            userId: user.id,
          },
          {
            productId: productMap['Tomates'].id,
            movementType: MovementType.IN,
            quantity: 30,
            balanceAfter: 50,
            reason: 'Livraison Jardins du Marais',
            userId: user.id,
          },
        ],
      },
    },
  });

  const bill5 = await prisma.bill.create({
    data: {
      filename: 'facture_epicerie_20250119.pdf',
      supplier: {
        connect: { id: epicerie.id }
      },
      billDate: getDaysAgo(1),
      totalAmount: 195.50,
      status: 'PROCESSED',
      products: {
        create: [
          {
            productId: productMap['Sucre en poudre'].id,
            quantityExtracted: 50,
            unitPriceExtracted: 1.5,
            totalValueExtracted: 75.0,
          },
          {
            productId: productMap['Sel fin'].id,
            quantityExtracted: 30,
            unitPriceExtracted: 0.8,
            totalValueExtracted: 24.0,
          },
        ],
      },
      stockMovements: {
        create: [
          {
            productId: productMap['Sucre en poudre'].id,
            movementType: MovementType.IN,
            quantity: 50,
            balanceAfter: 95,
            reason: 'Livraison Épicerie Centrale',
            userId: admin.id,
          },
          {
            productId: productMap['Sel fin'].id,
            movementType: MovementType.IN,
            quantity: 30,
            balanceAfter: 55,
            reason: 'Livraison Épicerie Centrale',
            userId: admin.id,
          },
        ],
      },
    },
  });

  console.log('✅ Created 5 bills with stock movements\n');

  // ============================================================================
  // ADDITIONAL STOCK MOVEMENTS (Daily operations in last 10 days)
  // ============================================================================
  console.log('📊 Creating additional stock movements...');

  // Simulate daily stock usage and adjustments
  const additionalMovements = [];

  for (let daysAgo = 0; daysAgo < 10; daysAgo++) {
    const movementDate = getDaysAgo(daysAgo);
    const userId = daysAgo % 2 === 0 ? admin.id : user.id;

    // Daily usage patterns
    additionalMovements.push(
      // Meat usage
      {
        productId: productMap['Onglet de bœuf'].id,
        movementType: MovementType.OUT,
        quantity: 2.5 + Math.random() * 2,
        balanceAfter: productMap['Onglet de bœuf'].quantity - (2.5 + Math.random() * 2),
        reason: 'Utilisation cuisine - service du jour',
        userId,
        createdAt: movementDate,
      },
      {
        productId: productMap['Poulet fermier (entier)'].id,
        movementType: MovementType.OUT,
        quantity: 3 + Math.floor(Math.random() * 3),
        balanceAfter: productMap['Poulet fermier (entier)'].quantity - (3 + Math.floor(Math.random() * 3)),
        reason: 'Utilisation cuisine - service du jour',
        userId,
        createdAt: movementDate,
      },
      // Seafood usage
      {
        productId: productMap['Saumon norvégien'].id,
        movementType: MovementType.OUT,
        quantity: 1.5 + Math.random() * 1.5,
        balanceAfter: productMap['Saumon norvégien'].quantity - (1.5 + Math.random() * 1.5),
        reason: 'Utilisation cuisine - service du jour',
        userId,
        createdAt: movementDate,
      },
      {
        productId: productMap['Bar de ligne'].id,
        movementType: MovementType.OUT,
        quantity: 1 + Math.random() * 1,
        balanceAfter: productMap['Bar de ligne'].quantity - (1 + Math.random() * 1),
        reason: 'Utilisation cuisine - service du jour',
        userId,
        createdAt: movementDate,
      },
      // Vegetables usage
      {
        productId: productMap['Tomates'].id,
        movementType: MovementType.OUT,
        quantity: 2 + Math.random() * 2,
        balanceAfter: productMap['Tomates'].quantity - (2 + Math.random() * 2),
        reason: 'Utilisation cuisine - service du jour',
        userId,
        createdAt: movementDate,
      },
      {
        productId: productMap['Pommes de terre'].id,
        movementType: MovementType.OUT,
        quantity: 5 + Math.random() * 5,
        balanceAfter: productMap['Pommes de terre'].quantity - (5 + Math.random() * 5),
        reason: 'Utilisation cuisine - service du jour',
        userId,
        createdAt: movementDate,
      }
    );
  }

  await prisma.stockMovement.createMany({
    data: additionalMovements,
  });

  console.log(`✅ Created ${additionalMovements.length} additional stock movements (last 10 days)\n`);

  // ============================================================================
  // SALES
  // ============================================================================
  console.log('💰 Creating sales records...');

  const today = new Date();

  // Generate comprehensive sales data for 21 days
  const salesData: Array<{
    dishId: string;
    quantitySold: number;
    saleDate: Date;
    userId: string;
    notes?: string;
  }> = [];

  // Define realistic sales patterns for each dish
  const dishSalesPatterns = [
    // Popular dishes (higher volume)
    { dish: ongletBoeuf, min: 10, max: 18, frequency: 0.9 },
    { dish: filetDaurade, min: 8, max: 14, frequency: 0.85 },
    { dish: gambas, min: 7, max: 13, frequency: 0.8 },
    { dish: poularde, min: 9, max: 15, frequency: 0.85 },
    { dish: laMer, min: 10, max: 16, frequency: 0.9 },
    { dish: chocolatXoco, min: 12, max: 18, frequency: 0.95 },
    { dish: milleFeuille, min: 10, max: 16, frequency: 0.9 },

    // Medium popularity dishes
    { dish: vegetal, min: 6, max: 12, frequency: 0.75 },
    { dish: tarteVegetarienne, min: 6, max: 11, frequency: 0.75 },
    { dish: carpaccioVeau, min: 5, max: 10, frequency: 0.7 },
    { dish: cevicheBar, min: 5, max: 11, frequency: 0.75 },
    { dish: quasiVeau, min: 5, max: 9, frequency: 0.7 },
    { dish: epauleAgneau, min: 6, max: 11, frequency: 0.75 },
    { dish: primeursFrages, min: 8, max: 13, frequency: 0.8 },
    { dish: madeleine, min: 7, max: 12, frequency: 0.8 },
    { dish: rhubarbe, min: 6, max: 11, frequency: 0.75 },

    // Premium/specialty dishes (lower frequency)
    { dish: foieGras, min: 4, max: 9, frequency: 0.65 },
    { dish: escargots, min: 5, max: 10, frequency: 0.7 },
    { dish: coteBoeuf, min: 2, max: 5, frequency: 0.5 }, // For 2 people
    { dish: gourmand, min: 6, max: 10, frequency: 0.7 },
    { dish: fromages, min: 4, max: 8, frequency: 0.6 },
  ];

  // Generate sales for the last 21 days
  for (let daysAgo = 0; daysAgo < 21; daysAgo++) {
    const saleDate = getDaysAgo(daysAgo);
    const isWeekend = saleDate.getDay() === 0 || saleDate.getDay() === 6;
    const userId = daysAgo % 2 === 0 ? admin.id : user.id;

    dishSalesPatterns.forEach(({ dish, min, max, frequency }) => {
      // Randomly determine if this dish is sold on this day based on frequency
      if (Math.random() < frequency) {
        // Weekend gets 20% boost in sales
        const volumeMultiplier = isWeekend ? 1.2 : 1.0;
        const baseQuantity = Math.floor(Math.random() * (max - min + 1)) + min;
        const quantitySold = Math.round(baseQuantity * volumeMultiplier);

        salesData.push({
          dishId: dish.id,
          quantitySold,
          saleDate,
          userId,
          notes: isWeekend && quantitySold > max ? 'Weekend - forte affluence' : undefined,
        });
      }
    });
  }

  await prisma.sale.createMany({
    data: salesData,
  });

  console.log(`✅ Created ${salesData.length} sales records over 21 days\n`);

  // ============================================================================
  // DLC (Best Before Dates)
  // ============================================================================
  console.log('📅 Creating DLC records...');

  const futureDate1 = new Date();
  futureDate1.setDate(futureDate1.getDate() + 3);
  const futureDate2 = new Date();
  futureDate2.setDate(futureDate2.getDate() + 7);
  const futureDate3 = new Date();
  futureDate3.setDate(futureDate3.getDate() + 14);
  const expiredDate = new Date();
  expiredDate.setDate(expiredDate.getDate() - 2);

  await prisma.dLC.createMany({
    data: [
      {
        productId: productMap['Saumon norvégien'].id,
        expirationDate: futureDate1,
        quantity: 5,
        unit: Unit.KG,
        batchNumber: 'SAU-2025-001',
        supplierId: rungis.id,
        status: DLCStatus.ACTIVE,
        notes: 'Arrivage du 16/01',
      },
      {
        productId: productMap['Poulet fermier (entier)'].id,
        expirationDate: futureDate2,
        quantity: 10,
        unit: Unit.PC,
        batchNumber: 'POU-2025-024',
        supplierId: metro.id,
        status: DLCStatus.ACTIVE,
      },
      {
        productId: productMap['Crème fraîche 35%'].id,
        expirationDate: futureDate3,
        quantity: 8,
        unit: Unit.L,
        batchNumber: 'CRE-2025-008',
        supplierId: lactalis.id,
        status: DLCStatus.ACTIVE,
      },
      {
        productId: productMap['Œufs frais'].id,
        expirationDate: expiredDate,
        quantity: 30,
        unit: Unit.PC,
        batchNumber: 'OEU-2025-002',
        supplierId: lactalis.id,
        status: DLCStatus.EXPIRED,
        notes: 'À retirer du stock',
      },
      {
        productId: productMap['Onglet de bœuf'].id,
        expirationDate: futureDate1,
        quantity: 8,
        unit: Unit.KG,
        batchNumber: 'BEF-2025-012',
        supplierId: rungis.id,
        status: DLCStatus.ACTIVE,
        notes: 'Viande premium - onglet',
      },
      {
        productId: productMap['Tomates'].id,
        expirationDate: futureDate1,
        quantity: 15,
        unit: Unit.KG,
        batchNumber: 'TOM-2025-045',
        supplierId: legumes.id,
        status: DLCStatus.ACTIVE,
      },
    ],
  });

  console.log('✅ Created 6 DLC records\n');

  // ============================================================================
  // DISPUTES
  // ============================================================================
  console.log('⚠️ Creating disputes...');

  const dispute1 = await prisma.dispute.create({
    data: {
      billId: bill2.id,
      type: 'COMPLAINT',
      status: 'RESOLVED',
      title: 'Qualité du saumon non conforme',
      description: 'Le saumon livré présentait des signes de manque de fraîcheur. Odeur suspecte détectée à la réception.',
      amountDisputed: 110.0,
      resolvedAt: new Date('2025-01-17'),
      resolutionNotes: 'Avoir de 50% accordé par le fournisseur pour la prochaine commande',
      products: {
        create: [
          {
            productId: productMap['Saumon norvégien'].id,
            quantityDisputed: 5,
            reason: 'Qualité non conforme',
            description: 'Couleur terne, texture molle',
          },
        ],
      },
    },
  });

  const dispute2 = await prisma.dispute.create({
    data: {
      billId: bill1.id,
      type: 'RETURN',
      status: 'IN_PROGRESS',
      title: 'Quantité de poulets manquante',
      description: 'Facturé 15 poulets mais seulement 12 reçus dans la livraison',
      amountDisputed: 37.5,
      products: {
        create: [
          {
            productId: productMap['Poulet fermier (entier)'].id,
            quantityDisputed: 3,
            reason: 'Quantité manquante',
            description: 'Carton ouvert, 3 poulets manquants',
          },
        ],
      },
    },
  });

  console.log('✅ Created 2 disputes\n');

  // ============================================================================
  // PRICE HISTORY
  // ============================================================================
  console.log('💰 Creating price history records...');

  // Simulate realistic price changes over time for several products
  const priceHistoryData = [
    // Saumon - increased by 8% (20.00 -> 22.00)
    {
      productId: productMap['Saumon norvégien'].id,
      oldPrice: 20.00,
      newPrice: 22.00,
      changePercent: 10.0,
      quantityPurchased: 15,
      billId: bill2.id,
      supplierId: rungis.id,
      changedAt: getDaysAgo(7),
    },
    // Filet de bœuf - increased by 12.9% (31.00 -> 35.00)
    {
      productId: productMap['Filet de bœuf'].id,
      oldPrice: 31.00,
      newPrice: 35.00,
      changePercent: 12.9,
      quantityPurchased: 8,
      billId: bill2.id,
      supplierId: rungis.id,
      changedAt: getDaysAgo(7),
    },
    // Lait - slight increase 3.4% (1.16 -> 1.20)
    {
      productId: productMap['Lait entier'].id,
      oldPrice: 1.16,
      newPrice: 1.20,
      changePercent: 3.4,
      quantityPurchased: 30,
      billId: bill1.id,
      supplierId: metro.id,
      changedAt: getDaysAgo(8),
    },
    // Crème fraîche - increased by 6.7% (4.20 -> 4.50)
    {
      productId: productMap['Crème fraîche 35%'].id,
      oldPrice: 4.20,
      newPrice: 4.50,
      changePercent: 7.1,
      quantityPurchased: 20,
      billId: bill3.id,
      supplierId: lactalis.id,
      changedAt: getDaysAgo(5),
    },
    // Tomates - seasonal decrease -8.7% (3.80 -> 3.50)
    {
      productId: productMap['Tomates'].id,
      oldPrice: 3.80,
      newPrice: 3.50,
      changePercent: -7.9,
      quantityPurchased: 30,
      billId: bill4.id,
      supplierId: legumes.id,
      changedAt: getDaysAgo(3),
      reason: 'Seasonal price drop - summer harvest',
    },
    // Onglet de bœuf - slight increase 5.7% (26.50 -> 28.00)
    {
      productId: productMap['Onglet de bœuf'].id,
      oldPrice: 26.50,
      newPrice: 28.00,
      changePercent: 5.7,
      quantityPurchased: 12,
      billId: bill2.id,
      supplierId: rungis.id,
      changedAt: getDaysAgo(7),
    },
    // Poulet fermier - increased by 4% (12.00 -> 12.50)
    {
      productId: productMap['Poulet fermier (entier)'].id,
      oldPrice: 12.00,
      newPrice: 12.50,
      changePercent: 4.2,
      quantityPurchased: 15,
      billId: bill1.id,
      supplierId: metro.id,
      changedAt: getDaysAgo(8),
    },
    // Beurre - increased significantly 13.3% (7.50 -> 8.50)
    {
      productId: productMap['Beurre doux'].id,
      oldPrice: 7.50,
      newPrice: 8.50,
      changePercent: 13.3,
      quantityPurchased: 10,
      billId: bill3.id,
      supplierId: lactalis.id,
      changedAt: getDaysAgo(5),
      reason: 'Dairy prices surge',
    },
    // Pommes de terre - stable price (1.80 -> 1.80)
    {
      productId: productMap['Pommes de terre'].id,
      oldPrice: 1.75,
      newPrice: 1.80,
      changePercent: 2.9,
      quantityPurchased: 100,
      billId: bill4.id,
      supplierId: legumes.id,
      changedAt: getDaysAgo(3),
    },
    // Sucre - slight decrease -3.2% (1.55 -> 1.50)
    {
      productId: productMap['Sucre en poudre'].id,
      oldPrice: 1.55,
      newPrice: 1.50,
      changePercent: -3.2,
      quantityPurchased: 50,
      billId: bill5.id,
      supplierId: epicerie.id,
      changedAt: getDaysAgo(1),
    },
  ];

  await prisma.priceHistory.createMany({
    data: priceHistoryData,
  });

  console.log(`✅ Created ${priceHistoryData.length} price history records\n`);

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✨ Database seeding completed successfully!\n');
  console.log('📊 Summary (Sens Unique Restaurant - Cocorico v2):');
  console.log('  👤 Users: 2');
  console.log('     - admin@cocorico.fr (password: admin123)');
  console.log('     - user@cocorico.fr (password: user123)');
  console.log('');
  console.log('  🏢 Suppliers: 5');
  console.log('     - Metro Cash & Carry');
  console.log('     - Rungis Marée');
  console.log('     - Lactalis');
  console.log('     - Les Jardins du Marais');
  console.log('     - Épicerie Centrale');
  console.log('');
  console.log(`  📦 Base Products: ${products.length + 1}`); // +1 for Onglet de bœuf
  console.log('     - Produits laitiers: 4 (Lait, Crème, Beurre, Œufs)');
  console.log('     - Épicerie sèche: 3 (Farine, Sucre, Sel)');
  console.log('     - Viandes: 5 (Poulet, Canard, Filet de bœuf, Onglet de bœuf, Veau)');
  console.log('     - Poissons: 4 (Saumon, Bar, Daurade, Gambas)');
  console.log('     - Légumes: 4 (Pommes de terre, Carottes, Oignons, Tomates)');
  console.log('     - Herbes: 2 (Persil, Thym)');
  console.log('');
  console.log('  📚 Recipe Categories: 9');
  console.log('     - DISH categories: 7');
  console.log('       • Entrées Froides 🥗');
  console.log('       • Entrées Chaudes 🍲');
  console.log('       • Poissons 🐟');
  console.log('       • Viandes 🥩');
  console.log('       • Desserts 🍰');
  console.log('         ├─ Pâtisserie');
  console.log('         └─ Desserts à l\'Assiette');
  console.log('     - PREPARED_INGREDIENT categories: 2');
  console.log('       • Bases & Crèmes 🥛');
  console.log('       • Sauces 🥫');
  console.log('');
  console.log('  🧪 Composite Products: 11 (categorized)');
  console.log('     Bases & Crèmes:');
  console.log('       - Crème pâtissière');
  console.log('       - Pommes grenailles préparées');
  console.log('       - Mousseline de pommes de terre');
  console.log('       - Bœuf mariné');
  console.log('       - Onglet de bœuf mariné');
  console.log('       - Gambas marinées au thym');
  console.log('       - Veau mariné au thym');
  console.log('     Sauces:');
  console.log('       - Sauce béchamel');
  console.log('       - Marinade pour viande rouge');
  console.log('       - Sauce béarnaise');
  console.log('       - Siphon à la tomate');
  console.log('');
  console.log('  🍽️  Dishes: 21 (from Sens Unique Restaurant - all categorized)');
  console.log('     - 4 Entrées Froides');
  console.log('     - 2 Entrées Chaudes');
  console.log('     - 2 Poissons');
  console.log('     - 6 Viandes');
  console.log('     - 7 Desserts (2 Pâtisserie, 4 Desserts à l\'Assiette, 1 Fromages)');
  console.log('');
  console.log('  📋 Menus: 2');
  console.log('     - Menu Canaille (49€) - 3 courses');
  console.log('     - Menu Gourmand (68€) - 3 courses');
  console.log('');
  console.log('  📄 Bills: 5 (with stock movements)');
  console.log('     - Total amount: 2,997.30€');
  console.log(`     - Bills dated: last 8 days`);
  console.log('');
  console.log(`  📊 Stock Movements: ${additionalMovements.length + 15} total`);
  console.log('     - 15 from bill deliveries');
  console.log(`     - ${additionalMovements.length} from daily operations (last 10 days)`);
  console.log('');
  console.log(`  💰 Sales: ${salesData.length} records (over 21 days)`);
  console.log('     - Comprehensive sales data for all dishes');
  console.log('     - Realistic patterns with weekend boosts');
  console.log('     - Average ~200+ sales per week');
  console.log('');
  console.log('  📅 DLC Records: 6');
  console.log('     - 5 active batches');
  console.log('     - 1 expired batch (Œufs)');
  console.log('');
  console.log('  ⚠️  Disputes: 2');
  console.log('     - 1 resolved (Qualité saumon)');
  console.log('     - 1 in progress (Quantité poulets)');
  console.log('');
  console.log(`  💰 Price History: ${priceHistoryData.length} records`);
  console.log('     - 8 price increases (3.4% to 13.3%)');
  console.log('     - 2 price decreases (-3.2% to -7.9%)');
  console.log('     - Tracked across last 8 days');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 Ready to test! All data is loaded.\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
