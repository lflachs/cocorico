import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ocrService } from '@/lib/services/ocr.service';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST /api/dishes/scan
 * Scan a recipe/dish using Azure OCR + GPT-4 parsing
 *
 * Step 1: Azure extracts text accurately from recipe/photo
 * Step 2: GPT-4 parses text into structured dish data
 */

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Step 1: Extract text using Azure Document Intelligence
    let extractedText: string;
    try {
      const textResult = await ocrService.processMenu(buffer); // Reuse menu OCR service
      extractedText = textResult.content;

      // If content is empty, try paragraphs
      if (!extractedText || extractedText.trim().length === 0) {
        extractedText = textResult.paragraphs.join('\n\n');
      }

      if (!extractedText || extractedText.trim().length === 0) {
        return NextResponse.json(
          { error: 'Aucun texte n\'a pu être extrait du document' },
          { status: 400 }
        );
      }
    } catch (ocrError) {
      console.error('OCR processing error:', ocrError);
      return NextResponse.json(
        {
          error: 'Échec de l\'extraction du texte',
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
          content: `You are an expert at parsing recipes and dish information into structured JSON format.

Extract the following information from recipe text:
- Dish name
- Description (if available)
- Selling price (if mentioned)
- List of ingredients with quantities and units

Return ONLY a valid JSON object with this structure:
{
  "name": "Name of the dish",
  "description": "Brief description if available",
  "sellingPrice": number or null,
  "ingredients": [
    {
      "productName": "Ingredient name",
      "quantity": "numeric quantity as string",
      "unit": "unit of measurement (KG, G, L, ML, CL, PC, etc.)"
    }
  ],
  "confidence": 0.0 to 1.0
}

IMPORTANT RULES:
1. Extract the dish name from the title or heading
2. For ingredients, extract SPECIFIC quantities and units
3. Normalize units to standard format: KG, G, L, ML, CL, PC (pieces), BUNCH, CLOVE
4. If quantity is unclear, make a reasonable estimate based on typical recipes
5. If unit is missing but quantity exists, default to an appropriate unit for that ingredient
6. For "a pinch", "to taste", etc., estimate a small quantity (e.g., 0.005 KG for salt)
7. Confidence should reflect how clear the recipe information is

EXAMPLE INPUT:
"Poulet Rôti aux Herbes
Un délicieux poulet rôti avec des herbes fraîches
Prix: 18€

Ingrédients:
- 1 poulet entier (1.5 kg)
- 2 cuillères à soupe d'huile d'olive
- 3 gousses d'ail
- Sel et poivre au goût"

EXAMPLE OUTPUT:
{
  "name": "Poulet Rôti aux Herbes",
  "description": "Un délicieux poulet rôti avec des herbes fraîches",
  "sellingPrice": 18,
  "ingredients": [
    {"productName": "Poulet entier", "quantity": "1.5", "unit": "KG"},
    {"productName": "Huile d'olive", "quantity": "0.03", "unit": "L"},
    {"productName": "Ail", "quantity": "3", "unit": "CLOVE"},
    {"productName": "Sel", "quantity": "0.005", "unit": "KG"},
    {"productName": "Poivre", "quantity": "0.005", "unit": "KG"}
  ],
  "confidence": 0.95
}`,
        },
        {
          role: 'user',
          content: `Parse this recipe and extract the dish information:\n\n${extractedText}`,
        },
      ],
      max_tokens: 2000,
      temperature: 0.1,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse JSON response
    const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    let parsedData;
    try {
      parsedData = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', cleanedContent);
      throw new Error('Failed to parse AI response');
    }

    // Validate the response structure
    if (!parsedData.name) {
      throw new Error('Invalid response: missing dish name');
    }

    if (!parsedData.ingredients || !Array.isArray(parsedData.ingredients)) {
      parsedData.ingredients = [];
    }

    return NextResponse.json({
      success: true,
      data: parsedData,
      extractedText: extractedText,
    });

  } catch (error) {
    console.error('Dish scan error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Échec du scan de la recette',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
