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
    let operation;
    try {
      const result = await ai.generate({
        model: googleAI.model('veo-2.0-generate-001'),
        prompt: `A cinematic, appetizing shot of ${recipeName}, beautifully plated and ready to eat.`,
        config: {
          durationSeconds: 5,
          aspectRatio: '16:9',
        },
      });
      operation = result.operation;

      if (!operation) {
        const error = (result.custom as any)?.error;
        let errorMessage = error?.message || 'Expected the model to return an operation for video generation.';
        console.error('Video generation failed:', errorMessage);
        if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('rate limit')) {
          errorMessage = 'Too Many Requests: The free daily quota for video generation has been exceeded. Please try again later or upgrade your API key.';
        } else if (errorMessage.includes('503')) {
            errorMessage = 'Service Unavailable: The video generation service is currently overloaded. Please try again in a moment.';
        }
        throw new Error(errorMessage);
      }
      
      // Wait until the operation completes. Note that this may take some time.
      while (!operation.done) {
          await new Promise((resolve) => setTimeout(resolve, 5000)); // Poll every 5 seconds
          operation = await ai.checkOperation(operation);
      }

      if (operation.error) {
        let errorMessage = operation.error.message;
        console.error('Video generation operation failed:', errorMessage);
        if (errorMessage.toLowerCase().includes('rate limit')) {
          errorMessage = 'Too Many Requests: The free daily quota for video generation has been exceeded. Please try again later or upgrade your API key.';
        }
        throw new Error(`Failed to generate video: ${errorMessage}`);
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

    } catch (e: any) {
        let displayMessage = e.message || "The AI couldn't create a video at this time.";
        if (e.message?.includes('429') || e.message.toLowerCase().includes('rate limit')) {
            displayMessage = 'Too Many Requests: The free daily quota for video generation has been exceeded. Please try again later or upgrade your API key.';
        } else if (e.message?.includes('503')) {
            displayMessage = 'Service Unavailable: The video generation service is currently overloaded. Please try again in a moment.';
        }
        console.error("Video generation flow error:", e.message);
        throw new Error(displayMessage);
    }
  }
);
