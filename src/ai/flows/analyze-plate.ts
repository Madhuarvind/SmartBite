// src/ai/flows/analyze-plate.ts
'use server';

/**
 * @fileOverview This file defines the analyzePlate flow, which uses AI to identify a meal from an image and estimate its nutritional content.
 *
 * - analyzePlate - A function that takes an image data URI and returns the meal name and nutritional info.
 */

import { ai } from '@/ai/genkit';
import {
  AnalyzePlateInput,
  AnalyzePlateInputSchema,
  AnalyzePlateOutput,
  AnalyzePlateOutputSchema,
} from '../schemas';

export async function analyzePlate(
  input: AnalyzePlateInput
): Promise<AnalyzePlateOutput> {
  return analyzePlateFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzePlatePrompt',
  input: { schema: AnalyzePlateInputSchema },
  output: { schema: AnalyzePlateOutputSchema },
  prompt: `You are an expert nutritionist and food recognition AI. Analyze the image of the meal provided.

Your task is to:
1.  **Identify the meal**: Determine the most likely name of the dish (e.g., "Chicken Caesar Salad", "Beef Stir-fry with Rice", "Pancakes with Berries").
2.  **Estimate Nutritional Information**: Based on the identified meal and the visible ingredients and portion sizes, provide an estimate for the following nutritional values:
    *   Calories (in kcal)
    *   Protein (in grams)
    *   Carbohydrates (in grams)
    *   Fat (in grams)

Return the result in the specified JSON format. Be as accurate as possible based on the visual evidence.

Photo of the meal: {{media url=photoDataUri}}
  `,
});

const analyzePlateFlow = ai.defineFlow(
  {
    name: 'analyzePlateFlow',
    inputSchema: AnalyzePlateInputSchema,
    outputSchema: AnalyzePlateOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
