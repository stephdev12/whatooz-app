require('dotenv').config({ path: '.env.local' });
const { generateText, tool: aiTool, jsonSchema } = require('ai');
const { createOpenAI } = require('@ai-sdk/openai');
const { createAnthropic } = require('@ai-sdk/anthropic');
const { createGoogleGenerativeAI } = require('@ai-sdk/google');

async function main() {
  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  const aiTools = {
    search_products: aiTool({
      description: 'Search the catalog for products',
      parameters: jsonSchema({
        type: 'object',
        properties: { query: { type: 'string' } },
        required: ['query']
      }),
      execute: async (args) => {
        console.log('Executing search_products', args);
        return { products: [{ id: 1, name: 'souris beast gaming', price: 100 }] };
      }
    })
  };

  try {
    const { text, steps } = await generateText({
      model: openai('gpt-4o-mini'),
      messages: [{ role: 'user', content: 'Puis je voir vos produits disponibles ?' }],
      tools: aiTools,
      maxSteps: 5
    });

    console.log('Final text:', text);
    console.log('Steps count:', steps.length);
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
