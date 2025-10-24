
// src/ai/flows/get-preservation-suggestions.ts
'use server';
/**
 * @fileOverview An AI flow for suggesting food preservation techniques.
 *
 * - getPreservationSuggestions - A function that suggests methods like pickling, fermenting, or dehydrating.
 */

import { ai } from '@/ai/genkit';
import {
  GetPreservationSuggestionsInput,
  GetPreservationSuggestionsInputSchema,
  GetPreservationSuggestionsOutput,
  GetPreservationSuggestionsOutputSchema,
} from '../schemas';

export async function getPreservationSuggestions(
  input: GetPreservationSuggestionsInput
): Promise<GetPreservationSuggestionsOutput> {
  return getPreservationSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getPreservationSuggestionsPrompt',
  input: { schema: GetPreservationSuggestionsInputSchema },
  output: { schema: GetPreservationSuggestionsOutputSchema },
  prompt: `You are an expert in food science and home preservation techniques. A user has an ingredient that is nearing its expiry and they want to preserve it.

For the given ingredient, provide up to three distinct, safe, and practical preservation methods. Focus on common home techniques like pickling, fermenting, dehydrating, canning, or making jams/chutneys.

For each suggested method, you must provide:
1.  **method**: The name of the technique (e.g., "Quick Pickling", "Lacto-Fermentation", "Oven Dehydrating").
2.  **description**: A brief, one or two-sentence explanation of the process and the expected result.
3.  **requiredItems**: A short list of other essential items needed (e.g., "Vinegar, salt, sugar, glass jar").
4.  **difficulty**: The difficulty level, rated as "Easy", "Medium", or "Hard".

Do not provide full recipes, but rather concise, actionable guidance.

Ingredient to preserve: {{{ingredientName}}}

Return your suggestions in the specified JSON format.
`,
});

const getPreservationSuggestionsFlow = ai.defineFlow(
  {
    name: 'getPreservationSuggestionsFlow',
    inputSchema: GetPreservationSuggestionsInputSchema,
    outputSchema: GetPreservationSuggestionsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
        return { suggestions: [] };
    }
    return output;
  }
);
