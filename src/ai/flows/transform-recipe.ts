// src/ai/flows/transform-recipe.ts
'use server';
/**
 * @fileOverview An AI agent for transforming recipes based on user requests.
 *
 * - transformRecipe - A function that handles the recipe transformation process.
 */

import { ai } from '@/ai/genkit';
import {
  TransformRecipeInput,
  TransformRecipeInputSchema,
  Recipe,
} from '../schemas';
import { generateRecipeAudio } from './generate-recipe-audio';
import { generateRecipeVideo } from './generate-recipe-video';
import { generateRecipeStepImage } from './generate-recipe-step-image';

export async function transformRecipe(
  input: TransformRecipeInput
): Promise<Recipe> {
  return transformRecipeFlow(input);
}


const transformRecipeFlow = ai.defineFlow(
  {
    name: 'transformRecipeFlow',
    inputSchema: TransformRecipeInputSchema,
    outputSchema: Recipe,
  },
  async (input) => {

    const transformRecipePrompt = ai.definePrompt({
      name: 'transformRecipePrompt',
      input: { schema: TransformRecipeInputSchema },
      output: { schema: Recipe },
      prompt: `You are an expert chef and culinary psychologist. Your task is to act as an "AI Taste Predictor". You will transform a given recipe based on a user's specific taste preferences and requests.

You must deeply analyze the transformation request and modify the recipe accordingly. This might involve:
- Changing ingredients (e.g., swapping a mild pepper for a hotter one).
- Adjusting quantities (e.g., adding more garlic).
- Adding or changing steps in the instructions.
- Renaming the recipe to reflect its new character (e.g., "Spicy & Garlicky Chicken" instead of "Simple Roast Chicken").

After transforming, you must recalculate the nutritional information for the new version based on the modified ingredients.

For each instruction step, provide a 'step' number and the 'text' for the instruction. Do not include images yet.

Return the entire modified recipe in the specified JSON format.

Original Recipe Name: {{{recipe.name}}}
Original Recipe Ingredients: {{#each recipe.ingredients}}}{{{this.name}}} ({{{this.quantity}}}), {{/each}}
Original Recipe Instructions: {{{recipe.instructionSteps}}}

Transformation Request / Taste Profile: "{{{transformation}}}"

Generate a new, transformed recipe based on this request.
`,
    });

    const { output: recipe } = await transformRecipePrompt(input);
    if (!recipe) {
      throw new Error('Could not transform recipe.');
    }
    
    // Generate images for each instruction step first
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

    // Generate audio and video in the background
    const mediaPromise = Promise.allSettled([
      generateRecipeAudio({ instructions: recipe.instructionSteps.map(s => s.text).join('\n') }),
      generateRecipeVideo({ recipeName: recipe.name })
    ]).then(([audioResult, videoResult]) => {
      const audio = audioResult.status === 'fulfilled' ? audioResult.value : undefined;
      const video = videoResult.status === 'fulfilled' ? videoResult.value : undefined;
      if (audioResult.status === 'rejected') console.error(`Audio generation failed for transformed recipe ${recipe.name}:`, audioResult.reason);
      if (videoResult.status === 'rejected') console.error(`Video generation failed for transformed recipe ${recipe.name}:`, videoResult.reason);
      return { audio, video };
    });

    return {
      ...recipeWithImages,
      audio: undefined,
      video: undefined,
      mediaPromise: mediaPromise as any,
    };
  }
);
