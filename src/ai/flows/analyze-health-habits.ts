// src/ai/flows/analyze-health-habits.ts
'use server';
/**
 * @fileOverview An AI flow for analyzing a user's grocery purchase history and providing health insights.
 *
 * - analyzeHealthHabits - A function that takes purchase history and returns health-related analysis.
 */

import { ai } from '@/ai/genkit';
import {
  AnalyzeHealthHabitsInput,
  AnalyzeHealthHabitsInputSchema,
  AnalyzeHealthHabitsOutput,
  AnalyzeHealthHabitsOutputSchema,
} from '../schemas';

export async function analyzeHealthHabits(
  input: AnalyzeHealthHabitsInput
): Promise<AnalyzeHealthHabitsOutput> {
  return analyzeHealthHabitsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeHealthHabitsPrompt',
  input: { schema: AnalyzeHealthHabitsInputSchema },
  output: { schema: AnalyzeHealthHabitsOutputSchema },
  prompt: `You are a nutritionist and data analyst for a smart pantry app. Your role is to analyze a user's history of purchased grocery items and provide actionable insights to help them improve their health.

You will be given a list of all items the user has purchased, derived from their scanned receipts.

Your tasks are:
1.  **Categorize Spending**: Briefly categorize the user's spending into basic groups like 'Fresh Produce', 'Protein', 'Dairy', 'Grains', 'Snacks/Processed Foods', and 'Sugary Drinks'. Provide a simple percentage breakdown of their spending in these categories.
2.  **Generate a Key Health Insight**: Based on the overall purchase history, write a concise, one-sentence observation about the user's dietary habits. For example, "Your shopping cart shows a good balance of protein and fresh vegetables," or "A significant portion of your grocery budget is spent on processed snacks and sugary drinks."
3.  **Provide 3 Actionable Health Suggestions**: Based on the insight, provide three concrete, actionable tips to help the user make healthier choices on their next shopping trip. For example:
    *   "Try swapping potato chips for nuts or seeds for a healthier snack."
    *   "Consider replacing one sugary soda per day with sparkling water and a squeeze of lemon."
    *   "Look for whole-grain bread instead of white bread to increase your fiber intake."

List of Purchased Items:
{{#each purchaseHistory}}
- {{this.name}} (Price: {{this.price}})
{{/each}}

Return the analysis in the specified JSON format.
`,
});

const analyzeHealthHabitsFlow = ai.defineFlow(
  {
    name: 'analyzeHealthHabitsFlow',
    inputSchema: AnalyzeHealthHabitsInputSchema,
    outputSchema: AnalyzeHealthHabitsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);