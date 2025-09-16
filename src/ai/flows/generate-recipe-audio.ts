
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
    const { media, finishReason, "custom": error } = await ai.generate({
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
      console.error('Audio generation failed.', {finishReason, error});
      throw new Error(`Audio generation failed: ${error?.message || 'No media was generated.'}`);
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
