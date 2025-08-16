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
  TransformRecipeOutput,
  TransformRecipeOutputSchema,
} from '../schemas';
import { generateRecipeAudio } from './generate-recipe-audio';
import { generateRecipeVideo } from './generate-recipe-video';

export async function transformRecipe(
  input: TransformRecipeInput
): Promise<TransformRecipeOutput> {
  return transformRecipeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'transformRecipePrompt',
  input: { schema: TransformRecipeInputSchema },
  output: { schema: TransformRecipeOutputSchema },
  prompt: `You are an expert chef and recipe developer. Your task is to transform a given recipe based on a user's specific request.

You must modify the recipe's name, ingredients, and instructions to reflect the transformation. You also need to recalculate the nutritional information for the new version.

Return the entire modified recipe in the specified JSON format.

Original Recipe Name: {{{recipe.name}}}
Original Recipe Ingredients: {{#each recipe.ingredients}}{{{this}}}, {{/each}}
Original Recipe Instructions: {{{recipe.instructions}}}

Transformation Request: {{{transformation}}}

Generate a new, transformed recipe based on this request.
`,
});

const transformRecipeFlow = ai.defineFlow(
  {
    name: 'transformRecipeFlow',
    inputSchema: TransformRecipeInputSchema,
    outputSchema: TransformRecipeOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Could not transform recipe.');
    }
    
    // After transforming the recipe, generate new audio and video for it.
    try {
        const [audioResult, videoResult] = await Promise.allSettled([
          generateRecipeAudio({ instructions: output.instructions }),
          generateRecipeVideo({ recipeName: output.name })
        ]);

        const audio = audioResult.status === 'fulfilled' ? audioResult.value : undefined;
        const video = videoResult.status === 'fulfilled' ? videoResult.value : undefined;

        if (audioResult.status === 'rejected') console.error(`Audio generation failed for transformed recipe ${output.name}:`, audioResult.reason);
        if (videoResult.status === 'rejected') console.error(`Video generation failed for transformed recipe ${output.name}:`, videoResult.reason);
        
        return { ...output, audio, video };

    } catch (error) {
        console.error(`Failed to generate media for transformed recipe ${output.name}`, error);
        return output;
    }
  }
);
