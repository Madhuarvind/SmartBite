// src/ai/flows/deduct-ingredients.ts
'use server';
/**
 * @fileOverview An AI flow for deducting ingredients from a user's inventory after cooking a recipe.
 *
 * - deductIngredients - A function that calculates the remaining inventory after a recipe is cooked.
 */

import { ai } from '@/ai/genkit';
import {
  DeductIngredientsInput,
  DeductIngredientsInputSchema,
  DeductIngredientsOutput,
  DeductIngredientsOutputSchema,
} from '../schemas';

export async function deductIngredients(
  input: DeductIngredientsInput
): Promise<DeductIngredientsOutput> {
  return deductIngredientsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'deductIngredientsPrompt',
  input: { schema: DeductIngredientsInputSchema },
  output: { schema: DeductIngredientsOutputSchema },
  prompt: `You are an intelligent inventory management AI for a smart kitchen app. Your task is to calculate the remaining quantity of ingredients in a user's inventory after they have cooked a recipe.

You will be given the full list of ingredients from the user's inventory (including their unique ID and current quantity) and the list of ingredients used in the recipe.

Your tasks are:
1.  **Match Ingredients**: For each ingredient used in the recipe, find the corresponding item in the user's inventory.
2.  **Calculate Remaining Quantity**: Subtract the recipe quantity from the inventory quantity. Be mindful of units (e.g., subtracting '2 cloves' of garlic from '1 head' of garlic, or '200g' of flour from '1kg'). If the calculation results in a zero or negative quantity, the remaining quantity should be '0' or an empty state like 'none'.
3.  **Handle Ambiguity**: If an ingredient is described vaguely (e.g., "a pinch of salt"), deduct a reasonable, small amount. For items like "1 onion", deduct one from the inventory count.
4.  **Format Output**: Return a list of only the inventory items that were used in the recipe, with their unique 'id' and the calculated 'newQuantity'. Do not include items from the inventory that were not used.

User's Inventory:
{{#each inventoryItems}}
- ID: {{this.id}}, Name: {{this.name}}, Quantity: {{this.quantity}}
{{/each}}

Recipe Ingredients Used:
{{#each recipeIngredients}}
- Name: {{this.name}}, Quantity: {{this.quantity}}
{{/each}}

Return the result in the specified JSON format.
`,
});

const deductIngredientsFlow = ai.defineFlow(
  {
    name: 'deductIngredientsFlow',
    inputSchema: DeductIngredientsInputSchema,
    outputSchema: DeduuctIngredientsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
