
// src/ai/flows/analyze-user-spending.ts
'use server';
/**
 * @fileOverview An AI flow for analyzing a user's grocery spending habits and providing financial advice.
 *
 * - analyzeUserSpending - A function that takes purchase history and returns spending analysis and budget suggestions.
 */

import { ai } from '@/ai/genkit';
import {
  AnalyzeUserSpendingInput,
  AnalyzeUserSpendingInputSchema,
  AnalyzeUserSpendingOutput,
  AnalyzeUserSpendingOutputSchema,
} from '../schemas';

export async function analyzeUserSpending(
  input: AnalyzeUserSpendingInput
): Promise<AnalyzeUserSpendingOutput> {
  return analyzeUserSpendingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeUserSpendingPrompt',
  input: { schema: AnalyzeUserSpendingInputSchema },
  output: { schema: AnalyzeUserSpendingOutputSchema },
  prompt: `You are a savvy financial advisor and data analyst for a smart pantry app. Your role is to analyze a user's history of purchased grocery items to find spending patterns and provide actionable advice to help them save money.

You will be given a list of all items the user has purchased, derived from their scanned receipts.

Your tasks are:
1.  **Categorize Spending**: Analyze the user's spending and categorize it into the following specific groups: 'Fresh Produce', 'Protein', 'Dairy', 'Grains', 'Snacks/Processed Foods', and 'Beverages'. Provide a simple percentage breakdown of their spending in these categories. If an item doesn't fit, categorize it as 'Other'.
2.  **Generate a Key Spending Insight**: Based on the overall purchase history, write a concise, one-sentence observation about the user's spending habits. For example, "A significant portion of your budget is allocated to premium brand snacks," or "You consistently purchase organic produce, which contributes to a higher weekly spend."
3.  **Provide 3 Actionable Budget Optimization Suggestions**: Based on the insight, provide three concrete, actionable tips to help the user save money on their next shopping trip. These should be predictive or strategic. For example:
    *   "Tomato prices are often lower on weekends. Consider shifting your produce shopping to Saturday to potentially save."
    *   "You buy a single yogurt every 2-3 days. Buying a larger tub could save you up to 15% over a month."
    *   "Generic brand oats offer similar nutritional value to the premium brand you're buying, which could cut your breakfast costs by 20%."

List of Purchased Items:
{{#each purchaseHistory}}
- {{this.name}} (Price: ₹{{this.price}})
{{/each}}

Return the analysis in the specified JSON format.
`,
});

const analyzeUserSpendingFlow = ai.defineFlow(
  {
    name: 'analyzeUserSpendingFlow',
    inputSchema: AnalyzeUserSpendingInputSchema,
    outputSchema: AnalyzeUserSpendingOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
