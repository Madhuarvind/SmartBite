// src/ai/flows/generate-recipe-step-image.ts
'use server';
/**
 * @fileOverview A flow for generating an image for a single recipe step.
 *
 * - generateRecipeStepImage - Generates an image based on an instruction.
 */

import {
  GenerateImageInput,
  GenerateImageInputSchema,
  GenerateImageOutput,
  GenerateImageOutputSchema,
} from '../schemas';
import { generateImage } from './generate-image';
import { ai } from '@/ai/genkit';

export async function generateRecipeStepImage(
  input: GenerateImageInput
): Promise<GenerateImageOutput> {
  return generateRecipeStepImageFlow(input);
}

const generateRecipeStepImageFlow = ai.defineFlow(
  {
    name: 'generateRecipeStepImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async ({ prompt }) => {
    // We now call the dedicated image generation flow.
    const result = await generateImage({
      prompt: prompt,
    });

    return result;
  }
);
