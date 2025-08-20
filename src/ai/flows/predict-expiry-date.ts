// src/ai/flows/predict-expiry-date.ts
'use server';
/**
 * @fileOverview An AI flow for predicting the expiry date of a fresh ingredient.
 *
 * - predictExpiryDate - A function that estimates the shelf life of an ingredient.
 */

import { ai } from '@/ai/genkit';
import {
  PredictExpiryDateInput,
  PredictExpiryDateInputSchema,
  PredictExpiryDateOutput,
  PredictExpiryDateOutputSchema,
} from '../schemas';

export async function predictExpiryDate(
  input: PredictExpiryDateInput
): Promise<PredictExpiryDateOutput> {
  return predictExpiryDateFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictExpiryDatePrompt',
  input: { schema: PredictExpiryDateInputSchema },
  output: { schema: PredictExpiryDateOutputSchema },
  prompt: `You are an expert in food science and safety. Your task is to predict the shelf life of a given ingredient.

Based on the ingredient name and its purchase date, estimate how long it will typically last when stored correctly.

Return only the calculated expiry date in YYYY-MM-DD format. Do not provide any explanation or additional text.

Ingredient: {{{ingredientName}}}
Purchase Date: {{{purchaseDate}}}
`,
});

const predictExpiryDateFlow = ai.defineFlow(
  {
    name: 'predictExpiryDateFlow',
    inputSchema: PredictExpiryDateInputSchema,
    outputSchema: PredictExpiryDateOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
