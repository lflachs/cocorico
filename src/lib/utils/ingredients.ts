import ingredientsData from '@/data/ingredients-fr.json';

export type IngredientCategory = keyof typeof ingredientsData;

export type IngredientSuggestion = {
  name: string;
  category: string;
};

/**
 * Get all French ingredient suggestions as a flat array
 */
export function getAllIngredientSuggestions(): IngredientSuggestion[] {
  const suggestions: IngredientSuggestion[] = [];

  for (const [category, ingredients] of Object.entries(ingredientsData)) {
    for (const ingredient of ingredients) {
      suggestions.push({
        name: ingredient,
        category,
      });
    }
  }

  return suggestions;
}

/**
 * Get ingredient suggestions by category
 */
export function getIngredientsByCategory(category: IngredientCategory): string[] {
  return ingredientsData[category] || [];
}

/**
 * Search ingredient suggestions by query
 * @param query - Search query
 * @param limit - Maximum number of results (default: 50)
 */
export function searchIngredientSuggestions(query: string, limit: number = 50): IngredientSuggestion[] {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const normalizedQuery = query.toLowerCase().trim();
  const allSuggestions = getAllIngredientSuggestions();

  // Filter and sort by relevance
  const matches = allSuggestions
    .filter((suggestion) =>
      suggestion.name.toLowerCase().includes(normalizedQuery)
    )
    .sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();

      // Exact match first
      if (aName === normalizedQuery) return -1;
      if (bName === normalizedQuery) return 1;

      // Starts with query next
      const aStarts = aName.startsWith(normalizedQuery);
      const bStarts = bName.startsWith(normalizedQuery);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      // Then alphabetically
      return aName.localeCompare(bName, 'fr');
    })
    .slice(0, limit);

  return matches;
}

/**
 * Get all ingredient categories
 */
export function getIngredientCategories(): IngredientCategory[] {
  return Object.keys(ingredientsData) as IngredientCategory[];
}

/**
 * Get category display name (formatted)
 */
export function getCategoryDisplayName(category: string): string {
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Suggest a simplified display name from a full product name
 * @param fullName - The full product name (e.g., "Tomates rondes bio Fournisseur X")
 * @returns A suggested simplified display name (e.g., "Tomate")
 */
export function suggestDisplayName(fullName: string): string | null {
  if (!fullName || fullName.trim().length === 0) {
    return null;
  }

  const normalized = fullName.trim();
  const allIngredients = getAllIngredientSuggestions();

  // Try to find a matching ingredient in our database
  const lowerName = normalized.toLowerCase();

  // Check for exact matches first
  const exactMatch = allIngredients.find(ing =>
    lowerName === ing.name.toLowerCase()
  );
  if (exactMatch) {
    return exactMatch.name;
  }

  // Check if any ingredient name is contained in the product name
  const partialMatch = allIngredients.find(ing =>
    lowerName.includes(ing.name.toLowerCase())
  );
  if (partialMatch) {
    return partialMatch.name;
  }

  // Check if the product name starts with any ingredient
  const startsWithMatch = allIngredients.find(ing =>
    lowerName.startsWith(ing.name.toLowerCase())
  );
  if (startsWithMatch) {
    return startsWithMatch.name;
  }

  // Fallback: Take the first 1-2 words (but not more than 20 chars)
  const words = normalized.split(/\s+/);
  if (words.length >= 2 && words[0].length + words[1].length < 20) {
    return words[0] + ' ' + words[1];
  }
  if (words[0].length < 20) {
    return words[0];
  }

  // If nothing works, return null to use the full name
  return null;
}
