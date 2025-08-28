
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
import { z } from 'zod';

// Hardcoded UID for the 'head of household' or family admin for now.
// In a real app, this would come from a user's profile or family group settings.
const FAMILY_ADMIN_UID = '1S0x75d72cN1s2tG3u4v5w6x7y8';

export async function askPantryAssistant(
  input: AskPantryAssistantInput
): Promise<AskPantryAssistantOutput> {
  return askPantryAssistantFlow(input);
}


// New prompt to first determine WHAT to look for if the query is general.
const clarifyShoppingQueryPrompt = ai.definePrompt({
    name: 'clarifyShoppingQuery',
    input: { schema: z.object({ query: z.string() }) },
    output: { schema: z.object({ itemsToCheck: z.array(z.string()).describe("A list of 1-3 specific grocery items to check in the user's inventory, e.g., ['Milk', 'Eggs', 'Bread']") }) },
    prompt: `You are a helpful shopping assistant. The user has asked a general question about what they need to buy. 
    Based on their query, infer a short list of 1-3 common, essential grocery items they are likely asking about.

    User query: "{{{query}}}"

    Return a JSON object with a list of items to check.
    `,
});

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
      
      Your primary goal is to answer the user's questions about what is in their collaborative family pantry.
      You have access to a tool called 'checkInventory' which can check the user's and their family's pantry for specific items.

      IMPORTANT: You are automatically provided with the necessary user IDs for your tools. You must NEVER ask the user for their 'user ID' or any other internal identifier.

      When a user asks a specific question like "Do we have milk?", use the 'checkInventory' tool to find the answer and report back.
      
      If a user asks a general question like "what should I buy?", you should first use the 'clarifyShoppingQuery' tool to determine a list of common items to check for. Then, use the 'checkInventory' tool for EACH of those items and provide a summary of what's missing.

      When you find an item in the family admin's pantry, make sure to mention that (e.g., "Yes, it looks like John Doe already has milk.").

      User's query: "${query}"
      
      Keep your answers concise, conversational, and helpful.`,
      tools: [checkInventoryTool, clarifyShoppingQueryPrompt],
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
