// src/ai/flows/predict-expiry-date.ts
'use server';
/**
 * @fileOverview An AI flow for predicting the edibility of a fresh ingredient.
 *
 * - predictEdibility - A function that estimates the shelf life and edibility of an ingredient.
 */

import { ai } from '@/ai/genkit';
import {
  PredictEdibilityInput,
  PredictEdibilityInputSchema,
  PredictEdibilityOutput,
  PredictEdibilityOutputSchema,
} from '../schemas';

export async function predictEdibility(
  input: PredictEdibilityInput
): Promise<PredictEdibilityOutput> {
  return predictEdibilityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictEdibilityPrompt',
  input: { schema: PredictEdibilityInputSchema },
  output: { schema: PredictEdibilityOutputSchema },
  prompt: `You are an expert in food science and safety. Your task is to estimate the edibility of a fresh food item based on its name, purchase date, and storage method.

Your response must include:
1.  **edibilityScore**: A number from 0 to 100 representing the likelihood the item is still perfectly edible.
2.  **status**: A short, descriptive status. Examples: "Peak Freshness", "Use Soon", "Check Before Use", "Likely Spoiled".
3.  **reasoning**: A brief, one-sentence explanation for your prediction, considering the storage method.
4.  **predictedExpiry**: The estimated expiry date in YYYY-MM-DD format.

Ingredient: {{{ingredientName}}}
Purchase Date: {{{purchaseDate}}}
Storage Method: {{{storageMethod}}}

Return the result in the specified JSON format.
`,
});

const predictEdibilityFlow = ai.defineFlow(
  {
    name: 'predictEdibilityFlow',
    inputSchema: PredictEdibilityInputSchema,
    outputSchema: PredictEdibilityOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Could not predict edibility from AI.');
    }
    return output;
  }
);
