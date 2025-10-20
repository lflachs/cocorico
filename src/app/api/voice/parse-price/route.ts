import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

/**
 * POST /api/voice/parse-price
 * Parse price from voice command using GPT-4o
 */
export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const { text, language = "en" } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: "No text provided" },
        { status: 400 }
      );
    }

    console.log("[Voice] Parsing price from:", text, "language:", language);

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Language-specific instructions
    const systemPrompt = language === "fr"
      ? `Vous êtes un assistant qui extrait les prix depuis une réponse vocale.
L'utilisateur vient de créer un nouveau produit et a été invité à donner le prix.

Analysez la réponse de l'utilisateur et extrayez le prix. Répondez UNIQUEMENT avec un JSON valide dans ce format exact:
{
  "price": nombre (le prix extrait, par exemple 5.99, 10, 15.50),
  "currency": "EUR" (devise, toujours EUR pour le moment),
  "confidence": nombre (0.0 à 1.0, votre niveau de confiance),
  "understood": boolean (true si vous avez compris un prix, false sinon)
}

Exemples de réponses utilisateur et comment les parser:
- "5 euros" → {"price": 5.0, "currency": "EUR", "confidence": 1.0, "understood": true}
- "quinze euros" → {"price": 15.0, "currency": "EUR", "confidence": 1.0, "understood": true}
- "3 euros 50" → {"price": 3.5, "currency": "EUR", "confidence": 1.0, "understood": true}
- "trois virgule cinquante" → {"price": 3.5, "currency": "EUR", "confidence": 0.9, "understood": true}
- "dix" → {"price": 10.0, "currency": "EUR", "confidence": 0.9, "understood": true}
- "je ne sais pas" → {"price": null, "currency": "EUR", "confidence": 1.0, "understood": false}
- "pas de prix" → {"price": null, "currency": "EUR", "confidence": 1.0, "understood": false}

IMPORTANT:
- Acceptez les nombres écrits en toutes lettres (un, deux, trois, etc.)
- Acceptez les formats: "X euros", "X €", juste "X", "X euros Y centimes"
- Si l'utilisateur dit qu'il ne sait pas ou refuse, mettez understood: false et price: null
- Soyez tolérant aux erreurs de reconnaissance vocale
- Si vous n'êtes pas sûr, baissez le score de confidence mais essayez quand même d'extraire un prix`
      : `You are an assistant that extracts prices from voice responses.
The user just created a new product and was prompted to provide the price.

Parse the user's response and extract the price. Respond with ONLY valid JSON in this exact format:
{
  "price": number (the extracted price, e.g., 5.99, 10, 15.50),
  "currency": "EUR" (currency, always EUR for now),
  "confidence": number (0.0 to 1.0, your confidence level),
  "understood": boolean (true if you understood a price, false otherwise)
}

Examples of user responses and how to parse them:
- "5 euros" → {"price": 5.0, "currency": "EUR", "confidence": 1.0, "understood": true}
- "fifteen euros" → {"price": 15.0, "currency": "EUR", "confidence": 1.0, "understood": true}
- "3 euros 50" → {"price": 3.5, "currency": "EUR", "confidence": 1.0, "understood": true}
- "three point fifty" → {"price": 3.5, "currency": "EUR", "confidence": 0.9, "understood": true}
- "ten" → {"price": 10.0, "currency": "EUR", "confidence": 0.9, "understood": true}
- "I don't know" → {"price": null, "currency": "EUR", "confidence": 1.0, "understood": false}
- "no price" → {"price": null, "currency": "EUR", "confidence": 1.0, "understood": false}

IMPORTANT:
- Accept numbers written in words (one, two, three, etc.)
- Accept formats: "X euros", "X €", just "X", "X euros Y cents"
- If user says they don't know or refuses, set understood: false and price: null
- Be tolerant of speech recognition errors
- If uncertain, lower confidence score but still try to extract a price`;

    // Parse price with GPT-4o
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: text,
        },
      ],
      temperature: 0.1,
      max_tokens: 100,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from GPT-4o");
    }

    // Parse JSON response
    let parsedPrice;
    try {
      parsedPrice = JSON.parse(content);
    } catch (e) {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        parsedPrice = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error("Failed to parse GPT response as JSON");
      }
    }

    console.log("[Voice] Parsed price:", JSON.stringify(parsedPrice, null, 2));

    return NextResponse.json({
      price: parsedPrice,
      success: true,
    });
  } catch (error) {
    console.error("[Voice] Parse price error:", error);
    return NextResponse.json(
      {
        error: "Failed to parse price",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
