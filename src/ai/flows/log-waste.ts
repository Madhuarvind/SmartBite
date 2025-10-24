// src/ai/flows/log-waste.ts
'use server';
/**
 * @fileOverview An AI flow for providing composting information for a discarded food item.
 *
 * - logWaste - A function that takes an item name and returns compostability status and tips.
 */

import { ai } from '@/ai/genkit';
import {
  LogWasteInput,
  LogWasteInputSchema,
  LogWasteOutput,
  LogWasteOutputSchema,
} from '../schemas';

export async function logWaste(input: LogWasteInput): Promise<LogWasteOutput> {
  return logWasteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'logWastePrompt',
  input: { schema: LogWasteInputSchema },
  output: { schema: LogWasteOutputSchema },
  prompt: `You are a sustainability expert and composting guide for a smart kitchen app. The user is discarding a food item.

Your tasks are to:
1.  **Determine Compostability**: Based on the item name, determine if it is generally considered compostable.
2.  **Provide a Tip**: 
    - If the item IS compostable, provide a single, actionable tip for how to best compost it. For example, for "Chicken Bones", you might say "While compostable, bones break down very slowly. For best results, crush them first or add them to a hot compost pile." For "Apple Cores", a simpler "Great for compost! Just toss it in your bin." is sufficient.
    - If the item IS NOT compostable (e.g., plastic packaging, oily foods), state that it should not be composted and briefly explain why. For example, "Oily foods should not be composted as they can create odors and attract pests."

Return the analysis in the specified JSON format.

Item being discarded: {{{itemName}}}
`,
});

const logWasteFlow = ai.defineFlow(
  {
    name: 'logWasteFlow',
    inputSchema: LogWasteInputSchema,
    outputSchema: LogWasteOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
