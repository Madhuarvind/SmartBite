'use server';

/**
 * @fileOverview This file defines the scanIngredients flow, which uses AI to detect ingredients from an image.
 *
 * - scanIngredients - A function that takes an image data URI as input and returns a list of identified ingredients.
 * - ScanIngredientsInput - The input type for the scanIngredients function.
 * - ScanIngredientsOutput - The return type for the scanIngredients function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ScanIngredientsInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of ingredients, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ScanIngredientsInput = z.infer<typeof ScanIngredientsInputSchema>;

const ScanIngredientsOutputSchema = z.object({
  ingredients: z.array(z.string()).describe('A list of ingredients identified in the image.'),
});
export type ScanIngredientsOutput = z.infer<typeof ScanIngredientsOutputSchema>;

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
