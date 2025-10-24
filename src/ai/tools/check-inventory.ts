// src/ai/tools/check-inventory.ts
'use server';

/**
 * @fileOverview A Genkit tool for checking a user's (and their family's) inventory in Firestore.
 */

import { ai } from '@/ai/genkit';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { z } from 'genkit';
import type { InventoryItem, PantryItem } from '@/lib/types';

// Helper function to query a user's inventory and pantry for a specific item
async function findUserItem(userId: string, itemName: string): Promise<PantryItem | InventoryItem | null> {
  const inventoryRef = collection(db, 'users', userId, 'inventory');
  const pantryRef = collection(db, 'users', userId, 'pantry_essentials');

  // Case-insensitive search helper
  const searchFor = itemName.toLowerCase();

  const inventoryQuery = query(inventoryRef);
  const inventorySnapshot = await getDocs(inventoryQuery);
  for (const doc of inventorySnapshot.docs) {
    const data = doc.data() as InventoryItem;
    if (data.name.toLowerCase().includes(searchFor)) {
      return data;
    }
  }

  const pantryQuery = query(pantryRef);
  const pantrySnapshot = await getDocs(pantryQuery);
   for (const doc of pantrySnapshot.docs) {
    const data = doc.data() as PantryItem;
    if (data.name.toLowerCase().includes(searchFor)) {
      return data;
    }
  }

  return null;
}


export const checkInventoryTool = ai.defineTool(
  {
    name: 'checkInventory',
    description: "Checks the user's and optionally a family admin's current inventory for a specific item to see if they already have it.",
    inputSchema: z.object({
      userId: z.string().describe("The unique ID of the user whose inventory is being checked."),
      itemName: z.string().describe('The name of the item to check for, e.g., "Milk" or "Eggs".'),
      familyAdminId: z.string().optional().describe("The unique ID of the family admin to also check. If the current user is the admin, this can be omitted."),
    }),
    outputSchema: z.object({
      currentUserFound: z.boolean().describe('Whether the item was found in the current user\'s inventory.'),
      currentUserQuantity: z.string().nullable().describe('The quantity of the item found, or null if not found.'),
      familyAdminFound: z.boolean().describe("Whether the item was found in the family admin's inventory."),
      familyAdminQuantity: z.string().nullable().describe('The quantity of the item found, or null if not found.'),
    }),
  },
  async ({ userId, itemName, familyAdminId }) => {
    console.log(`Checking inventory for user ${userId} and family admin ${familyAdminId}, item: ${itemName}`);
    
    // Check current user's inventory
    const foundCurrentUserItem = await findUserItem(userId, itemName);

    const result = {
        currentUserFound: !!foundCurrentUserItem,
        currentUserQuantity: foundCurrentUserItem?.quantity || null,
        familyAdminFound: false,
        familyAdminQuantity: null,
    };

    // Check family admin's inventory if provided
    if (familyAdminId) {
        const foundFamilyAdminItem = await findUserItem(familyAdminId, itemName);
        result.familyAdminFound = !!foundFamilyAdminItem;
        result.familyAdminQuantity = foundFamilyAdminItem?.quantity || null;
    }
    
    console.log('Collaborative inventory check result:', result);
    return result;
  }
);
