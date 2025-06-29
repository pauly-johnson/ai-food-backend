require('dotenv').config();
const express = require('express');
const cors = require('cors');
const ModelClient = require('@azure-rest/ai-inference').default;
const { isUnexpected } = require('@azure-rest/ai-inference');
const { AzureKeyCredential } = require('@azure/core-auth');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS setup for frontend
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://ai-food-creator.netlify.app'
  ],
}));

app.use(express.json());

// Azure ModelClient setup
const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_OPENAI_KEY;
const model = process.env.AZURE_OPENAI_MODEL || 'openai/gpt-4.1';

// Helper: Validate request body
function validateRequest(body) {
  if (!body.ingredients || !Array.isArray(body.ingredients) || body.ingredients.length === 0) return 'Missing or invalid ingredients';
  if (typeof body.style !== 'string') return 'Missing or invalid style';
  if (typeof body.mealType !== 'string') return 'Missing or invalid mealType';
  if (typeof body.why !== 'string') return 'Missing or invalid why';
  if (body.serves !== undefined && (!Number.isInteger(body.serves) || body.serves <= 0)) return 'Missing or invalid serves';
  if (body.preferences !== undefined && !Array.isArray(body.preferences)) return 'Missing or invalid preferences';
  return null;
}

// POST /generate-recipe
app.post('/generate-recipe', async (req, res) => {
  const error = validateRequest(req.body);
  if (error) return res.status(400).json({ error });

  const { ingredients, style, mealType, why } = req.body;
  let serves = req.body.serves;
  if (!Number.isInteger(serves) || serves <= 0) serves = 2;
  let preferences = Array.isArray(req.body.preferences) ? req.body.preferences : [];

  // Compose prompt for GPT-4.1
  const prompt = `Generate a detailed cooking recipe for ${serves} servings using the following:\nIngredients: ${ingredients.join(', ')}\nCooking Style: ${style}\nMeal Type: ${mealType || 'Any'}\nUser Preference: ${why || 'None'}\nDietary Preferences or Health Goals: ${preferences.length > 0 ? preferences.join(', ') : 'None'}\n\nIn the JSON response, always include a 'serves' field (number), a 'preferences' field (array of strings), and make sure the recipe name or summary clearly states how many servings the recipe makes and reflects the preferences if possible. Respond in JSON with these fields: name (string), serves (number), preferences (array of strings), cookingTime (string), ingredients (array of strings), instructions (array of strings).`;

  try {
    const client = ModelClient(endpoint, new AzureKeyCredential(apiKey));
    const response = await client.path("/chat/completions").post({
      body: {
        messages: [
          { role: 'system', content: 'You are a helpful chef assistant.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 700,
        model: model
      }
    });
    if (isUnexpected(response)) {
      console.error('Azure ModelClient error:', response.body);
      return res.status(500).json({ error: response.body.error?.message || 'Azure ModelClient error.', details: response.body });
    }
    let recipe;
    try {
      recipe = JSON.parse(response.body.choices[0].message.content);
    } catch (e) {
      console.error('Failed to parse recipe from AI response:', response.body.choices[0].message.content);
      return res.status(500).json({ error: 'Failed to parse recipe from AI response.', raw: response.body.choices[0].message.content });
    }
    if (!recipe.name || !recipe.cookingTime || !Array.isArray(recipe.ingredients) || !Array.isArray(recipe.instructions)) {
      console.error('Incomplete recipe data from AI:', recipe);
      return res.status(500).json({ error: 'Incomplete recipe data from AI.', raw: recipe });
    }
    // Ensure serves and preferences are included in the response
    recipe.serves = serves;
    recipe.preferences = preferences;
    res.json(recipe);
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Failed to generate recipe. ' + (err.message || err.toString()), details: err });
  }
});

app.get('/', (req, res) => {
  res.send('AI Food Creator Backend is running.');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
