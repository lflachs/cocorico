import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import crypto from 'crypto';
import {
  getAssistantInitialContext,
  getProductDetails,
  getDishDetails,
  getSalesData,
  getExpiringProductsDetails,
} from '@/lib/actions/cocorico-assistant.actions';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Cache for initial greetings
// Key: hash of briefSummary + language
// Value: { message: string, timestamp: number }
const greetingCache = new Map<string, { message: string; timestamp: number }>();
const GREETING_CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours (half a day)

/**
 * Conversational Voice Assistant API
 * Enables natural dialogue with Cocorico about daily operations
 * Uses function calling to fetch data on-demand
 */
export async function POST(request: NextRequest) {
  try {
    const { messages, language = 'fr', initialContext } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Check if this is an initial greeting request (can be cached)
    // Initial greeting is when there's only 1 message and it contains the brief summary
    const isInitialGreeting = messages.length === 1 &&
      messages[0].content &&
      (messages[0].content.includes('briefing du jour') || messages[0].content.includes('daily briefing'));

    if (isInitialGreeting && initialContext?.briefSummary) {
      // Create cache key from briefSummary + language
      const cacheKey = crypto
        .createHash('md5')
        .update(`${initialContext.briefSummary}-${language}`)
        .digest('hex');

      // Check cache
      const cached = greetingCache.get(cacheKey);
      const now = Date.now();

      if (cached && (now - cached.timestamp) < GREETING_CACHE_DURATION) {
        console.log('[Conversation] Using cached initial greeting');
        return NextResponse.json({
          message: cached.message,
          usage: { cached: true },
        });
      }

      // Clean up expired cache entries occasionally
      if (Math.random() < 0.05) {
        for (const [key, value] of greetingCache.entries()) {
          if (now - value.timestamp >= GREETING_CACHE_DURATION) {
            greetingCache.delete(key);
          }
        }
      }
    }

    // Define available functions for OpenAI to call
    const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
      {
        type: 'function',
        function: {
          name: 'get_product_details',
          description:
            'Get detailed information about products in inventory. Can search for a specific product by name or ID, or get all trackable products.',
          parameters: {
            type: 'object',
            properties: {
              productNameOrId: {
                type: 'string',
                description:
                  'Optional. The name or ID of the product to search for. If not provided, returns all trackable products.',
              },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_dish_details',
          description:
            'Get information about menu dishes and recipes. Can search for a specific dish or get all active dishes. Shows ingredients needed and whether the dish can be made.',
          parameters: {
            type: 'object',
            properties: {
              dishNameOrId: {
                type: 'string',
                description:
                  'Optional. The name or ID of the dish to search for. If not provided, returns all active dishes.',
              },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_sales_data',
          description:
            'Get sales performance data for a specific period. Shows revenue, quantity sold, and top-selling dishes.',
          parameters: {
            type: 'object',
            properties: {
              period: {
                type: 'string',
                enum: ['today', 'week', 'month'],
                description: 'The time period to analyze sales for',
              },
            },
            required: ['period'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_expiring_products',
          description:
            'Get products that are expiring soon with their DLC dates. Shows which dishes use these products to help prevent waste.',
          parameters: {
            type: 'object',
            properties: {
              daysLimit: {
                type: 'number',
                description:
                  'Number of days to look ahead for expiring products. Default is 7.',
              },
            },
          },
        },
      },
    ];

    // Build system prompt based on language
    const systemPrompt =
      language === 'fr'
        ? `Vous êtes Cocorico, le sous-chef virtuel intelligent. Vous faites partie de l'équipe et assistez le chef avec professionnalisme et expertise culinaire.

**Votre rôle** :
- Analyser les données d'inventaire, de menu et de ventes
- Fournir des recommandations stratégiques et opérationnelles
- Aider à prévenir le gaspillage et optimiser les stocks
- Respecter la hiérarchie de cuisine (utilisez "vous" pour le chef, jamais "tu")
- Être précis, professionnel mais chaleureux

**IMPORTANT - Esprit d'équipe** :
Vous faites PARTIE de l'équipe, pas un consultant externe !
- Dites "nos clients", jamais "vos clients"
- Dites "notre restaurant", jamais "votre restaurant"
- Dites "notre menu", "notre service", "notre équipe"
- Vous êtes dans le même bateau que le chef

**Contexte initial** : ${initialContext ? JSON.stringify(initialContext, null, 2) : 'Non fourni'}

**CRITICAL - Format vocal naturel** :
VOUS PARLEZ ORALEMENT, pas par écrit ! Votre réponse sera lue à voix haute.
- PAS de listes à puces (•, -, 1., 2.)
- PAS de formatage markdown (**gras**, _italique_)
- PAS de structure de document
- Parlez comme un sous-chef parle à son chef en cuisine - naturellement, avec fluidité
- Utilisez des connecteurs naturels : "alors", "ensuite", "puis", "aussi"
- Écrivez TOUS les nombres en lettres (ex: "mille neuf cent trente-trois euros", jamais "1933€")

**Exemple de MAUVAISE réponse (écrite)** :
"Pour demain, je recommande :
1. L'onglet de bœuf
2. La mer
3. Les gambas"

**Exemple de BONNE réponse (parlée)** :
"Alors Chef, pour demain je vous recommande de mettre en avant trois plats. D'abord l'onglet de bœuf Black Angus qui utilise le filet qui expire bientôt, puis La mer avec le saumon norvégien, et aussi les gambas black tiger qui utilisent les tomates. Ça permettra d'éviter le gaspillage tout en proposant vos best-sellers."

**Instructions** :
- Répondez en 3-5 phrases naturelles et fluides
- Parlez avec l'expertise et la confiance d'un sous-chef expérimenté
- Soyez direct, précis et orienté solutions
- Un emoji maximum par réponse (seulement si pertinent)
- Terminez par UNE suggestion de question que le chef pourrait poser`
        : `You are Cocorico, the intelligent virtual sous-chef. You are PART OF THE TEAM and assist the chef with professionalism and culinary expertise.

**Your role**:
- Analyze inventory, menu, and sales data
- Provide strategic and operational recommendations
- Help prevent waste and optimize stock
- Be precise, professional yet warm

**IMPORTANT - Team spirit**:
You are PART of the team, not an external consultant!
- Say "our clients", never "your clients"
- Say "our restaurant", never "your restaurant"
- Say "our menu", "our service", "our team"
- You're in this together with the chef

**Initial context**: ${initialContext ? JSON.stringify(initialContext, null, 2) : 'Not provided'}

**CRITICAL - Natural speech format**:
YOU ARE SPEAKING OUT LOUD, not writing! Your response will be read aloud.
- NO bullet points (•, -, 1., 2.)
- NO markdown formatting (**bold**, _italic_)
- NO document structure
- Speak as a sous-chef speaks to their chef in the kitchen - naturally, fluidly
- Use natural connectors: "so", "then", "also", "next"
- Write ALL numbers in words (e.g., "one thousand nine hundred thirty-three euros", never "1933€")

**Example of BAD response (written)**:
"For tomorrow, I recommend:
1. Beef steak
2. The sea dish
3. Tiger prawns"

**Example of GOOD response (spoken)**:
"So Chef, for tomorrow I recommend highlighting three dishes. First the Black Angus beef steak which uses the beef fillet expiring soon, then The Sea with the Norwegian salmon, and also the black tiger prawns that use the tomatoes. This will prevent waste while featuring your bestsellers."

**Instructions**:
- Respond in 3-5 natural, flowing sentences
- Speak with the expertise and confidence of an experienced sous-chef
- Be direct, precise and solution-oriented
- Maximum one emoji per response (only if relevant)
- End with ONE question suggestion the chef could ask`;

    // Prepare messages with system prompt
    const chatMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    // Call OpenAI with function calling
    let response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: chatMessages,
      tools,
      tool_choice: 'auto',
      temperature: 0.7,
      max_tokens: 500,
    });

    let assistantMessage = response.choices[0].message;

    // Handle function calls
    while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      // Add assistant's response with tool calls to messages
      chatMessages.push(assistantMessage);

      // Execute each function call
      for (const toolCall of assistantMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        let functionResult;

        switch (functionName) {
          case 'get_product_details':
            functionResult = await getProductDetails(functionArgs.productNameOrId);
            break;
          case 'get_dish_details':
            functionResult = await getDishDetails(functionArgs.dishNameOrId);
            break;
          case 'get_sales_data':
            functionResult = await getSalesData(functionArgs.period);
            break;
          case 'get_expiring_products':
            functionResult = await getExpiringProductsDetails(
              functionArgs.daysLimit || 7
            );
            break;
          default:
            functionResult = { error: 'Unknown function' };
        }

        // Add function result to messages
        chatMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(functionResult),
        });
      }

      // Get next response from OpenAI
      response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: chatMessages,
        tools,
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 500,
      });

      assistantMessage = response.choices[0].message;
    }

    // Cache the initial greeting if applicable
    if (isInitialGreeting && initialContext?.briefSummary && assistantMessage.content) {
      const cacheKey = crypto
        .createHash('md5')
        .update(`${initialContext.briefSummary}-${language}`)
        .digest('hex');

      greetingCache.set(cacheKey, {
        message: assistantMessage.content,
        timestamp: Date.now(),
      });

      console.log('[Conversation] Cached initial greeting');
    }

    // Return the final assistant message
    return NextResponse.json({
      message: assistantMessage.content,
      usage: response.usage,
    });
  } catch (error) {
    console.error('Conversation API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process conversation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
