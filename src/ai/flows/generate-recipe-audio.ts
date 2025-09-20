// src/ai/flows/generate-recipe-audio.ts
'use server';
/**
 * @fileOverview A flow for generating audio narration for a recipe.
 *
 * - generateRecipeAudio - Converts recipe instructions to speech.
 */

import {ai} from '@/ai/genkit';
import wav from 'wav';
import { googleAI } from '@genkit-ai/googleai';
import { GenerateRecipeAudioInput, GenerateRecipeAudioInputSchema, GenerateRecipeAudioOutput, GenerateRecipeAudioOutputSchema } from '../schemas';

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: Buffer[] = [];
    writer.on('error', reject);
    writer.on('data', (d) => bufs.push(d));
    writer.on('end', () => resolve(Buffer.concat(bufs).toString('base64')));

    writer.write(pcmData);
    writer.end();
  });
}

export async function generateRecipeAudio(
  input: GenerateRecipeAudioInput
): Promise<GenerateRecipeAudioOutput> {
  return generateRecipeAudioFlow(input);
}

const generateRecipeAudioFlow = ai.defineFlow(
  {
    name: 'generateRecipeAudioFlow',
    inputSchema: GenerateRecipeAudioInputSchema,
    outputSchema: GenerateRecipeAudioOutputSchema,
  },
  async ({instructions}) => {
    try {
      const { media, finishReason, custom: customError } = await ai.generate({
        model: googleAI.model('gemini-2.5-flash-preview-tts'),
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Algenib' },
            },
          },
        },
        prompt: instructions,
      });
      
      if (finishReason !== 'success' || !media) {
        const errorMessage = (customError as any)?.message || 'No media was generated.';
        console.error('Audio generation failed.', {finishReason, error: errorMessage});
        if (errorMessage.includes('429')) {
             throw new Error('Too Many Requests. The free daily quota for audio generation has been exceeded.');
        } else if (errorMessage.includes('503')) {
             throw new Error('The audio generation service is currently overloaded. Please try again in a moment.');
        }
        throw new Error(errorMessage);
      }

      const audioBuffer = Buffer.from(
        media.url.substring(media.url.indexOf(',') + 1),
        'base64'
      );
      
      const wavBase64 = await toWav(audioBuffer);

      return {
        audioDataUri: `data:audio/wav;base64,${wavBase64}`,
      };
    } catch (e: any) {
        // Re-throw specific errors or a generic one
        let displayMessage = e.message || "The AI could not generate audio at this time.";
        console.error("Audio generation flow error:", e.message);
        throw new Error(displayMessage);
    }
  }
);
