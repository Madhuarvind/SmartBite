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
import { generateRecipeStepImage } from './generate-recipe-step-image';
import { RecommendRecipesInput, RecommendRecipesInputSchema, RecommendRecipesOutput, RecommendRecipesOutputSchema, Recipe } from '../schemas';


export async function recommendRecipes(input: RecommendRecipesInput): Promise<RecommendRecipesOutput> {
  return recommendRecipesFlow(input);
}


const recommendRecipesFlow = ai.defineFlow(
  {
    name: 'recommendRecipesFlow',
    inputSchema: RecommendRecipesInputSchema,
    outputSchema: RecommendRecipesOutputSchema,
  },
  async input => {

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

    const {output} = await recommendRecipesPrompt(input);
    if (!output || !output.recipes) {
      return { recipes: [] };
    }

    // After generating the recipe text, kick off all media generation in parallel.
    const enhancedRecipes: Recipe[] = await Promise.all(
      output.recipes.map(async (recipe: Recipe) => {
        // First, generate the step-by-step images, which are relatively fast.
        const instructionStepsWithImages = await Promise.all(
            recipe.instructionSteps.map(async (step) => {
              try {
                const imageResult = await generateRecipeStepImage({
                  instruction: step.text,
                  recipeName: recipe.name,
                });
                return { ...step, image: imageResult };
              } catch (e) {
                console.error(`Image generation failed for step "${step.text}" in recipe ${recipe.name}:`, e);
                return step;
              }
            })
        );
        
        const recipeWithImages: Recipe = { ...recipe, instructionSteps: instructionStepsWithImages };

        const mediaPromise = Promise.allSettled([
            generateRecipeAudio({ instructions: recipe.instructionSteps.map(s => s.text).join('\n') }),
            generateRecipeVideo({ recipeName: recipe.name })
        ]).then(([audioResult, videoResult]) => {
            const audio = audioResult.status === 'fulfilled' ? audioResult.value : undefined;
            const video = videoResult.status === 'fulfilled' ? videoResult.value : undefined;
            if (audioResult.status === 'rejected') console.error(`Audio generation failed for ${recipe.name}:`, audioResult.reason);
            if (videoResult.status === 'rejected') console.error(`Video generation failed for ${recipe.name}:`, videoResult.reason);
            return { audio, video };
        });

        return {
          ...recipeWithImages,
          audio: undefined,
          video: undefined,
          mediaPromise: mediaPromise as any,
        };
      })
    );

    return { recipes: enhancedRecipes };
  }
);
