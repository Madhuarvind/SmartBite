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
  GenerateRecipeAudioOutput,
  GenerateRecipeStepImageOutput,
  GenerateRecipeVideoOutput,
  InstructionStep,
  Recipe,
} from '../schemas';
import { generateRecipeAudio } from './generate-recipe-audio';
import { generateRecipeVideo } from './generate-recipe-video';
import { generateRecipeStepImage } from './generate-recipe-step-image';
import { generateRecipeMedia } from './generate-recipe-media';

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
4.  Detailed, step-by-step instructions. For each step, provide a 'step' number and the 'text' for the instruction. Do not include images, audio, or video yet.

Respond in the specified JSON format.
`,
    });

    // Generate the basic recipe structure (text only).
    const { output: recipe } = await findRecipePrompt(input);
    if (!recipe) {
      throw new Error('Could not generate a recipe for the meal.');
    }
    
    // Asynchronously generate all media in the background.
    const mediaPromise = (async () => {
      // The generateRecipeMedia flow now handles the complexity of image generation.
      const mediaResult = await generateRecipeMedia({ recipe });

      // After images are done (or failed gracefully), kick off audio/video
      const [audioResult, videoResult] = await Promise.all([
        generateRecipeAudio({ instructions: recipe.instructionSteps.map(s => s.text).join('\n') }).catch(e => {
            console.error(`Audio generation failed for ${recipe.name}:`, e);
            return undefined;
        }),
        generateRecipeVideo({ recipeName: recipe.name }).catch(e => {
            console.error(`Video generation failed for ${recipe.name}:`, e);
            return undefined;
        })
      ]);

      return {
          instructionSteps: mediaResult.instructionSteps,
          audio: audioResult,
          video: videoResult,
      };
    })();

    return {
      ...recipe,
      // Initially return undefined for media and steps without images, which will be populated on the client once the promise resolves
      instructionSteps: recipe.instructionSteps.map(step => ({...step, image: undefined})),
      audio: undefined,
      video: undefined,
      // Return the promise itself so the client can await it
      mediaPromise: mediaPromise as any,
    };
  }
);
