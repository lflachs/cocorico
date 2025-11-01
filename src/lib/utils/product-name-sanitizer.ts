/**
 * Product Name Sanitizer
 * Cleans up OCR-extracted product names from bills
 */

/**
 * Sanitize a product name from OCR extraction
 * Removes common OCR artifacts, weight specifications, and normalizes text
 */
export function sanitizeProductName(rawName: string): string {
  let cleaned = rawName;

  // Remove common OCR artifacts and symbols
  cleaned = cleaned.replace(/[*#@$%^&]/g, '');

  // Remove weight/size specifications in various formats
  // Examples: "40/60 GRS", "X1KG", "1KG", "500G", etc.
  cleaned = cleaned.replace(/\b\d+\/\d+\s*(GRS|G|KG|L|ML|GR|GRAMMES?|KILOS?)\b/gi, '');
  cleaned = cleaned.replace(/\bX?\d+\.?\d*\s*(KG|G|L|ML|GRS?|GRAMMES?|KILOS?)\b/gi, '');

  // Remove packaging specifications
  // Examples: "BARQUETTE", "SACHET", "BOITE", etc.
  cleaned = cleaned.replace(/\b(BARQUETTE|SACHET|BOITE|BOX|BAG|PACK|COLIS)\b/gi, '');

  // Remove country codes and origins at the end
  // Examples: "F.G", "FR", "ESP", "ITA"
  cleaned = cleaned.replace(/\b[A-Z]{1,3}\.[A-Z]{1,2}\b/g, '');
  cleaned = cleaned.replace(/\b(FRANCE|FRANCAIS|FR|ESP|ESPAGNE|ITA|ITALIE)\b/gi, '');

  // Remove extra spaces and trim
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // Capitalize first letter of each word for consistency
  cleaned = cleaned
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return cleaned;
}

/**
 * Extract unit information from product name if present
 */
export function extractUnitFromName(rawName: string): { unit: string | null; quantity: number | null } {
  // Try to extract weight/volume specifications
  const kgMatch = rawName.match(/X?(\d+\.?\d*)\s*KG/i);
  if (kgMatch) {
    return { unit: 'KG', quantity: parseFloat(kgMatch[1]) };
  }

  const gMatch = rawName.match(/X?(\d+\.?\d*)\s*(G|GRS?|GRAMMES?)/i);
  if (gMatch) {
    return { unit: 'G', quantity: parseFloat(gMatch[1]) };
  }

  const lMatch = rawName.match(/X?(\d+\.?\d*)\s*L/i);
  if (lMatch) {
    return { unit: 'L', quantity: parseFloat(lMatch[1]) };
  }

  const mlMatch = rawName.match(/X?(\d+\.?\d*)\s*ML/i);
  if (mlMatch) {
    return { unit: 'ML', quantity: parseFloat(mlMatch[1]) };
  }

  return { unit: null, quantity: null };
}

/**
 * Common ingredient aliases for better matching
 * Maps variations to canonical names
 */
export const INGREDIENT_ALIASES: Record<string, string> = {
  // Poultry
  'poulet': 'Poulet',
  'blanc de poulet': 'Blanc De Poulet',
  'escalope de poulet': 'Escalope De Poulet',
  'escalope poulet': 'Escalope De Poulet',
  'escalope': 'Escalope De Poulet',
  'cuisse de poulet': 'Cuisse De Poulet',

  // Meat
  'boeuf': 'Boeuf',
  'steak': 'Steak De Boeuf',
  'viande hachée': 'Viande Hachée',
  'hachée': 'Viande Hachée',
  'porc': 'Porc',
  'côtelette': 'Côtelette De Porc',
  'veau': 'Veau',
  'escalope de veau': 'Escalope De Veau',

  // Fish
  'saumon': 'Saumon',
  'cabillaud': 'Cabillaud',
  'thon': 'Thon',
  'dorade': 'Dorade',
  'bar': 'Bar',
  'loup': 'Bar',
  'sole': 'Sole',
  'truite': 'Truite',

  // Vegetables
  'tomate': 'Tomate',
  'tomates': 'Tomate',
  'carotte': 'Carotte',
  'carottes': 'Carotte',
  'oignon': 'Oignon',
  'oignons': 'Oignon',
  'pomme de terre': 'Pomme De Terre',
  'pdt': 'Pomme De Terre',
  'patate': 'Pomme De Terre',
  'salade': 'Salade',
  'laitue': 'Salade',
  'courgette': 'Courgette',
  'courgettes': 'Courgette',
  'aubergine': 'Aubergine',
  'aubergines': 'Aubergine',

  // Dairy
  'lait': 'Lait',
  'crème': 'Crème Fraîche',
  'creme': 'Crème Fraîche',
  'crème fraîche': 'Crème Fraîche',
  'beurre': 'Beurre',
  'fromage': 'Fromage',
  'yaourt': 'Yaourt',
  'yogurt': 'Yaourt',

  // Condiments
  'huile': 'Huile',
  "huile d'olive": "Huile D'Olive",
  'vinaigre': 'Vinaigre',
  'moutarde': 'Moutarde',
  'sel': 'Sel',
  'poivre': 'Poivre',
};

/**
 * Try to match a sanitized name to a known ingredient
 */
export function matchToKnownIngredient(sanitizedName: string): string | null {
  const lowerName = sanitizedName.toLowerCase();

  // Direct match
  if (INGREDIENT_ALIASES[lowerName]) {
    return INGREDIENT_ALIASES[lowerName];
  }

  // Partial match - check if any alias is contained in the name
  for (const [alias, canonical] of Object.entries(INGREDIENT_ALIASES)) {
    if (lowerName.includes(alias)) {
      return canonical;
    }
  }

  return null;
}

/**
 * Full product name normalization pipeline
 */
export function normalizeProductName(rawName: string): {
  sanitized: string;
  suggested: string;
  unit: string | null;
  quantity: number | null;
} {
  const sanitized = sanitizeProductName(rawName);
  const suggested = matchToKnownIngredient(sanitized) || sanitized;
  const { unit, quantity } = extractUnitFromName(rawName);

  return {
    sanitized,
    suggested,
    unit,
    quantity,
  };
}
