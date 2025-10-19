import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ocrService } from '@/lib/services/ocr.service';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST /api/menu/scan
 * Scan a menu using Azure OCR + GPT-4 parsing
 *
 * Step 1: Azure extracts text accurately
 * Step 2: GPT-4 parses text into structured menu data
 */

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const suggestIngredients = formData.get('suggestIngredients') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Step 1: Extract text using Azure Document Intelligence
    let extractedText: string;
    try {
      const menuTextResult = await ocrService.processMenu(buffer);
      extractedText = menuTextResult.content;

      // If content is empty, try paragraphs
      if (!extractedText || extractedText.trim().length === 0) {
        extractedText = menuTextResult.paragraphs.join('\n\n');
      }

      if (!extractedText || extractedText.trim().length === 0) {
        return NextResponse.json(
          { error: 'No text could be extracted from the document' },
          { status: 400 }
        );
      }
    } catch (ocrError) {
      console.error('OCR processing error:', ocrError);
      return NextResponse.json(
        {
          error: 'Failed to extract text from document',
          details: ocrError instanceof Error ? ocrError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }

    // Step 2: Parse extracted text using GPT-4
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert at parsing restaurant menu documents into structured JSON format.

IMPORTANT: The document may contain MULTIPLE MENUS and/or À LA CARTE dishes.
- Extract complete menus (with fixed pricing and multiple courses)
- ALSO extract à la carte dishes separately
- If there are multiple menus, extract ALL of them

For each menu, extract:
- Menu name
- Menu description (if any)
- Pricing type: "PRIX_FIXE" (fixed price for entire menu) or "CHOICE" (choose X courses from Y options)
- Fixed price (if applicable)
- Number of courses for CHOICE menus (min and max)
- Sections with SPECIFIC DISH NAMES (not generic terms like "Entrée" or "Plat")

Return ONLY a valid JSON object with this structure:
{
  "menus": [
    {
      "menuName": "Name of the menu",
      "menuDescription": "Description if available",
      "pricingType": "PRIX_FIXE" | "CHOICE",
      "fixedPrice": number or null,
      "minCourses": number or null,
      "maxCourses": number or null,
      "sections": [
        {
          "name": "Section name (e.g., Entrées, Appetizers)",
          "dishes": [
            {
              "name": "SPECIFIC dish name (e.g., 'Caesar Salad', 'Beef Bourguignon')",
              "description": "Dish description if available",
              "price": number or null
            }
          ]
        }
      ]
    }
  ],
  "alacarte": [
    {
      "name": "SPECIFIC dish name",
      "description": "Description if available",
      "price": number,
      "category": "Category if available (e.g., Entrées, Plats, Desserts)"
    }
  ],
  "confidence": 0.0 to 1.0
}

CRITICAL RULES:
1. For MENUS: Extract complete menus with fixed pricing (e.g., "Menu du Jour - 25€", "Menu Déjeuner - 31€/26€")
2. For MENUS: ONLY include SPECIFIC dish names in sections (e.g., "Salade César", "Boeuf Bourguignon")
3. IGNORE generic structure descriptions like "Entrée, Plat, Dessert" - these are NOT dishes, they describe menu structure
4. For À LA CARTE: Extract individual dishes with their own prices that are NOT part of a menu
5. If there are multiple menus, extract ALL of them as separate objects
6. If pricingType is "PRIX_FIXE": customer gets all courses for one price
7. If pricingType is "CHOICE": customer chooses X courses from Y options
8. When you see text like "Entrée, Plat, Dessert - 31€", this is describing the MENU STRUCTURE, not actual dishes
9. Only include dishes with specific names (not generic categories)

EXAMPLE OF WHAT TO IGNORE:
Bad: {"name": "Entrée, Plat, Dessert", ...} // This is menu structure, NOT a dish
Good: {"name": "Salade de chèvre chaud", ...} // This is a specific dish

EXAMPLE MENU TEXT:
"Menu du jour - 31€ (entrée, plat, dessert)" means:
- menuName: "Menu du jour"
- fixedPrice: 31
- pricingType: "PRIX_FIXE"
- DO NOT create dishes called "Entrée", "Plat", "Dessert" - wait for actual dish names`,
        },
        {
          role: 'user',
          content: `Parse this menu document and extract ALL complete menus AND à la carte dishes:\n\n${extractedText}`,
        },
      ],
      max_tokens: 4000,
      temperature: 0.1,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Strip markdown code blocks if present
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/^```(?:json)?\n?/, '');
      jsonContent = jsonContent.replace(/\n?```$/, '');
    }

    // Parse the JSON response
    const parsedData = JSON.parse(jsonContent);

    // Ensure menus is an array (can be empty)
    if (!parsedData.menus) {
      parsedData.menus = [];
    }

    // Ensure alacarte is an array (can be empty)
    if (!parsedData.alacarte) {
      parsedData.alacarte = [];
    }

    // Check if we found anything
    if (parsedData.menus.length === 0 && parsedData.alacarte.length === 0) {
      return NextResponse.json(
        { error: 'No menus or dishes found in the document.' },
        { status: 400 }
      );
    }

    // Step 3: Suggest ingredients if enabled
    if (suggestIngredients && parsedData.menus.length > 0) {
      try {
        // Get all existing products from inventory
        const { getProductsAction } = await import('@/lib/actions/product.actions');
        const productsResult = await getProductsAction();
        const existingProducts = productsResult.success && productsResult.data ? productsResult.data : [];

        // Create a simplified list of product names for AI matching
        const productNames = existingProducts.map((p: any) => p.name).join(', ');

        // Process each menu and suggest ingredients for dishes
        for (const menu of parsedData.menus) {
          for (const section of menu.sections) {
            for (const dish of section.dishes) {
              try {
                // Ask GPT-4 to suggest ingredients for this dish
                const suggestionResponse = await openai.chat.completions.create({
                  model: 'gpt-4o',
                  messages: [
                    {
                      role: 'system',
                      content: `You are a chef assistant. Given a dish name and optional description, suggest the main ingredients needed to prepare it.

IMPORTANT RULES:
- Suggest only MAIN ingredients (3-8 ingredients)
- Provide realistic quantities for 1 serving
- Use standard units: KG, L, or PC
- If an ingredient matches one from the inventory list, use the EXACT name
- Return ONLY valid JSON, no markdown

Available products in inventory: ${productNames || 'None'}

Return JSON in this format:
{
  "ingredients": [
    {
      "name": "Product name",
      "quantity": 0.15,
      "unit": "KG",
      "confidence": 0.9,
      "matchedProduct": true/false
    }
  ]
}`,
                    },
                    {
                      role: 'user',
                      content: `Suggest ingredients for: ${dish.name}${dish.description ? `\nDescription: ${dish.description}` : ''}`,
                    },
                  ],
                  max_tokens: 500,
                  temperature: 0.3,
                });

                const suggestionContent = suggestionResponse.choices[0].message.content;
                if (suggestionContent) {
                  let jsonContent = suggestionContent.trim();
                  if (jsonContent.startsWith('```')) {
                    jsonContent = jsonContent.replace(/^```(?:json)?\n?/, '');
                    jsonContent = jsonContent.replace(/\n?```$/, '');
                  }

                  const suggestions = JSON.parse(jsonContent);

                  // Match suggested ingredients with existing products
                  const recipeIngredients = suggestions.ingredients.map((ing: any) => {
                    const matchedProduct = existingProducts.find(
                      (p: any) => p.name.toLowerCase() === ing.name.toLowerCase()
                    );

                    return {
                      productId: matchedProduct?.id || '',
                      productName: matchedProduct?.name || ing.name,
                      quantityRequired: ing.quantity,
                      unit: matchedProduct?.unit || ing.unit,
                      suggested: true, // Mark as AI-suggested
                      confidence: ing.confidence || 0.5,
                      exists: !!matchedProduct,
                    };
                  });

                  dish.recipeIngredients = recipeIngredients;
                }
              } catch (dishError) {
                console.error(`Error suggesting ingredients for dish ${dish.name}:`, dishError);
                // Continue with next dish if one fails
              }
            }
          }
        }
      } catch (ingredientError) {
        console.error('Error suggesting ingredients:', ingredientError);
        // Continue without suggestions if this fails
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        menus: parsedData.menus,
        alacarte: parsedData.alacarte,
        confidence: parsedData.confidence,
        extractedText, // Include raw text for debugging
      },
    });
  } catch (error) {
    console.error('Error scanning menu:', error);
    return NextResponse.json(
      {
        error: 'Failed to scan menu',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
