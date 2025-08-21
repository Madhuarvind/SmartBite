
'use server';
/**
 * @fileOverview An AI agent that identifies a grocery item from a photo and checks user's (and family's) inventory.
 *
 * - identifyAndCheckItem - A function that takes an image and user ID, and returns a helpful message.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { checkInventoryTool } from '../tools/check-inventory';
import { IdentifyAndCheckItemInput, IdentifyAndCheckItemInputSchema, IdentifyAndCheckItemOutput, IdentifyAndCheckItemOutputSchema } from '../schemas';

// Hardcoded UID for the 'head of household' or family admin for now.
// In a real app, this would come from a user's profile or family group settings.
const FAMILY_ADMIN_UID = '1S0x75d72cN1s2tG3u4v5w6x7y8';


export async function identifyAndCheckItem(input: IdentifyAndCheckItemInput): Promise<IdentifyAndCheckItemOutput> {
  return identifyAndCheckItemFlow(input);
}

const identifyItemPrompt = ai.definePrompt({
    name: 'identifyItemPrompt',
    input: { schema: z.object({ photoDataUri: z.string() }) },
    output: { schema: z.object({ itemName: z.string().describe("The name of the identified grocery item, e.g., 'Milk', 'Eggs', 'Cheddar Cheese'.") }) },
    prompt: `Analyze the provided image of a single grocery item. Identify the most specific and common name for the product.
    
    Return only the name of the item.

    Photo: {{media url=photoDataUri}}
    `
});

const responseGenerationPrompt = ai.definePrompt({
    name: 'shoppingResponsePrompt',
    input: { schema: z.object({ 
        itemName: z.string(),
        inventoryResult: z.object({
            currentUser: z.object({
              found: z.boolean(),
              quantity: z.string().nullable(),
            }),
            familyAdmin: z.object({
              found: z.boolean(),
              quantity: z.string().nullable(),
            }),
        }),
    })},
    output: { schema: IdentifyAndCheckItemOutputSchema },
    prompt: `You are a friendly and helpful collaborative shopping assistant for the SmartBite app.
    
    The user has just scanned an item: **{{{itemName}}}**.
    
    You have checked their inventory and their family admin's inventory with the following results:
    - Current User has it: {{{inventoryResult.currentUser.found}}} (Quantity: {{{inventoryResult.currentUser.quantity}}})
    - Family Admin has it: {{{inventoryResult.familyAdmin.found}}} (Quantity: {{{inventoryResult.familyAdmin.quantity}}})

    Generate a concise and helpful response based on the following rules, prioritizing preventing duplicate purchases within the family:
    - If the Family Admin has the item, tell the user they might not need to buy it and mention the admin has it (e.g., "Looks like the family pantry is stocked! John Doe already has this.").
    - If only the current user has it, tell them they're all set and mention their quantity.
    - If neither person has it, tell them it looks like they need to buy it.
    - If both have it, just tell them they're all set.
    `
});

const identifyAndCheckItemFlow = ai.defineFlow(
  {
    name: 'identifyAndCheckItemFlow',
    inputSchema: IdentifyAndCheckItemInputSchema,
    outputSchema: IdentifyAndCheckItemOutputSchema,
  },
  async ({ photoDataUri, userId }) => {
    // Step 1: Identify the item from the photo.
    const { output: identifyOutput } = await identifyItemPrompt({ photoDataUri });
    if (!identifyOutput?.itemName) {
      throw new Error("Could not identify the item in the photo.");
    }
    const { itemName } = identifyOutput;
    
    // Step 2: Check the user's and the family admin's inventory.
    const familyAdminId = userId === FAMILY_ADMIN_UID ? undefined : FAMILY_ADMIN_UID;
    const inventoryResult = await checkInventoryTool.run({ userId, itemName, familyAdminId });

    // Step 3: Generate a friendly response based on the collaborative inventory check.
    const { output: responseOutput } = await responseGenerationPrompt({ itemName, inventoryResult });
    if (!responseOutput?.response) {
      throw new Error("Could not generate a response.");
    }

    return {
      response: responseOutput.response,
    };
  }
);
