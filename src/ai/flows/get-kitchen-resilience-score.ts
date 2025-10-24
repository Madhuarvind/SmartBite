// src/ai/flows/get-kitchen-resilience-score.ts
'use server';
/**
 * @fileOverview An AI flow for calculating a kitchen's resilience score.
 *
 * - getKitchenResilienceScore - A function that analyzes pantry contents and returns a score and suggestions.
 */

import { ai } from '@/ai/genkit';
import {
  GetKitchenResilienceScoreInput,
  GetKitchenResilienceScoreInputSchema,
  GetKitchenResilienceScoreOutput,
  GetKitchenResilienceScoreOutputSchema,
} from '../schemas';

export async function getKitchenResilienceScore(
  input: GetKitchenResilienceScoreInput
): Promise<GetKitchenResilienceScoreOutput> {
  return getKitchenResilienceScoreFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getKitchenResilienceScorePrompt',
  input: { schema: GetKitchenResilienceScoreInputSchema },
  output: { schema: GetKitchenResilienceScoreOutputSchema },
  prompt: `You are a food security and supply chain expert. Your task is to analyze a user's kitchen inventory to calculate a "Kitchen Resilience Score" from 0 to 100. This score represents the kitchen's ability to withstand supply chain disruptions, price spikes, or personal emergencies.

A high score means the kitchen is well-stocked with a diverse range of shelf-stable, foundational ingredients. A low score indicates a heavy reliance on fresh, just-in-time ingredients with little backup.

Consider these factors in your scoring:
1.  **Pantry Essentials (High Impact):** Presence of core staples like flour, rice, pasta, oils, salt, sugar, and basic spices.
2.  **Shelf-Stable Items (High Impact):** Abundance of canned goods (vegetables, beans, fish), dried goods (lentils, beans), and preserved items.
3.  **Diversity (Medium Impact):** A good mix of food groups (carbs, proteins, fats, vegetables, fruits). A pantry with only pasta is not diverse.
4.  **Fresh Item Ratio (Low Impact):** A very high ratio of fresh-only items with short expiry dates lowers the score slightly, as it indicates less of a buffer.

You will be given the user's main inventory (mostly fresh items) and their "pantry essentials" (long-lasting staples).

Your tasks are:
1.  **Calculate a score (0-100):** Based on the criteria above, provide an integer score.
2.  **Provide a key insight:** A single, concise sentence that summarizes the state of their pantry's resilience.
3.  **Provide 3 actionable suggestions:** Give three concrete tips for pantry upgrades that would improve their score. For example, "Add a source of canned protein like tuna or chicken," or "Your pantry could benefit from more shelf-stable grains like quinoa or oats."

Main Inventory:
{{#each inventoryItems}}
- {{this.name}}
{{/each}}

Pantry Essentials:
{{#each pantryEssentials}}
- {{this.name}}
{{/each}}

Return the analysis in the specified JSON format.
`,
});

const getKitchenResilienceScoreFlow = ai.defineFlow(
  {
    name: 'getKitchenResilienceScoreFlow',
    inputSchema: GetKitchenResilienceScoreInputSchema,
    outputSchema: GetKitchenResilienceScoreOutputSchema,
  },
  async (input) => {
    // If both lists are empty, return a default low score.
    if (input.inventoryItems.length === 0 && input.pantryEssentials.length === 0) {
      return {
        resilienceScore: 5,
        keyInsight: "Your pantry is currently empty, which makes it vulnerable to any supply disruptions.",
        suggestions: [
          "Start by stocking up on basic pantry essentials like rice, pasta, and canned beans.",
          "Add a source of long-lasting cooking oil, salt, and sugar.",
          "Consider buying some shelf-stable protein like canned tuna or dried lentils.",
        ],
      };
    }
    
    try {
        const { output } = await prompt(input);
        return output!;
    } catch (error: any) {
        console.error("Error in getKitchenResilienceScoreFlow:", error.message);
        // Handle service unavailable errors gracefully
        if (error.message && (error.message.includes('503') || error.message.includes('overloaded'))) {
            return {
                resilienceScore: 0,
                keyInsight: "The AI analysis is temporarily unavailable as the service is currently overloaded.",
                suggestions: [
                    "Please try refreshing the analysis in a few moments.",
                    "You can still manually check your pantry for shelf-stable items.",
                    "Consider adding some basic essentials like canned goods or grains to improve resilience.",
                ],
            };
        }
        // Re-throw other errors
        throw error;
    }
  }
);
