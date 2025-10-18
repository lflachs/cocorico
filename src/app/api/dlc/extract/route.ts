import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");
    const mimeType = file.type || "image/jpeg";

    // Get current date for context
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentDate = today.toISOString().split('T')[0];

    // Use GPT-4 Vision to extract DLC information
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert at reading product labels and extracting expiration dates (DLC - Date Limite de Consommation).

CURRENT DATE: ${currentDate}
CURRENT YEAR: ${currentYear}

IMPORTANT: There may be MULTIPLE products in the image. Extract information for ALL products visible.

For each product, extract:
- Product name (the main product description)
- Expiration date (look for dates, "DLC", "À consommer avant le", "Best before", "A Consommer jusqu'au", etc.)
- Batch number or lot number if visible
- Supplier/manufacturer name if visible
- Quantity and unit (kg, L, pieces, etc.) if visible

Return ONLY a valid JSON object with this structure:
{
  "products": [
    {
      "productName": "product name",
      "expirationDate": "YYYY-MM-DD",
      "batchNumber": "batch or lot number",
      "supplier": "supplier name",
      "quantity": number,
      "unit": "KG" | "L" | "PC"
    }
  ],
  "confidence": 0.0 to 1.0,
  "rawText": "all text found on all labels"
}

CRITICAL INSTRUCTIONS FOR DATE EXTRACTION:
1. Look for expiration/consumption dates ONLY (not production or packaging dates)
2. Common formats: "DD/MM/YY", "DD/MM/YYYY", "DD.MM.YY"
3. When you see a 2-digit year (like "27/10/25"), interpret it in the context of the current year (${currentYear})
4. Expiration dates are ALWAYS in the future or very recent (within a few days)
5. If you see "25" as a year, it means 20**25**, not 2023
6. If you see "26" as a year, it means 20**26**, not 2023
7. Double-check: if your extracted date is more than 1 month in the PAST, you've made an error
8. Convert all dates to ISO format: YYYY-MM-DD

If you cannot find a field, use null.
If there are multiple products with different dates, create separate entries in the products array.`,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
            {
              type: "text",
              text: "Extract the product information and expiration date from this label.",
            },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.1,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    // Strip markdown code blocks if present (```json ... ```)
    let jsonContent = content.trim();
    if (jsonContent.startsWith("```")) {
      // Remove opening ```json or ```
      jsonContent = jsonContent.replace(/^```(?:json)?\n?/, "");
      // Remove closing ```
      jsonContent = jsonContent.replace(/\n?```$/, "");
    }

    // Parse the JSON response
    const extracted = JSON.parse(jsonContent);

    return NextResponse.json({
      success: true,
      data: extracted,
    });
  } catch (error) {
    console.error("Error extracting DLC:", error);
    return NextResponse.json(
      {
        error: "Failed to extract DLC information",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
