
// src/ai/flows/generate-recipe-video.ts
'use server';
/**
 * @fileOverview A flow for generating a short video for a recipe.
 *
 * - generateRecipeVideo - Generates a video based on a recipe name.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { GenerateRecipeVideoInput, GenerateRecipeVideoInputSchema, GenerateRecipeVideoOutput, GenerateRecipeVideoOutputSchema } from '../schemas';
import { Readable } from 'stream';
import type { MediaPart } from 'genkit';

async function downloadVideo(video: MediaPart): Promise<string> {
  const fetch = (await import('node-fetch')).default;
  // Add API key before fetching the video.
  const videoDownloadResponse = await fetch(
    `${video.media!.url}&key=${process.env.GEMINI_API_KEY}`
  );
  if (
    !videoDownloadResponse ||
    videoDownloadResponse.status !== 200 ||
    !videoDownloadResponse.body
  ) {
    throw new Error('Failed to fetch video');
  }

  const videoBuffer = await videoDownloadResponse.arrayBuffer();
  return Buffer.from(videoBuffer).toString('base64');
}


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
      console.error('Video generation failed: No operation returned.');
      throw new Error('Expected the model to return an operation for video generation.');
    }
    
    // Wait until the operation completes. Note that this may take some time.
    while (!operation.done) {
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Poll every 5 seconds
        operation = await ai.checkOperation(operation);
    }

    if (operation.error) {
      console.error('Video generation failed:', operation.error.message);
      throw new Error(`Failed to generate video: ${operation.error.message}`);
    }

    const videoPart = operation.output?.message?.content.find((p) => p.media && p.media.contentType?.startsWith('video/'));
    if (!videoPart || !videoPart.media?.url) {
      console.error('Video generation failed: No video part found in result.');
      throw new Error('Failed to find the generated video in the operation result.');
    }

    const videoBase64 = await downloadVideo(videoPart);

    return {
      videoDataUri: `data:video/mp4;base64,${videoBase64}`,
    };
  }
);
