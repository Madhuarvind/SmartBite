// src/ai/flows/generate-recipe-media.ts
'use server';
/**
 * @fileOverview A flow for generating all media for a recipe on-demand.
 *
 * - generateRecipeMedia - Generates step images, audio, and video.
 */

import { ai } from '@/ai/genkit';
import {
  GenerateRecipeMediaInput,
  GenerateRecipeMediaInputSchema,
  Recipe,
} from '../schemas';
import { generateImage } from './generate-image';

export async function generateRecipeMedia(
  input: GenerateRecipeMediaInput
): Promise<Recipe> {
  return generateRecipeMediaFlow(input);
}

const generateRecipeMediaFlow = ai.defineFlow(
  {
    name: 'generateRecipeMediaFlow',
    inputSchema: GenerateRecipeMediaInputSchema,
    outputSchema: Recipe,
  },
  async ({ recipe }) => {
    // Generate all step images in parallel.
    const instructionImagePromises = recipe.instructionSteps.map(async (step) => {
      try {
        const imageResult = await generateImage({
          prompt: `A clear, professional, appetizing food photography shot of the following cooking step for a recipe called "${recipe.name}": ${step.text}. Focus on the action described.`,
        });
        return { ...step, image: imageResult };
      } catch (e) {
        console.error(`Image generation failed for step "${step.text}"`, e);
        return { ...step, image: undefined }; // Return step without image on failure
      }
    });

    const instructionStepsWithImages = await Promise.all(instructionImagePromises);

    // This flow is now simplified to only handle step images, as audio/video are handled elsewhere.
    return {
      ...recipe,
      instructionSteps: instructionStepsWithImages,
    };
  }
);
