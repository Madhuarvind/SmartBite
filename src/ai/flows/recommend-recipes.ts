// src/ai/flows/recommend-recipes.ts
'use server';
/**
 * @fileOverview A recipe recommendation AI agent.
 *
 * - recommendRecipes - A function that handles the recipe recommendation process.
 */

import {ai} from '@/ai/genkit';
import { generateRecipeAudio } from './generate-recipe-audio';
import { generateRecipeVideo } from './generate-recipe-video';
import { RecommendRecipesInput, RecommendRecipesInputSchema, RecommendRecipesOutput, RecommendRecipesOutputSchema } from '../schemas';


export async function recommendRecipes(input: RecommendRecipesInput): Promise<RecommendRecipesOutput> {
  return recommendRecipesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendRecipesPrompt',
  input: {schema: RecommendRecipesInputSchema},
  output: {schema: RecommendRecipesOutputSchema},
  prompt: `You are a recipe recommendation engine and nutritionist. You will be provided with a list of ingredients the user has available, their dietary restrictions, and a list of ingredients that are about to expire.

You will use this information to recommend recipes to the user. Prioritize recipes that use ingredients that are about to expire.

For each recipe, you MUST provide a detailed nutritional analysis per serving, including calories, protein, carbs, and fat.

Ingredients: {{{ingredients}}}
Dietary Restrictions: {{{dietaryRestrictions}}}
Expiring Ingredients: {{{expiringIngredients}}}

Respond in JSON format.
`,
});

const recommendRecipesFlow = ai.defineFlow(
  {
    name: 'recommendRecipesFlow',
    inputSchema: RecommendRecipesInputSchema,
    outputSchema: RecommendRecipesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output || !output.recipes) {
      return { recipes: [] };
    }

    const enhancedRecipes = await Promise.all(
      output.recipes.map(async (recipe) => {
        const [audio, video] = await Promise.all([
          generateRecipeAudio({ instructions: recipe.instructions }),
          generateRecipeVideo({ recipeName: recipe.name })
        ]);
        return { ...recipe, audio, video };
      })
    );

    return { recipes: enhancedRecipes };
  }
);
