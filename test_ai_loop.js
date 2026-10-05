require('dotenv').config({ path: '.env.local' });
const { generateText, tool: aiTool, jsonSchema } = require('ai');
const { createGoogleGenerativeAI } = require('@ai-sdk/google');

const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
const model = google('gemini-3.8-flash');

async function testAI() {
  console.log("Starting test...");
  
  const aiTools = {
    search_products: aiTool({
      description: 'Search for products in the catalog by name or description.',
      parameters: jsonSchema({
        type: 'object',
        properties: {
          query: { type: 'string', description: 'The search query' }
        },
        required: ['query']
      }),
      execute: async (args) => {
        console.log("Executing search_products:", args);
        return {
          products: [{
            id: "f81005b2-6216-420d-bf02-c516f603c963",
            name: "casque gaming",
            price: 200,
            currency: "USD",
            description: "casque pro for gaming",
            retailer_id: "jt4zd4o4mc",
            availability: "in stock"
          }]
        };
      }
    }),
    send_interactive_product: aiTool({
      description: 'Sends an interactive product message to the user',
      parameters: jsonSchema({
        type: 'object',
        properties: {
          product_retailer_id: { type: 'string' }
        },
        required: ['product_retailer_id']
      }),
      execute: async (args) => {
        console.log("Executing send_interactive_product:", args);
        return { success: true, message: "Sent product" };
      }
    })
  };

  try {
    const { text, steps } = await generateText({
      model: model,
      messages: [{ role: 'user', content: 'Je veux voir le casque' }],
      system: `Tu es le vendeur de la boutique.
1. Si le client demande TOUS les produits ou le catalogue global, utilise 'send_interactive_catalog'.
2. Si le client demande un produit ou une catégorie précise (ex: "casque", "souris"), utilise TOUJOURS 'search_products' avec le paramètre 'query' pour chercher ce terme spécifique.
3. Après la recherche :
   - Si tu as trouvé PLUSIEURS produits (ex: plusieurs casques), utilise 'send_interactive_product_list' avec les retailer_ids trouvés pour lui envoyer le carousel.
   - Si tu as trouvé UN SEUL produit, utilise 'send_interactive_product' avec son retailer_id exact.
   - Si tu ne trouves rien, dis-le lui gentiment.
Ne réponds jamais avec une simple liste texte, utilise toujours ces outils interactifs. NE T'ARRETE PAS après la recherche, enchaîne directement avec l'envoi du produit/carousel.`,
      tools: aiTools,
      maxSteps: 8
    });
    
    console.log("Final text:", text);
    console.log("Steps:", JSON.stringify(steps, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}

testAI();
