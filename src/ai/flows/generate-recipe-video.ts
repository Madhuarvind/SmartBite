// src/ai/flows/generate-recipe-video.ts
'use server';
/**
 * @fileOverview A flow for generating a short video for a recipe.
 *
 * - generateRecipeVideo - Generates a video based on a recipe name.
 * - GenerateRecipeVideoInput - The input type for the generateRecipeVideo function.
 * - GenerateRecipeVideoOutput - The return type for the generateRecipeVideo function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'genkit';

export const GenerateRecipeVideoInputSchema = z.object({
  recipeName: z.string().describe('The name of the recipe to generate a video for.'),
});
export type GenerateRecipeVideoInput = z.infer<typeof GenerateRecipeVideoInputSchema>;

export const GenerateRecipeVideoOutputSchema = z.object({
  videoDataUri: z.string().describe("The generated video as a data URI. Expected format: 'data:video/mp4;base64,<encoded_data>'."),
});
export type GenerateRecipeVideoOutput = z.infer<typeof GenerateRecipeVideoOutputSchema>;

export async function generateRecipeVideo(
  input: GenerateRecipeVideoInput
): Promise<GenerateRecipeVideoOutput> {
    return generateRecipeVideoFlow(input);
}

const generateRecipeVideoFlow = ai.defineFlow(
  {
    name: 'generateRecipeVideoFlow',
    inputSchema: GenerateRecipeVideoInputSchema,
    outputSchema: GenerateRecipeVideoOutputSchema,
  },
  async ({ recipeName }) => {
    let { operation } = await ai.generate({
      model: googleAI.model('veo-2.0-generate-001'),
      prompt: `A cinematic, appetizing shot of ${recipeName}, beautifully plated and ready to eat.`,
      config: {
        durationSeconds: 5,
        aspectRatio: '16:9',
      },
    });

    if (!operation) {
      throw new Error('Expected the model to return an operation for video generation.');
    }

    while (!operation.done) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      operation = await ai.checkOperation(operation);
    }

    if (operation.error) {
      console.error('Video generation failed:', operation.error.message);
      throw new Error(`Failed to generate video: ${operation.error.message}`);
    }

    const videoPart = operation.output?.message?.content.find((p) => p.media && p.media.contentType?.startsWith('video/'));
    if (!videoPart || !videoPart.media?.url) {
      throw new Error('Failed to find the generated video in the operation result.');
    }

    // The URL from Veo is a temporary download link, so we need to fetch it
    // and convert it to a data URI to send to the client.
    const fetch = (await import('node-fetch')).default;
    const videoResponse = await fetch(`${videoPart.media.url}&key=${process.env.GEMINI_API_KEY}`);
    
    if (!videoResponse.ok || !videoResponse.body) {
         throw new Error(`Failed to download video from ${videoPart.media.url}. Status: ${videoResponse.status}`);
    }

    const videoBuffer = await videoResponse.buffer();
    const videoBase64 = videoBuffer.toString('base64');

    return {
      videoDataUri: `data:video/mp4;base64,${videoBase64}`,
    };
  }
);
