
'use server';
/**
 * @fileOverview An AI agent that identifies a grocery item from a photo and checks user's inventory.
 *
 * - identifyAndCheckItem - A function that takes an image and user ID, and returns a helpful message.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { checkInventoryTool } from '../tools/check-inventory';
import { IdentifyAndCheckItemInput, IdentifyAndCheckItemInputSchema, IdentifyAndCheckItemOutput, IdentifyAndCheckItemOutputSchema } from '../schemas';

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
            found: z.boolean(),
            quantity: z.string().nullable(),
        }),
    })},
    output: { schema: IdentifyAndCheckItemOutputSchema },
    prompt: `You are a friendly and helpful shopping assistant for the SmartBite app.
    
    The user has just scanned an item: **{{{itemName}}}**.
    
    You have checked their inventory with the following result:
    - Found: {{{inventoryResult.found}}}
    - Quantity at home: {{{inventoryResult.quantity}}}

    Generate a concise and helpful response.
    - If the item was found, tell them they're all set and mention the quantity.
    - If the item was not found, tell them it looks like they need to buy it.
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
    
    // Step 2: Check the user's inventory for the identified item.
    const inventoryResult = await checkInventoryTool.run({ userId, itemName });

    // Step 3: Generate a friendly response based on the inventory check.
    const { output: responseOutput } = await responseGenerationPrompt({ itemName, inventoryResult });
    if (!responseOutput?.response) {
      throw new Error("Could not generate a response.");
    }

    return {
      response: responseOutput.response,
    };
  }
);
