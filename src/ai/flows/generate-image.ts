// src/ai/flows/generate-image.ts
'use server';
/**
 * @fileOverview A dedicated flow for generating images from text prompts using Imagen.
 *
 * - generateImage - A function that takes a text prompt and returns an image data URI.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import {
  GenerateImageInput,
  GenerateImageInputSchema,
  GenerateImageOutput,
  GenerateImageOutputSchema,
} from '../schemas';

export async function generateImage(
  input: GenerateImageInput
): Promise<GenerateImageOutput> {
  return generateImageFlow(input);
}

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async ({ prompt }) => {
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-image-preview'),
      prompt: [{ text: prompt }],
      config: {
        responseModalities: ['IMAGE', 'TEXT'],
      },
    });

    const imageDataUri = media.url;
    if (!imageDataUri) {
      throw new Error('No image was generated for the prompt.');
    }

    return {
      imageDataUri,
    };
  }
);
