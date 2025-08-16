// src/ai/flows/generate-recipe-step-image.ts
'use server';
/**
 * @fileOverview A flow for generating an image for a single recipe step.
 *
 * - generateRecipeStepImage - Generates an image based on an instruction.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import {
  GenerateRecipeStepImageInput,
  GenerateRecipeStepImageInputSchema,
  GenerateRecipeStepImageOutput,
  GenerateRecipeStepImageOutputSchema,
} from '../schemas';

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
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: `A clear, professional, appetizing food photography shot of the following cooking step for a recipe called "${recipeName}": ${instruction}. Focus on the action described.`,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    const imageDataUri = media.url;
    if (!imageDataUri) {
      throw new Error('No image was generated for the recipe step.');
    }

    return {
      imageDataUri,
    };
  }
);
