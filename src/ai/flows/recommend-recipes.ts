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
import { RecommendRecipesInput, RecommendRecipesInputSchema, RecommendRecipesOutput, RecommendRecipesOutputSchema, InstructionStep } from '../schemas';


export async function recommendRecipes(input: RecommendRecipesInput): Promise<RecommendRecipesOutput> {
  return recommendRecipesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendRecipesPrompt',
  input: {schema: RecommendRecipesInputSchema},
  output: {schema: RecommendRecipesOutputSchema},
  prompt: `You are a creative and expert recipe recommendation engine. You will be provided with a list of ingredients the user has available, their dietary restrictions, and a list of ingredients that are about to expire.

Your task is to generate exactly 4 distinct and creative recipes. Prioritize using the expiring ingredients first. 

For each recipe, you MUST provide:
1. A unique, appealing name.
2. A full list of ingredients, with a name and a specific quantity for each (e.g., "200g", "1 cup", "2 cloves").
3. Detailed, step-by-step instructions as a single string, with each step separated by a newline character.
4. A detailed nutritional analysis per serving, including calories, protein, carbs, and fat, based on the specific ingredients and quantities you've listed.

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

    // After generating the recipe text, kick off all media generation in parallel.
    // This makes the UI feel much more responsive.
    const enhancedRecipes = await Promise.all(
      output.recipes.map(async (recipe) => {
        try {
          // Generate audio and video for the overall recipe
          // Using allSettled ensures that if one fails (e.g., video), the others can still succeed.
          const [audioResult, videoResult] = await Promise.allSettled([
            generateRecipeAudio({ instructions: recipe.instructions }),
            generateRecipeVideo({ recipeName: recipe.name })
          ]);

          const audio = audioResult.status === 'fulfilled' ? audioResult.value : undefined;
          const video = videoResult.status === 'fulfilled' ? videoResult.value : undefined;
          
          if (audioResult.status === 'rejected') console.error(`Audio generation failed for ${recipe.name}:`, audioResult.reason);
          if (videoResult.status === 'rejected') console.error(`Video generation failed for ${recipe.name}:`, videoResult.reason);

          // Generate images for each instruction step in parallel as well.
          const instructionSteps: InstructionStep[] = await Promise.all(
            recipe.instructions.split('\n').filter(line => line.trim().length > 0).map(async (instructionText, index) => {
              const step: InstructionStep = {
                step: index + 1,
                text: instructionText.replace(/^\d+\.\s*/, ''), // Remove leading numbers like "1. "
              };
              try {
                // We don't use allSettled here because we want to return the step regardless.
                // A missing image is not a critical failure for a single step.
                const imageResult = await generateRecipeStepImage({
                  instruction: step.text,
                  recipeName: recipe.name,
                });
                step.image = imageResult;
              } catch (e) {
                console.error(`Image generation failed for step "${step.text}" in recipe ${recipe.name}:`, e);
                // Continue without an image for this step
              }
              return step;
            })
          );
          
          // Return the recipe with whatever media was successfully generated.
          return { ...recipe, audio, video, instructionSteps };

        } catch (error) {
            console.error(`Failed to process media generation for ${recipe.name}`, error);
            // Return the original recipe even if the media processing fails catastrophically.
            return recipe;
        }
      })
    );

    return { recipes: enhancedRecipes };
  }
);
