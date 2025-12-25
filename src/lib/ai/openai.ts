import OpenAI from 'openai';

const openAIApiKey = process.env.OPENAI_API_KEY;

if (!openAIApiKey) {
  throw new Error('The OPENAI_API_KEY environment variable is missing or empty.');
}

export const openai = new OpenAI({
  apiKey: openAIApiKey,
});
