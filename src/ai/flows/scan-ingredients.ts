
'use server';

/**
 * @fileOverview This file defines the scanIngredients flow, which uses AI to detect ingredients from an image or a text query.
 *
 * - scanIngredients - A function that takes an image data URI or text query and returns a list of identified ingredients.
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
  prompt: `You are an expert AI assistant designed to parse and understand kitchen and grocery-related inputs.
You can analyze images of groceries or text-based queries to extract a list of ingredients.

For each ingredient, you must:
1.  **Identify the item**: e.g., "Tomatoes", "Eggs", "Milk".
2.  **Estimate the quantity or weight**: Be as specific as possible. Examples: "3 tomatoes", "approx. 200g of spinach", "1L carton of milk", "1 bottle". If a quantity cannot be reasonably estimated, use a sensible default like "1" or "N/A".
3.  **Use OCR for Expiry Dates (for images only)**: If analyzing an image, scan for any printed expiry dates on packaging. If found, return it in YYYY-MM-DD format. If no date is found, leave the expiryDate field as null. For text queries, this will always be null.

Analyze the input provided below. It will either be a photo or a text query.

{{#if photoDataUri}}
Photo: {{media url=photoDataUri}}
{{/if}}

{{#if textQuery}}
Text Query: {{{textQuery}}}
{{/if}}

Return the final result as a JSON array of ingredient objects. If the query does not seem to be a list of ingredients (e.g., it's a question like "what can I cook?"), return an empty array.
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

    