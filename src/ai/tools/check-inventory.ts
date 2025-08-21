
// src/ai/tools/check-inventory.ts
'use server';

/**
 * @fileOverview A Genkit tool for checking a user's (and their family's) inventory in Firestore.
 */

import { ai } from '@/ai/genkit';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { z } from 'genkit';
import type { InventoryItem, PantryItem } from '@/lib/types';

// Helper function to query a user's inventory and pantry
async function getUserItems(userId: string): Promise<PantryItem[]> {
  const inventoryRef = collection(db, 'users', userId, 'inventory');
  const pantryRef = collection(db, 'users', userId, 'pantry_essentials');

  const inventorySnapshot = await getDocs(inventoryRef);
  const pantrySnapshot = await getDocs(pantryRef);

  return [
    ...inventorySnapshot.docs.map(doc => doc.data() as InventoryItem),
    ...pantrySnapshot.docs.map(doc => doc.data() as PantryItem),
  ];
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
      currentUser: z.object({
        found: z.boolean().describe('Whether the item was found in the current user\'s inventory.'),
        quantity: z.string().nullable().describe('The quantity of the item found, or null if not found.'),
      }),
      familyAdmin: z.object({
        found: z.boolean().describe("Whether the item was found in the family admin's inventory."),
        quantity: z.string().nullable().describe('The quantity of the item found, or null if not found.'),
      }),
    }),
  },
  async ({ userId, itemName, familyAdminId }) => {
    console.log(`Checking inventory for user ${userId} and family admin ${familyAdminId}, item: ${itemName}`);
    
    // Check current user's inventory
    const currentUserItems = await getUserItems(userId);
    const foundCurrentUserItem = currentUserItems.find(item => item.name.toLowerCase() === itemName.toLowerCase());

    const result = {
        currentUser: {
            found: !!foundCurrentUserItem,
            quantity: foundCurrentUserItem?.quantity || null,
        },
        familyAdmin: {
            found: false,
            quantity: null,
        }
    };

    // Check family admin's inventory if provided
    if (familyAdminId) {
        const familyAdminItems = await getUserItems(familyAdminId);
        const foundFamilyAdminItem = familyAdminItems.find(item => item.name.toLowerCase() === itemName.toLowerCase());
        result.familyAdmin = {
            found: !!foundFamilyAdminItem,
            quantity: foundFamilyAdminItem?.quantity || null,
        };
    }
    
    console.log('Collaborative inventory check result:', result);
    return result;
  }
);
