'use server';

/**
 * @fileOverview This file defines the scanIngredients flow, which uses AI to detect ingredients from an image.
 *
 * - scanIngredients - A function that takes an image data URI as input and returns a list of identified ingredients.
 */

import {ai} from '@/ai/genkit';
import { ScanIngredientsInput, ScanIngredientsInputSchema, ScanIngredientsOutput, ScanIngredientsOutputSchema } from '../schemas';


export async function scanIngredients(input: ScanIngredientsInput): Promise<ScanIngredientsOutput> {
  return scanIngredientsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'scanIngredientsPrompt',
  input: {schema: ScanIngredientsInputSchema},
  output: {schema: ScanIngredientsOutputSchema},
  prompt: `You are an AI assistant that identifies ingredients in a photo.

  Analyze the following image and extract a list of ingredients.
  Return the ingredients as a simple list of strings.

  Photo: {{media url=photoDataUri}}
  `,
});

const scanIngredientsFlow = ai.defineFlow(
  {
    name: 'scanIngredientsFlow',
    inputSchema: ScanIngredientsInputSchema,
    outputSchema: ScanIngredientsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
