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
  prompt: `You are an expert AI assistant with advanced computer vision capabilities, designed to analyze images of groceries and pantry items.

Analyze the following image and extract a list of all visible ingredients.
For each ingredient, you must:
1.  **Identify the item**: e.g., "Tomatoes", "Eggs", "Milk".
2.  **Estimate the quantity or weight**: Be as specific as possible. Examples: "3 tomatoes", "approx. 200g of spinach", "1L carton of milk, half full", "1 bottle". If a quantity cannot be reasonably estimated, you may use "N/A".
3.  **Use OCR for Expiry Dates**: Scan for any printed expiry dates on packaging. Formats can vary (e.g., "EXP 2024-12-31", "Use by 12/31/24"). If found, return it in YYYY-MM-DD format. If no date is found, leave the expiryDate field as null.

Return the final result as a JSON array of ingredient objects.

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
