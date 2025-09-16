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
    const { media, finishReason, "custom": customError } = await ai.generate({
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
      // Instead of throwing, we now catch the error and re-throw with a more specific message
      // which will be caught by the UI and displayed in a toast.
      throw new Error(`Audio generation failed: ${errorMessage}`);
    }

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    
    const wavBase64 = await toWav(audioBuffer);

    return {
      audioDataUri: `data:audio/wav;base64,${wavBase64}`,
    };
  }
);
