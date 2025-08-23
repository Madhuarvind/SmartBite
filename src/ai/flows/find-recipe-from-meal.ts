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
  FindRecipeFromMealOutput,
  Recipe,
} from '../schemas';
import { generateRecipeAudio } from './generate-recipe-audio';
import { generateRecipeVideo } from './generate-recipe-video';
import { generateRecipeStepImage } from './generate-recipe-step-image';

export async function findRecipeFromMeal(
  input: FindRecipeFromMealInput
): Promise<FindRecipeFromMealOutput> {
  // The output from the flow is now the full Recipe object, so we can just return it.
  return findRecipeFromMealFlow(input);
}


const findRecipeFromMealFlow = ai.defineFlow(
  {
    name: 'findRecipeFromMealFlow',
    inputSchema: FindRecipeFromMealInputSchema,
    outputSchema: Recipe, // Output the full recipe schema directly
  },
  async (input) => {
    
    // Define a prompt that asks the AI to generate the recipe structure, but without images yet.
    const findRecipePrompt = ai.definePrompt({
      name: 'findRecipeFromMealPrompt',
      input: { schema: FindRecipeFromMealInputSchema },
      output: { schema: Recipe }, // We expect a full Recipe object as output
      prompt: `You are an expert recipe creator. The user has identified a meal they enjoyed and wants a standard, reliable recipe to recreate it at home.

Generate a complete recipe for the following meal: **{{{mealName}}}**

For the recipe, you MUST provide:
1.  A unique, appealing name (it can be the same as the input meal name if appropriate).
2.  A full list of ingredients with specific quantities.
3.  A detailed nutritional analysis per serving (calories, protein, carbs, fat).
4.  Detailed, step-by-step instructions. For each step, provide a 'step' number and the 'text' for the instruction. Do not include images yet.

Respond in the specified JSON format.
`,
    });

    // Generate the basic recipe structure (text only).
    const { output: recipe } = await findRecipePrompt(input);
    if (!recipe) {
      throw new Error('Could not generate a recipe for the meal.');
    }

    // Now, generate images for each instruction step in parallel.
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
            // If image generation fails, return the step without an image.
            return step;
          }
        })
    );
    
    // Update the recipe with the new steps containing images.
    const recipeWithImages: Recipe = { ...recipe, instructionSteps: instructionStepsWithImages };

    // Generate audio and video in the background, but don't wait for them to return the initial recipe object
    const mediaPromise = Promise.allSettled([
      generateRecipeAudio({ instructions: recipeWithImages.instructionSteps.map(s => s.text).join('\n') }),
      generateRecipeVideo({ recipeName: recipeWithImages.name }),
    ]).then(([audioResult, videoResult]) => {
      const audio = audioResult.status === 'fulfilled' ? audioResult.value : undefined;
      const video = videoResult.status === 'fulfilled' ? videoResult.value : undefined;

      if (audioResult.status === 'rejected') console.error(`Audio generation failed for ${recipe.name}:`, audioResult.reason);
      if (videoResult.status === 'rejected') console.error(`Video generation failed for ${recipe.name}:`, videoResult.reason);

      return { audio, video };
    });

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
