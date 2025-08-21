
// src/ai/flows/shopping-assistant.ts
'use server';

/**
 * @fileOverview An AI agent that helps users with their shopping by checking their inventory.
 *
 * - shoppingAssistant - A conversational flow that answers user queries.
 */

import { ai } from '@/ai/genkit';
import { checkInventoryTool } from '../tools/check-inventory';
import {
  ShoppingAssistantInput,
  ShoppingAssistantInputSchema,
  ShoppingAssistantOutput,
  ShoppingAssistantOutputSchema,
} from '../schemas';

export async function shoppingAssistant(
  input: ShoppingAssistantInput
): Promise<ShoppingAssistantOutput> {
  return shoppingAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'shoppingAssistantPrompt',
  input: { schema: ShoppingAssistantInputSchema },
  output: { schema: ShoppingAssistantOutputSchema },
  tools: [checkInventoryTool],
  prompt: `You are a friendly and helpful shopping assistant for the SmartBite app. Your primary goal is to help users avoid buying things they already have at home.

Use the checkInventory tool to look up items in the user's pantry.

- If the user asks if they need something (e.g., "Do I need milk?"), use the tool to check.
- If the item is found, respond naturally, like: "You're all set! You already have [quantity] of [item] at home."
- If the item is not found, respond with: "Yes, it looks like you need to buy [item]."
- If the user's query is not a question about their inventory, respond with a friendly message stating you can only help with inventory questions.

User's Question: {{{query}}}
User's ID: {{{userId}}}
`,
});

const shoppingAssistantFlow = ai.defineFlow(
  {
    name: 'shoppingAssistantFlow',
    inputSchema: ShoppingAssistantInputSchema,
    outputSchema: ShoppingAssistantOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return {
        response: output!.response,
    };
  }
);
