// src/ai/flows/recommend-recipes.ts
'use server';
/**
 * @fileOverview A recipe recommendation AI agent.
 *
 * - recommendRecipes - A function that handles the recipe recommendation process.
 */

import {ai} from '@/ai/genkit';
import { RecommendRecipesInput, RecommendRecipesInputSchema, RecommendRecipesOutput, RecommendRecipesOutputSchema, Recipe } from '../schemas';
import { generateImage } from './generate-image';


export async function recommendRecipes(input: RecommendRecipesInput): Promise<RecommendRecipesOutput> {
  return recommendRecipesFlow(input);
}

const recommendRecipesPrompt = ai.definePrompt({
  name: 'recommendRecipesPrompt',
  input: {schema: RecommendRecipesInputSchema},
  output: {schema: RecommendRecipesOutputSchema},
  prompt: `You are a creative and expert recipe recommendation engine. You will be provided with a list of ingredients the user has available, their dietary restrictions, and a list of ingredients that are about to expire.

Your task is to generate exactly 4 distinct and creative recipes. Prioritize using the expiring ingredients first. 

For each recipe, you MUST provide:
1.  A unique, appealing name.
2.  A full list of ingredients, with a name and a specific quantity for each (e.g., "200g", "1 cup", "2 cloves").
3.  A detailed nutritional analysis per serving, including calories, protein, carbs, and fat, based on the specific ingredients and quantities you've listed.
4.  Detailed, step-by-step instructions. For each step, provide a 'step' number and the 'text' for the instruction. Do not include images yet.

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

    const {output} = await recommendRecipesPrompt(input);
    if (!output || !output.recipes) {
      return { recipes: [] };
    }

    // After generating the recipe text, generate a cover image for each one in parallel.
    const enhancedRecipes = await Promise.all(
      output.recipes.map(async (recipe: Recipe) => {
        let coverImage;
        try {
          coverImage = await generateImage({
            prompt: `A beautiful, appetizing, professional food photography shot of a finished plate of "${recipe.name}".`,
          });
        } catch (e) {
          console.error(`Primary image generation failed for ${recipe.name}, trying fallback:`, e);
          try {
            coverImage = await generateImage({
              prompt: `A simple, appetizing photo of "${recipe.name}".`,
            });
          } catch (fallbackError) {
             console.error(`Fallback image generation also failed for ${recipe.name}:`, fallbackError);
            // Ensure a recipe object is always returned, even on image failure
            coverImage = undefined;
          }
        }
        return { ...recipe, coverImage };
      })
    );

    return { recipes: enhancedRecipes };
  }
);
