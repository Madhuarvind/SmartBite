
// src/ai/tools/check-inventory.ts
'use server';

/**
 * @fileOverview A Genkit tool for checking a user's inventory in Firestore.
 */

import { ai } from '@/ai/genkit';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { z } from 'genkit';
import type { InventoryItem, PantryItem } from '@/lib/types';

export const checkInventoryTool = ai.defineTool(
  {
    name: 'checkInventory',
    description: "Checks the user's current inventory for a specific item to see if they already have it.",
    inputSchema: z.object({
      userId: z.string().describe('The unique ID of the user whose inventory is being checked.'),
      itemName: z.string().describe('The name of the item to check for, e.g., "Milk" or "Eggs".'),
    }),
    outputSchema: z.object({
      found: z.boolean().describe('Whether the item was found in the inventory.'),
      quantity: z.string().nullable().describe('The quantity of the item found, or null if not found.'),
    }),
  },
  async ({ userId, itemName }) => {
    console.log(`Checking inventory for user ${userId}, item: ${itemName}`);
    
    // Create a query to find the item, case-insensitive.
    // Firestore doesn't support case-insensitive queries directly, 
    // so we will query and then filter in code, which is acceptable for this use case.
    const inventoryRef = collection(db, 'users', userId, 'inventory');
    const pantryRef = collection(db, 'users', userId, 'pantry_essentials');

    const inventorySnapshot = await getDocs(inventoryRef);
    const pantrySnapshot = await getDocs(pantryRef);

    const allItems = [
      ...inventorySnapshot.docs.map(doc => doc.data() as InventoryItem),
      ...pantrySnapshot.docs.map(doc => doc.data() as PantryItem),
    ];
    
    const foundItem = allItems.find(item => item.name.toLowerCase() === itemName.toLowerCase());

    if (foundItem) {
      console.log(`Found item: ${foundItem.name} with quantity ${foundItem.quantity}`);
      return {
        found: true,
        quantity: foundItem.quantity,
      };
    }

    console.log('Item not found.');
    return {
      found: false,
      quantity: null,
    };
  }
);
