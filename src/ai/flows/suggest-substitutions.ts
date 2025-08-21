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
  prompt: `You are an expert chef and food scientist with access to a vast culinary knowledge graph. Your task is to provide intelligent ingredient substitutions.

The user is missing the following ingredient: **{{{missingIngredient}}}**.

The user has the following ingredients available: {{#each availableIngredients}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.

Based on the user's available ingredients, suggest the best possible substitutions. For each suggestion, provide the name of the substitute ingredient and a brief, scientific explanation for why it works, considering factors like flavor profile, texture, and chemical properties. If no good substitutions are available from the list, suggest a common pantry item that would work.

Example response format for a missing egg:
[
  { "name": "Applesauce", "explanation": "Provides moisture and binding, good for cakes." },
  { "name": "Ground Flaxseed", "explanation": "When mixed with water, forms a gel that mimics the binding properties of an egg." }
]


Return a list of substitutions with explanations in the specified JSON format.
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
