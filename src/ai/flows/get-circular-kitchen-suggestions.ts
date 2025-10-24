
'use server';
/**
 * @fileOverview An AI flow for generating creative reuse suggestions for food scraps to promote a circular kitchen.
 *
 * - getCircularKitchenSuggestions - A function that takes a list of wasted items and suggests ways to reuse them.
 */

import { ai } from '@/ai/genkit';
import {
  GetCircularKitchenSuggestionsInput,
  GetCircularKitchenSuggestionsInputSchema,
  GetCircularKitchenSuggestionsOutput,
  GetCircularKitchenSuggestionsOutputSchema,
} from '../schemas';

export async function getCircularKitchenSuggestions(
  input: GetCircularKitchenSuggestionsInput
): Promise<GetCircularKitchenSuggestionsOutput> {
  return getCircularKitchenSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'circularKitchenPrompt',
  input: { schema: GetCircularKitchenSuggestionsInputSchema },
  output: { schema: GetCircularKitchenSuggestionsOutputSchema },
  prompt: `You are an expert in zero-waste cooking and sustainable kitchen practices. Your goal is to help users "close the loop" in their kitchen by finding creative uses for food scraps that would normally be thrown away.

You will be given a list of recently wasted or discarded items. For this list, generate up to 5 creative, practical, and actionable suggestions for how to reuse these scraps.

For each suggestion, specify:
1.  'from': The specific scrap the suggestion applies to (e.g., "Onion Peels", "Stale Bread").
2.  'to': The new product or use for that scrap (e.g., "Vegetable Broth Powder", "Crispy Croutons").
3.  'suggestion': A brief, one-sentence tip explaining the action.

Example suggestions:
- from: "Carrot Peels", to: "Crispy Peel Snacks", suggestion: "Toss the peels with olive oil and spices, then bake until crispy."
- from: "Citrus Rinds", to: "All-Purpose Cleaner", suggestion: "Infuse the peels in vinegar for a few weeks to create a natural cleaning solution."
- from: "Coffee Grounds", to: "Garden Fertilizer", suggestion: "Sprinkle used coffee grounds around acid-loving plants like roses and blueberries."

Do not suggest composting, as the user already knows how to do that. Focus on reuse and upcycling.

List of recently discarded items:
{{#each wastedItems}}
- {{this.name}}
{{/each}}

Return your suggestions in the specified JSON format.
`,
});

const getCircularKitchenSuggestionsFlow = ai.defineFlow(
  {
    name: 'getCircularKitchenSuggestionsFlow',
    inputSchema: GetCircularKitchenSuggestionsInputSchema,
    outputSchema: GetCircularKitchenSuggestionsOutputSchema,
  },
  async (input) => {
    // If there are no wasted items, return an empty array of suggestions.
    if (!input.wastedItems || input.wastedItems.length === 0) {
      return { suggestions: [] };
    }

    const { output } = await prompt(input);
    return output!;
  }
);
