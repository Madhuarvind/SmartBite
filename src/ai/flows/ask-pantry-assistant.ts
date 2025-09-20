
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

    const llmResponse = await ai.generate({
      prompt: `You are a friendly and helpful pantry assistant for the SmartBite app.
      
Your primary goal is to answer the user's questions about what is in their collaborative family pantry.
You have access to a tool called 'checkInventory' which can check the user's and their family's pantry for specific items.

- Use the 'checkInventory' tool whenever the user asks if they have a specific item (e.g., "Do we have milk?", "How many eggs are left?").
- The tool will tell you if the current user has the item, and if the family admin has the item.
- When you get the result from the tool, formulate a helpful, conversational answer. For example, if the user asks "do we have eggs" and the tool returns that the user has '12 pcs', you should say "Yes, you have 12 pcs of eggs."
- If the family admin has the item, make sure to mention that (e.g., "Yes, it looks like the family pantry is stocked! John Doe already has this.").
- IMPORTANT: You are automatically provided with the necessary user IDs for your tools. You must NEVER ask the user for their 'user ID' or any other internal identifier.
- Your FINAL response to the user must be a conversational, helpful answer in plain text, NOT raw tool code or JSON.

User's query: "${query}"

Keep your answers concise and helpful.`,
      tools: [checkInventoryTool],
      // Provide the userId and familyAdminId to the tool's context.
      // Genkit will intelligently pass these to the `checkInventory` tool if the LLM decides to call it.
      context: {
        tool_checkInventory_payload: {
          userId,
          familyAdminId,
        },
      },
    });

    if (llmResponse.text) {
        return { answer: llmResponse.text };
    }

    // If the model calls a tool but doesn't return text, we can check the tool output
    // and provide a default response.
    const toolResponse = llmResponse.toolRequest?.tool?.response;
    if (toolResponse) {
        // Here you could add logic based on the tool's output if needed.
        // For now, a generic confirmation is good.
        return { answer: "I've checked the inventory for you and it seems you are all set." };
    }
    
    // Fallback if there's no text and no tool call.
    throw new Error('The AI assistant did not return a valid response.');
  }
);
