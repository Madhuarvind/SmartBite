// src/ai/flows/find-recipe-from-meal.ts
'use server';
/**
 * @fileOverview An AI flow for generating a recipe based on a meal name.
 *
 * - findRecipeFromMeal - A function that takes a meal name and returns a full recipe.
 */

import { ai } from '@/ai/genkit';
import {
  FindRecipeFromMealInput,
  FindRecipeFromMealInputSchema,
  Recipe,
  RecipeSchema,
} from '../schemas';
import { generateRecipeAudio } from './generate-recipe-audio';
import { generateRecipeVideo } from './generate-recipe-video';
import { generateRecipeStepImage } from './generate-recipe-step-image';
import type { InstructionStep } from '../schemas';

export async function findRecipeFromMeal(
  input: FindRecipeFromMealInput
): Promise<Recipe> {
  return findRecipeFromMealFlow(input);
}

const prompt = ai.definePrompt({
  name: 'findRecipeFromMealPrompt',
  input: { schema: FindRecipeFromMealInputSchema },
  output: { schema: RecipeSchema },
  prompt: `You are an expert recipe creator. The user has identified a meal they enjoyed and wants a standard, reliable recipe to recreate it at home.

Generate a complete recipe for the following meal: **{{{mealName}}}**

For the recipe, you MUST provide:
1.  A unique, appealing name (it can be the same as the input meal name if appropriate).
2.  A full list of ingredients with specific quantities.
3.  Detailed, step-by-step instructions.
4.  A detailed nutritional analysis per serving (calories, protein, carbs, fat).

Respond in the specified JSON format.
`,
});

const findRecipeFromMealFlow = ai.defineFlow(
  {
    name: 'findRecipeFromMealFlow',
    inputSchema: FindRecipeFromMealInputSchema,
    outputSchema: RecipeSchema,
  },
  async (input) => {
    const { output: recipe } = await prompt(input);
    if (!recipe) {
      throw new Error('Could not generate a recipe for the meal.');
    }

    // After generating the recipe text, kick off all media generation in parallel.
    const instructionSteps: InstructionStep[] = await Promise.all(
        (recipe.instructionSteps || []).map(async (step) => {
          try {
            const imageResult = await generateRecipeStepImage({
              instruction: step.text,
              recipeName: recipe.name,
            });
            step.image = imageResult;
          } catch (e) {
            console.error(`Image generation failed for step "${step.text}" in recipe ${recipe.name}:`, e);
          }
          return step;
        })
    );
    
    const recipeWithImages: Recipe = { ...recipe, instructionSteps };

    // Generate audio and video in parallel in the background, but don't wait for them to return the initial recipe object
    const mediaPromise = (async () => {
        const fullInstructions = recipeWithImages.instructionSteps?.map(s => s.text).join('\n') || "";
        const [audioResult, videoResult] = await Promise.allSettled([
            generateRecipeAudio({ instructions: fullInstructions }),
            generateRecipeVideo({ recipeName: recipeWithImages.name }),
        ]);

        const audio = audioResult.status === 'fulfilled' ? audioResult.value : undefined;
        const video = videoResult.status === 'fulfilled' ? videoResult.value : undefined;

        if (audioResult.status === 'rejected') console.error(`Audio generation failed for ${recipe.name}:`, audioResult.reason);
        if (videoResult.status === 'rejected') console.error(`Video generation failed for ${recipe.name}:`, videoResult.reason);

        return { audio, video };
    })();


    return {
      ...recipeWithImages,
      // Initially return undefined for media, which will be populated on the client once the promise resolves
      audio: undefined,
      video: undefined,
      // Return the promise itself so the client can await it
      mediaPromise: mediaPromise as any,
    };
  }
);
