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
    // Generate hash from ingredient IDs
    const ingredientIds = ingredients.map((i) => i.productId);
    const hash = generateIngredientsHash(ingredientIds);
    console.log('[Byproduct AI] Ingredients hash:', hash);

    // Check for cached suggestions
    const cachedSuggestion = await db.byproductSuggestion.findUnique({
      where: { ingredientsHash: hash },
    });

    if (cachedSuggestion) {
      console.log('[Byproduct AI] Found cached suggestions');

      // Update usage stats
      await db.byproductSuggestion.update({
        where: { id: cachedSuggestion.id },
        data: {
          usageCount: cachedSuggestion.usageCount + 1,
          lastUsedAt: new Date(),
        },
      });

      console.log(`[Byproduct AI] Cache hit! Used ${cachedSuggestion.usageCount + 1} times`);
      return cachedSuggestion.suggestions as ByproductSuggestion[];
    }

    // No cache hit - generate new suggestions via LLM
    console.log('[Byproduct AI] No cached suggestions found, generating via LLM');
    const suggestions = await generateSuggestionsViaLLM(ingredients);

    console.log(`[Byproduct AI] Generated ${suggestions.length} suggestions`);

    // Cache the suggestions
    if (suggestions.length > 0) {
      await db.byproductSuggestion.create({
        data: {
          ingredientsHash: hash,
          ingredientsList: ingredientIds,
          suggestions: suggestions as any, // Prisma Json type
          generatedAt: new Date(),
          lastUsedAt: new Date(),
          usageCount: 1,
        },
      });
      console.log('[Byproduct AI] Cached suggestions for future use');
    }

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

  const prompt = `Tu es un expert culinaire spécialisé dans le zéro déchet et la durabilité en restauration. Voici une liste d'ingrédients utilisés dans une production alimentaire. Identifie UNIQUEMENT les sous-produits qui peuvent être RÉUTILISÉS dans d'autres recettes.

Ingrédients utilisés :
${ingredientsList}

CRITÈRES IMPORTANTS :
- Ne suggère QUE les sous-produits qui peuvent être utilisés dans d'autres recettes de manière HYGIÉNIQUE
- N'inclus JAMAIS des ingrédients de base utilisés (farine, beurre, huile, etc.) - ce n'est pas hygiénique
- Focus uniquement sur les CHUTES et SOUS-PRODUITS générés lors de la préparation

Pour chaque ingrédient, identifie les sous-produits réutilisables ET hygiéniques :
- Os, coquilles ou carcasses → pour fonds, bouillons, fumets
- Parures de viande/poisson → pour farces, terrines, rillettes
- Fanes, tiges et feuilles comestibles → pour pestos, soupes, garnitures
- Peaux et épluchures comestibles → pour chips, poudres, infusions
- Chutes nobles → pour sauces, garnitures, accompagnements

❌ NE JAMAIS suggérer : farine, beurre, huile, sel, sucre, épices, ou tout autre ingrédient de base - ce n'est pas hygiénique de les réutiliser

Génère 3 à 5 sous-produits réutilisables qui seront générés pendant cette préparation. Pour chaque sous-produit, fournis :
1. name : Le nom du sous-produit lui-même (ex: "Os de volaille", "Parures de saumon", "Fanes de carottes")
   IMPORTANT: Nomme le sous-produit brut, PAS la préparation finale (pas "Bouillon d'os" mais "Os de volaille")
2. description : D'où vient ce sous-produit et comment il peut être réutilisé en cuisine (1 phrase courte)
3. byproductType : UNIQUEMENT STOCK ou REUSE
   - STOCK : Os, coquilles, parures pour faire un fond/bouillon/fumet
   - REUSE : Réutilisation culinaire directe (pesto, chips, sauce, farce, etc.)
4. usageIdeas : Tableau de 2-3 recettes ou préparations concrètes utilisant CE sous-produit

Retourne ta réponse sous forme d'objet JSON valide avec un tableau "suggestions". Format exemple :
{
  "suggestions": [
    {
      "name": "Fanes de carottes",
      "description": "Feuillage vert des carottes, parfait pour des préparations aromatiques.",
      "byproductType": "REUSE",
      "usageIdeas": [
        "Faire un pesto avec ail, noix et huile d'olive",
        "Incorporer dans un potage de légumes",
        "Sécher pour faire une poudre aromatique"
      ]
    },
    {
      "name": "Os de volaille",
      "description": "Os retirés après désossage, base idéale pour fonds et bouillons.",
      "byproductType": "STOCK",
      "usageIdeas": [
        "Fond blanc de volaille pour sauces",
        "Bouillon pour risotto ou pilaf",
        "Base pour soupe ou pot-au-feu"
      ]
    },
    {
      "name": "Parures de saumon",
      "description": "Chutes de saumon après découpe, excellentes pour des préparations.",
      "byproductType": "REUSE",
      "usageIdeas": [
        "Rillettes de saumon",
        "Farce pour raviolis ou wontons",
        "Tartare ou ceviche"
      ]
    }
  ]
}

Important :
- Ne suggère QUE des sous-produits RÉUTILISABLES ET HYGIÉNIQUES (types STOCK ou REUSE uniquement)
- Nomme les SOUS-PRODUITS BRUTS (os, parures, fanes), pas les recettes finales
- N'inclus JAMAIS des ingrédients de base (farine, beurre, huile, sel, sucre, épices) - ce n'est pas hygiénique
- Concentre-toi uniquement sur les CHUTES et sous-produits réellement générés lors de la préparation
- Les usageIdeas doivent être des recettes/préparations concrètes et réalistes
- Exclus tout ce qui est compost, déchet, ou non-hygiénique
- Retourne UNIQUEMENT du JSON valide avec la structure ci-dessus, sans formatage markdown
- TOUTES les suggestions doivent être EN FRANÇAIS`;

  try {
    console.log('[Byproduct AI] Calling OpenAI API...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Tu es un expert culinaire spécialisé dans le zéro déchet et la réutilisation des sous-produits en cuisine. Suggère UNIQUEMENT des sous-produits réutilisables dans d\'autres recettes (types STOCK ou REUSE). Retourne uniquement du JSON valide sans texte additionnel ni formatage markdown. Toutes tes suggestions doivent être en français.',
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
