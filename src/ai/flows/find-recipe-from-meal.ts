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
  FindRecipeFromMealOutputSchema,
} from '../schemas';
import { generateRecipeAudio } from './generate-recipe-audio';
import { generateRecipeVideo } from './generate-recipe-video';
import { generateRecipeStepImage } from './generate-recipe-step-image';
import type { InstructionStep } from '../schemas';

export async function findRecipeFromMeal(
  input: FindRecipeFromMealInput
): Promise<FindRecipeFromMealOutput> {
  return findRecipeFromMealFlow(input);
}

const prompt = ai.definePrompt({
  name: 'findRecipeFromMealPrompt',
  input: { schema: FindRecipeFromMealInputSchema },
  output: { schema: FindRecipeFromMealOutputSchema },
  prompt: `You are an expert recipe creator. The user has identified a meal they enjoyed and wants a standard, reliable recipe to recreate it at home.

Generate a complete recipe for the following meal: **{{{mealName}}}**

For the recipe, you MUST provide:
1.  A unique, appealing name (it can be the same as the input meal name if appropriate).
2.  A full list of ingredients with specific quantities.
3.  Detailed, step-by-step instructions as a single string, with each step numbered and separated by a newline character.
4.  A detailed nutritional analysis per serving (calories, protein, carbs, fat).

Respond in the specified JSON format.
`,
});

const findRecipeFromMealFlow = ai.defineFlow(
  {
    name: 'findRecipeFromMealFlow',
    inputSchema: FindRecipeFromMealInputSchema,
    outputSchema: FindRecipeFromMealOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Could not generate a recipe for the meal.');
    }

    // After generating the recipe text, kick off all media generation in parallel.
    const instructionSteps: InstructionStep[] = await Promise.all(
        output.instructions.split('\n').filter(line => line.trim().length > 0).map(async (instructionText, index) => {
          const step: InstructionStep = {
            step: index + 1,
            text: instructionText.replace(/^\d+\.\s*/, ''),
          };
          try {
            const imageResult = await generateRecipeStepImage({
              instruction: step.text,
              recipeName: output.name,
            });
            step.image = imageResult;
          } catch (e) {
            console.error(`Image generation failed for step "${step.text}" in recipe ${output.name}:`, e);
          }
          return step;
        })
    );
    
    const recipeWithImages = { ...output, instructionSteps };

    const mediaPromise = Promise.allSettled([
      generateRecipeAudio({ instructions: output.instructions }),
      generateRecipeVideo({ recipeName: output.name }),
    ]).then(([audioResult, videoResult]) => {
      const audio = audioResult.status === 'fulfilled' ? audioResult.value : undefined;
      const video = videoResult.status === 'fulfilled' ? videoResult.value : undefined;

      if (audioResult.status === 'rejected') console.error(`Audio generation failed for ${output.name}:`, audioResult.reason);
      if (videoResult.status === 'rejected') console.error(`Video generation failed for ${output.name}:`, videoResult.reason);
      
      return { ...recipeWithImages, audio, video };
    });

    return {
      ...recipeWithImages,
      audio: undefined,
      video: undefined,
      ...await mediaPromise
    };
  }
);
