'use server';

/**
 * @fileOverview This file defines the scanIngredients flow, which uses AI to detect ingredients from an image, including OCR for expiry dates.
 *
 * - scanIngredients - A function that takes an image data URI as input and returns a list of identified ingredients with quantities and expiry dates.
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
  For each ingredient, identify it and estimate its quantity (e.g., "3", "500g", "1 bottle", "half a carton").
  If you cannot determine a quantity, you can leave it as "N/A".
  
  Additionally, use Optical Character Recognition (OCR) to find any expiry dates printed on the packaging of the items. The date might be in formats like "EXP 2024-12-31" or "Use by 12/31/24". If you find an expiry date for an item, return it in YYYY-MM-DD format. If no expiry date is found for an item, leave the expiryDate field as null.

  Return the ingredients as an array of objects.

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
