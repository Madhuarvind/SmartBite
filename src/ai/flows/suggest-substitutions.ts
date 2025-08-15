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
  prompt: `You are a helpful assistant that suggests ingredient substitutions.

  The user is missing the following ingredient: {{{missingIngredient}}}
  The user has the following ingredients available: {{#each availableIngredients}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

  Suggest some substitutions for the missing ingredient using the available ingredients.
  Return a list of substitutions.`,
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
