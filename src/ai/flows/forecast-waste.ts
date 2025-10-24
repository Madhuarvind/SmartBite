// src/ai/flows/forecast-waste.ts
'use server';
/**
 * @fileOverview An AI flow for forecasting potential food waste.
 *
 * - forecastWaste - A function that takes inventory and cooking history to predict waste.
 */

import { ai } from '@/ai/genkit';
import {
  ForecastWasteInput,
  ForecastWasteInputSchema,
  ForecastWasteOutput,
  ForecastWasteOutputSchema,
} from '../schemas';

export async function forecastWaste(
  input: ForecastWasteInput
): Promise<ForecastWasteOutput> {
  return forecastWasteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'forecastWastePrompt',
  input: { schema: ForecastWasteInputSchema },
  output: { schema: ForecastWasteOutputSchema },
  prompt: `You are a predictive sustainability assistant for a smart pantry app. Your job is to forecast potential food waste for the upcoming week and provide actionable advice to prevent it.

You will be given the user's current inventory with predicted expiry dates and their recent cooking history.

Your tasks are:
1.  **Identify At-Risk Items**: Analyze the inventory list and identify items whose expiry dates are within the next 7 days. Cross-reference this with the user's cooking history. If they rarely cook with an item that's about to expire, it's at high risk.
2.  **List Predicted Waste Items**: Create a list of the top 3-5 items that are most likely to be wasted.
3.  **Provide Actionable Suggestions**: For each at-risk item, provide a concrete, simple suggestion to use it up. This could be a simple recipe idea (e.g., "Use your browning bananas in a smoothie"), a preservation tip (e.g., "Your fresh herbs can be chopped and frozen in an ice cube tray with olive oil"), or a quick usage idea (e.g., "Toss your leftover spinach into your morning eggs").

User's Current Inventory:
{{#each inventory}}
- {{this.name}} (Quantity: {{this.quantity}}, Expires: {{this.expiry}})
{{/each}}

User's Recent Cooking History:
{{#each cookingHistory}}
- Cooked "{{this.recipeName}}" on {{this.date}}
{{/each}}

Return the forecast in the specified JSON format. Be encouraging and helpful in your tone.
`,
});

const forecastWasteFlow = ai.defineFlow(
  {
    name: 'forecastWasteFlow',
    inputSchema: ForecastWasteInputSchema,
    outputSchema: ForecastWasteOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
