import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!openaiClient) {
    const openAIApiKey = process.env.OPENAI_API_KEY;

    if (!openAIApiKey) {
      throw new Error('The OPENAI_API_KEY environment variable is missing or empty.');
    }

    openaiClient = new OpenAI({
      apiKey: openAIApiKey,
    });
  }
  return openaiClient;
}

// For backward compatibility - lazy getter
export const openai = new Proxy({} as OpenAI, {
  get(_, prop) {
    return getOpenAI()[prop as keyof OpenAI];
  },
});
