
'use server';
/**
 * @fileOverview An AI agent that answers questions about a user's pantry.
 *
 * - askPantryAssistant - A function that takes a query and user ID, and returns a helpful answer.
 */

import { ai } from '@/ai/genkit';
import { checkInventoryTool } from '../tools/check-inventory';
import {
  AskPantryAssistantInput,
  AskPantryAssistantInputSchema,
  AskPantryAssistantOutput,
  AskPantryAssistantOutputSchema,
} from '../schemas';

export async function askPantryAssistant(
  input: AskPantryAssistantInput
): Promise<AskPantryAssistantOutput> {
  return askPantryAssistantFlow(input);
}

const askPantryAssistantFlow = ai.defineFlow(
  {
    name: 'askPantryAssistantFlow',
    inputSchema: AskPantryAssistantInputSchema,
    outputSchema: AskPantryAssistantOutputSchema,
    tools: [checkInventoryTool],
  },
  async ({ query, userId }) => {
    // Note: We are providing the userId to the prompt context,
    // so the LLM can intelligently use it when calling tools.
    const llmResponse = await ai.generate({
      prompt: `You are a friendly and helpful pantry assistant for the SmartBite app.
      
      Your goal is to answer the user's questions about what is in their pantry.
      Use the available tools to check the user's inventory when necessary.
      
      User's query: "${query}"
      
      Keep your answers concise and conversational.`,
      context: {
        userId,
      },
    });

    return {
      answer: llmResponse.text,
    };
  }
);
