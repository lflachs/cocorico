import { openai } from '@/lib/ai/openai';
import { db } from '@/lib/db/client';

/**
 * AI-powered category suggestion service
 * Suggests the best matching category for a product based on its name
 */

export async function suggestProductCategory(productName: string): Promise<string | null> {
  try {
    // Fetch available INVENTORY categories
    const categories = await db.recipeCategory.findMany({
      where: {
        categoryType: 'INVENTORY',
      },
      select: {
        id: true,
        name: true,
        icon: true,
      },
    });

    if (categories.length === 0) {
      console.log('[Category AI] No inventory categories found');
      return null;
    }

    // Build prompt for AI
    const categoryList = categories
      .map((c) => `- ${c.name} (${c.icon})`)
      .join('\n');

    const prompt = `You are a restaurant inventory categorization assistant. Given a product name, select the MOST APPROPRIATE category from the list below.

Product name: "${productName}"

Available categories:
${categoryList}

Rules:
1. Return ONLY the category name, nothing else
2. If the product doesn't fit any category well, return "Produits secs" as default
3. Consider the context of restaurant ingredients
4. Be precise - choose the most specific matching category

Examples:
- "Persil frais" → "Herbes aromatiques"
- "Sel fin" → "Condiments"
- "Poulet fermier" → "Protéines"
- "Lait entier" → "Produits laitiers"
- "Tomates" → "Légumes"
- "Farine T55" → "Produits secs"

Your answer (category name only):`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a precise categorization assistant. Return only the category name, no explanation.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent results
      max_tokens: 50,
    });

    const suggestedCategoryName = completion.choices[0]?.message?.content?.trim();

    if (!suggestedCategoryName) {
      console.log('[Category AI] No suggestion from AI');
      return null;
    }

    // Find the category ID by name (case-insensitive)
    const matchedCategory = categories.find(
      (c) => c.name.toLowerCase() === suggestedCategoryName.toLowerCase()
    );

    if (matchedCategory) {
      console.log(
        `[Category AI] "${productName}" → "${matchedCategory.name}" (${matchedCategory.icon})`
      );
      return matchedCategory.id;
    }

    // Fallback: try partial match
    const partialMatch = categories.find((c) =>
      c.name.toLowerCase().includes(suggestedCategoryName.toLowerCase())
    );

    if (partialMatch) {
      console.log(
        `[Category AI] "${productName}" → "${partialMatch.name}" (partial match)`
      );
      return partialMatch.id;
    }

    console.log(
      `[Category AI] No match found for suggestion "${suggestedCategoryName}"`
    );
    return null;
  } catch (error) {
    console.error('[Category AI] Error suggesting category:', error);
    return null;
  }
}
