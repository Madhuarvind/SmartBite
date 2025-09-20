// src/ai/flows/predictive-suggestions.ts
'use server';
/**
 * @fileOverview An AI agent for predicting what a user might want to cook next.
 *
 * - predictiveSuggestions - A function that handles the predictive suggestion process.
 */

import { ai } from '@/ai/genkit';
import {
  PredictiveSuggestionsInput,
  PredictiveSuggestionsInputSchema,
  PredictiveSuggestionsOutput,
  PredictiveSuggestionsOutputSchema,
  Recipe,
} from '../schemas';
import { generateImage } from './generate-image';


export async function predictiveSuggestions(
  input: PredictiveSuggestionsInput
): Promise<PredictiveSuggestionsOutput> {
  return predictiveSuggestionsFlow(input);
}

const predictiveSuggestionsPrompt = ai.definePrompt({
  name: 'predictiveSuggestionsPrompt',
  input: { schema: PredictiveSuggestionsInputSchema },
  output: { schema: PredictiveSuggestionsOutputSchema },
  prompt: `You are a highly intuitive predictive cooking assistant. Your task is to analyze a user's profile, which includes their available ingredients, their past purchase history, and their recent cooking activity, to predict what they might want to cook next.

Generate exactly 4 distinct and creative recipes that reflect a thoughtful prediction based on the user's habits and available items. For example, if they recently bought ingredients for a specific cuisine, you might suggest a recipe from that cuisine. If they often cook quick meals, prioritize simpler recipes.

For each recipe, you MUST provide:
1.  A unique, appealing name.
2.  A full list of ingredients with specific quantities, primarily using the user's available ingredients.
3.  A detailed nutritional analysis per serving (calories, protein, carbs, fat).
4.  Detailed, step-by-step instructions. For each step, provide a 'step' number and the 'text' for the instruction. Do not include images, audio, or video yet.
5.  A brief, one-sentence rationale for why you are suggesting this specific recipe to the user (e.g., "Since you recently bought avocados, this quick guacamole recipe might be perfect," or "Based on your love for Italian food, here's a classic carbonara.").

User's Available Ingredients:
{{#each availableIngredients}}
- {{this}}
{{/each}}

User's Purchase History:
{{#each purchaseHistory}}
- {{this.name}} (Purchased on {{this.purchaseDate}})
{{/each}}

User's Recent Cooking Activity:
{{#each cookingHistory}}
- Cooked "{{this.recipeName}}" on {{this.date}}
{{/each}}

Respond in the specified JSON format.
`,
});

const predictiveSuggestionsFlow = ai.defineFlow(
  {
    name: 'predictiveSuggestionsFlow',
    inputSchema: PredictiveSuggestionsInputSchema,
    outputSchema: PredictiveSuggestionsOutputSchema,
  },
  async (input) => {

    const { output } = await predictiveSuggestionsPrompt(input);
    if (!output || !output.recipes) {
      return { recipes: [] };
    }

    // After generating the recipe text, generate a cover image for each one in parallel.
    const enhancedRecipes = await Promise.all(
      output.recipes.map(async (recipe: Recipe) => {
        try {
          const coverImage = await generateImage({
            prompt: `A beautiful, appetizing, professional food photography shot of a finished plate of "${recipe.name}".`,
          });
          return { ...recipe, coverImage };
        } catch (e) {
          console.error(`Cover image generation failed for ${recipe.name}:`, e);
          return recipe; // Return recipe without cover image on failure
        }
      })
    );

    return { recipes: enhancedRecipes };
  }
);
