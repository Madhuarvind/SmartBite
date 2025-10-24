
'use server';

/**
 * @fileOverview A flow for suggesting ingredient substitutions based on what the user has available.
 *
 * - suggestSubstitutions - A function that suggests ingredient substitutions.
 */

import {ai} from '@/ai/genkit';
import { SuggestSubstitutionsInput, SuggestSubstitutionsInputSchema, SuggestSubstitutionsOutput, SuggestSubstitutionsOutputSchema } from '../schemas';

export async function suggestSubstitutions(
  input: SuggestSubstitutionsInput
): Promise<SuggestSubstitutionsOutput> {
  return suggestSubstitutionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSubstitutionsPrompt',
  input: {schema: SuggestSubstitutionsInputSchema},
  output: {schema: SuggestSubstitutionsOutputSchema},
  prompt: `You are an expert chef, food scientist, and sustainability expert with access to a vast culinary knowledge graph. Your task is to provide intelligent ingredient substitutions that are both functional and sustainable.

The user is missing the following ingredient: **{{{missingIngredient}}}**.

The user has the following ingredients available: {{#each availableIngredients}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.

Based on the user's available ingredients, suggest the best possible substitutions. For each suggestion, provide:
1.  The name of the substitute ingredient.
2.  A brief, scientific explanation for why it works, considering flavor profile, texture, and chemical properties.
3.  A "sustainabilityRationale" explaining why this substitution is a more eco-friendly choice. Consider factors like lower average carbon footprint, less water usage, or potential for reducing food waste. If no good substitutions are available from the list, suggest a common pantry item that would work.

Example response for a missing egg:
[
  { "name": "Ground Flaxseed", "explanation": "When mixed with water, forms a gel that mimics the binding properties of an egg.", "sustainabilityRationale": "Flaxseed is plant-based and has a significantly lower carbon footprint than poultry farming." },
  { "name": "Applesauce", "explanation": "Provides moisture and binding, good for cakes.", "sustainabilityRationale": "Using applesauce can be a great way to use up fruit that is nearing the end of its freshness, reducing food waste." }
]

Return a list of substitutions with explanations and sustainability rationales in the specified JSON format.
  `,
});

const suggestSubstitutionsFlow = ai.defineFlow(
  {
    name: 'suggestSubstitutionsFlow',
    inputSchema: SuggestSubstitutionsInputSchema,
    outputSchema: SuggestSubstitutionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

    