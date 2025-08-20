// src/ai/flows/predict-expiry-date.ts
'use server';
/**
 * @fileOverview An AI flow for predicting the expiry date of a fresh ingredient.
 *
 * - predictExpiryDate - A function that estimates the shelf life of an ingredient.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
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

// Internal schema for what we want the LLM to output
const ShelfLifeSchema = z.object({
    shelfLifeDays: z.number().describe('The estimated shelf life of the ingredient in days.'),
});

const prompt = ai.definePrompt({
  name: 'predictExpiryDatePrompt',
  input: { schema: PredictExpiryDateInputSchema },
  output: { schema: ShelfLifeSchema },
  prompt: `You are an expert in food science and safety. Your task is to estimate the typical shelf life of a fresh food item when stored correctly.

Return only the estimated number of days the ingredient will last from its purchase date.

Do not provide any explanation or additional text. Just return the JSON object with the shelf life in days.

Ingredient: {{{ingredientName}}}
`,
});

const predictExpiryDateFlow = ai.defineFlow(
  {
    name: 'predictExpiryDateFlow',
    inputSchema: PredictExpiryDateInputSchema,
    outputSchema: PredictExpiryDateOutputSchema,
  },
  async ({ ingredientName, purchaseDate }) => {
    // Step 1: Get the shelf life in days from the AI
    const { output } = await prompt({ ingredientName, purchaseDate });
    if (!output?.shelfLifeDays) {
        throw new Error('Could not predict shelf life from AI.');
    }

    // Step 2: Calculate the expiry date in code for reliability
    const purchase = new Date(purchaseDate);
    // Add a day to the purchase date to account for timezone shifts and ensure the calculation is from the start of that day.
    purchase.setDate(purchase.getDate() + 1);

    const expiry = new Date(purchase);
    expiry.setDate(purchase.getDate() + output.shelfLifeDays);

    // Step 3: Format the date into YYYY-MM-DD string
    const expiryDateString = expiry.toISOString().split('T')[0];

    return {
        expiryDate: expiryDateString,
    };
  }
);
