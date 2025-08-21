
'use server';
/**
 * @fileOverview An AI agent that answers questions about a user's collaborative family pantry.
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

// Hardcoded UID for the 'head of household' or family admin for now.
// In a real app, this would come from a user's profile or family group settings.
const FAMILY_ADMIN_UID = '1S0x75d72cN1s2tG3u4v5w6x7y8';

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
  },
  async ({ query, userId }) => {
    // Determine if we need to pass the family admin ID to the tool.
    // Don't pass it if the current user *is* the family admin, to avoid checking the same inventory twice.
    const familyAdminId = userId === FAMILY_ADMIN_UID ? undefined : FAMILY_ADMIN_UID;

    // We provide the `userId` and `familyAdminId` to the tool's context.
    // The `generate` call will intelligently pass these to the `checkInventory` tool if the LLM decides to call it.
    const llmResponse = await ai.generate({
      prompt: `You are a friendly and helpful pantry assistant for the SmartBite app.
      
      Your goal is to answer the user's questions about what is in their collaborative family pantry.
      Use the available tools to check the user's inventory and their family admin's inventory when necessary.
      
      When responding, if an item is found in the family admin's pantry, make sure to mention that (e.g., "Yes, John Doe has that.").

      User's query: "${query}"
      
      Keep your answers concise and conversational.`,
      tools: [checkInventoryTool],
      context: {
        tool_checkInventory_payload: {
          userId,
          familyAdminId,
        },
      },
    });

    return {
      answer: llmResponse.text,
    };
  }
);
