// src/ai/flows/generate-recipe-audio.ts
'use server';
/**
 * @fileOverview A flow for generating audio narration for a recipe.
 *
 * - generateRecipeAudio - Converts recipe instructions to speech.
 * - GenerateRecipeAudioInput - The input type for the generateRecipeAudio function.
 * - GenerateRecipeAudioOutput - The return type for the generateRecipeAudio function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';
import { googleAI } from '@genkit-ai/googleai';

export const GenerateRecipeAudioInputSchema = z.object({
  instructions: z.string().describe('The recipe instructions to be converted to speech.'),
});
export type GenerateRecipeAudioInput = z.infer<typeof GenerateRecipeAudioInputSchema>;

export const GenerateRecipeAudioOutputSchema = z.object({
  audioDataUri: z.string().describe("The generated audio as a data URI. Expected format: 'data:audio/wav;base64,<encoded_data>'."),
});
export type GenerateRecipeAudioOutput = z.infer<typeof GenerateRecipeAudioOutputSchema>;

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

    let bufs: Buffer[] = [];
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
    const { media } = await ai.generate({
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
    
    if (!media) {
      throw new Error('No audio media was generated.');
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
