// src/ai/flows/generate-recipe-step-image.ts
'use server';
/**
 * @fileOverview A flow for generating an image for a single recipe step.
 *
 * - generateRecipeStepImage - Generates an image based on an instruction.
 */

import {
  GenerateRecipeStepImageInput,
  GenerateRecipeStepImageInputSchema,
  GenerateRecipeStepImageOutput,
  GenerateRecipeStepImageOutputSchema,
} from '../schemas';
import { generateImage } from './generate-image';
import { ai } from '@/ai/genkit';

export async function generateRecipeStepImage(
  input: GenerateRecipeStepImageInput
): Promise<GenerateRecipeStepImageOutput> {
  return generateRecipeStepImageFlow(input);
}

const generateRecipeStepImageFlow = ai.defineFlow(
  {
    name: 'generateRecipeStepImageFlow',
    inputSchema: GenerateRecipeStepImageInputSchema,
    outputSchema: GenerateRecipeStepImageOutputSchema,
  },
  async ({ instruction, recipeName }) => {
    // We now call the dedicated image generation flow.
    const result = await generateImage({
      prompt: `A clear, professional, appetizing food photography shot of the following cooking step for a recipe called "${recipeName}": ${instruction}. Focus on the action described.`,
    });

    return result;
  }
);
