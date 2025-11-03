import { openai } from '@/lib/ai/openai';
import { db } from '@/lib/db/client';
import crypto from 'crypto';

/**
 * AI-powered byproduct suggestion service for zero-waste initiatives
 * Suggests creative ways to repurpose food scraps and byproducts
 */

export interface ByproductSuggestion {
  name: string;
  description: string;
  byproductType: 'COMPOST' | 'STOCK' | 'WASTE' | 'REUSE';
  usageIdeas: string[];
}

export interface IngredientInfo {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
}

/**
 * Generate a hash from ingredient IDs for caching
 */
function generateIngredientsHash(ingredientIds: string[]): string {
  const sortedIds = [...ingredientIds].sort();
  return crypto.createHash('sha256').update(sortedIds.join(',')).digest('hex');
}

/**
 * Get byproduct suggestions for a list of ingredients
 * Uses cached suggestions when available, generates new ones via LLM when needed
 */
export async function getByproductSuggestions(
  ingredients: IngredientInfo[]
): Promise<ByproductSuggestion[]> {
  if (ingredients.length === 0) {
    console.log('[Byproduct AI] No ingredients provided');
    return [];
  }

  console.log(`[Byproduct AI] Getting suggestions for ${ingredients.length} ingredients`);
  console.log('[Byproduct AI] Ingredients:', ingredients.map(i => i.productName).join(', '));

  try {
    // TODO: Re-enable caching later when we have stable French prompts
    // For now, always generate fresh suggestions
    console.log('[Byproduct AI] Generating fresh suggestions via LLM (caching disabled)');
    const suggestions = await generateSuggestionsViaLLM(ingredients);

    console.log(`[Byproduct AI] Generated ${suggestions.length} suggestions`);

    return suggestions;
  } catch (error) {
    console.error('[Byproduct AI] Error getting suggestions:', error);
    if (error instanceof Error) {
      console.error('[Byproduct AI] Error details:', error.message);
      console.error('[Byproduct AI] Stack:', error.stack);
    }
    return [];
  }
}

/**
 * Generate byproduct suggestions using OpenAI
 */
async function generateSuggestionsViaLLM(
  ingredients: IngredientInfo[]
): Promise<ByproductSuggestion[]> {
  const ingredientsList = ingredients
    .map((i) => `- ${i.productName} (${i.quantity} ${i.unit})`)
    .join('\n');

  const prompt = `Tu es un expert culinaire spécialisé dans le zéro déchet et la durabilité en restauration. Voici une liste d'ingrédients utilisés dans une production alimentaire. Identifie les sous-produits et chutes qui seront générés pendant la préparation.

Ingrédients utilisés :
${ingredientsList}

Pour chaque ingrédient, identifie les sous-produits concrets qui seront générés :
- Épluchures, peaux et parures
- Os, coquilles ou carcasses
- Tiges, feuilles et fanes
- Graines et trognons
- Toute autre partie comestible ou compostable

Génère 3 à 5 sous-produits concrets qui seront générés pendant cette préparation. Pour chaque sous-produit, fournis :
1. name : Le nom du sous-produit lui-même (ex: "Peaux de pommes de terre", "Os de bœuf", "Fanes de carottes")
   IMPORTANT: Nomme le sous-produit brut, PAS la préparation finale (pas "Bouillon d'os" mais "Os de bœuf")
2. description : D'où vient ce sous-produit et pourquoi il est généré (1 phrase courte)
3. byproductType : Parmi : COMPOST, STOCK, REUSE, ou WASTE
   - COMPOST : Chutes végétales pour le compost
   - STOCK : Os, coquilles, parures végétales pour faire un fond/bouillon
   - REUSE : Réutilisation culinaire créative (pesto, chips, poudre, etc.)
   - WASTE : Déchet non valorisable (à utiliser avec parcimonie)
4. usageIdeas : Tableau de 2-3 idées concrètes pour valoriser CE sous-produit

Retourne ta réponse sous forme d'objet JSON valide avec un tableau "suggestions". Format exemple :
{
  "suggestions": [
    {
      "name": "Fanes de carottes",
      "description": "Feuillage vert des carottes, retiré lors de la préparation.",
      "byproductType": "REUSE",
      "usageIdeas": [
        "Faire un pesto avec ail, noix et huile d'olive",
        "Ajouter dans les soupes et bouillons",
        "Sécher pour faire une poudre aromatique"
      ]
    },
    {
      "name": "Os de bœuf",
      "description": "Os retirés après désossage de la viande.",
      "byproductType": "STOCK",
      "usageIdeas": [
        "Faire un fond de veau brun",
        "Préparer un bouillon pour risotto",
        "Conserver pour un pot-au-feu"
      ]
    }
  ]
}

Important :
- Nomme les SOUS-PRODUITS BRUTS (épluchures, os, fanes), pas les recettes
- Concentre-toi uniquement sur les sous-produits réellement générés par ces ingrédients
- Privilégie REUSE et STOCK plutôt que COMPOST quand c'est possible
- Les usageIdeas expliquent comment valoriser le sous-produit
- Retourne UNIQUEMENT du JSON valide avec la structure ci-dessus, sans formatage markdown
- TOUTES les suggestions doivent être EN FRANÇAIS`;

  try {
    console.log('[Byproduct AI] Calling OpenAI API...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Tu es un expert culinaire spécialisé dans le zéro déchet. Retourne uniquement du JSON valide sans texte additionnel ni formatage markdown. Toutes tes suggestions doivent être en français.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7, // Slightly higher for creative suggestions
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    });

    const responseContent = completion.choices[0]?.message?.content?.trim();

    if (!responseContent) {
      console.log('[Byproduct AI] No response from LLM');
      return [];
    }

    console.log('[Byproduct AI] Received response from OpenAI');
    console.log('[Byproduct AI] Response length:', responseContent.length);

    // Parse the JSON response
    const parsed = JSON.parse(responseContent);

    // The response might be wrapped in an object with a "suggestions" key
    const suggestions = Array.isArray(parsed) ? parsed : (parsed.suggestions || []);

    console.log(`[Byproduct AI] Parsed ${suggestions.length} suggestions from response`);

    // Validate the structure
    const validSuggestions = suggestions.filter(
      (s: any) =>
        s.name &&
        s.description &&
        s.byproductType &&
        Array.isArray(s.usageIdeas) &&
        ['COMPOST', 'STOCK', 'REUSE', 'WASTE'].includes(s.byproductType)
    );

    console.log(`[Byproduct AI] ${validSuggestions.length} valid suggestions after validation`);
    if (validSuggestions.length !== suggestions.length) {
      console.warn(`[Byproduct AI] Filtered out ${suggestions.length - validSuggestions.length} invalid suggestions`);
    }

    return validSuggestions;
  } catch (error) {
    console.error('[Byproduct AI] Error calling OpenAI or parsing response:', error);
    if (error instanceof Error) {
      console.error('[Byproduct AI] Error message:', error.message);
      console.error('[Byproduct AI] Error stack:', error.stack);
    }
    return [];
  }
}

/**
 * Clear old cached suggestions (e.g., not used in 90 days)
 * Can be called periodically to clean up the cache
 */
export async function clearOldSuggestions(daysOld = 90): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await db.byproductSuggestion.deleteMany({
    where: {
      lastUsedAt: {
        lt: cutoffDate,
      },
    },
  });

  console.log(`[Byproduct AI] Cleared ${result.count} old suggestions`);
  return result.count;
}
