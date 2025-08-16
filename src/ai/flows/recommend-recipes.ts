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

    // After generating the recipe text, kick off the audio and video generation in parallel.
    const enhancedRecipes = await Promise.all(
      output.recipes.map(async (recipe) => {
        try {
          const [audioResult, videoResult] = await Promise.allSettled([
            generateRecipeAudio({ instructions: recipe.instructions }),
            generateRecipeVideo({ recipeName: recipe.name })
          ]);

          const audio = audioResult.status === 'fulfilled' ? audioResult.value : undefined;
          const video = videoResult.status === 'fulfilled' ? videoResult.value : undefined;

          if (audioResult.status === 'rejected') console.error(`Audio generation failed for ${recipe.name}:`, audioResult.reason);
          if (videoResult.status === 'rejected') console.error(`Video generation failed for ${recipe.name}:`, videoResult.reason);

          return { ...recipe, audio, video };

        } catch (error) {
            console.error(`Failed to generate media for ${recipe.name}`, error);
            // Return the original recipe even if media generation fails
            return recipe;
        }
      })
    );

    return { recipes: enhancedRecipes };
  }
);
