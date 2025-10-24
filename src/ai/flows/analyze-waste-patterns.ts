// src/ai/flows/analyze-waste-patterns.ts
'use server';
/**
 * @fileOverview An AI flow for analyzing a user's food waste history and providing suggestions.
 *
 * - analyzeWastePatterns - A function that takes waste history and returns insights.
 */

import { ai } from '@/ai/genkit';
import {
  AnalyzeWastePatternsInput,
  AnalyzeWastePatternsInputSchema,
  AnalyzeWastePatternsOutput,
  AnalyzeWastePatternsOutputSchema,
} from '../schemas';

export async function analyzeWastePatterns(
  input: AnalyzeWastePatternsInput
): Promise<AnalyzeWastePatternsOutput> {
  return analyzeWastePatternsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeWastePatternsPrompt',
  input: { schema: AnalyzeWastePatternsInputSchema },
  output: { schema: AnalyzeWastePatternsOutputSchema },
  prompt: `You are a sustainability coach and data analyst for a smart pantry app. Your role is to analyze a user's history of wasted food items and provide actionable insights to help them reduce waste.

You will be given a list of items the user has marked as wasted.

Your tasks are:
1.  **Identify the most frequently wasted item**: Find the single item that appears most often in the waste history.
2.  **Generate a key insight**: Based on the overall waste history, write a concise, one-sentence observation about the user's habits. This should infer a causal link. For example, "Buying leafy greens in large quantities seems to be leading to spoilage before they can be used," or "Dairy products are frequently expiring, suggesting they are being bought too far in advance of their use."
3.  **Provide 3 actionable suggestions**: Based on the insight, provide three concrete, actionable tips to help the user reduce waste. These should be specific and easy to implement. For example:
    *   "Try buying spinach in smaller quantities more frequently."
    *   "Freeze half of your bread loaf immediately after purchase."
    *   "Plan a meal that uses milk on the day you buy it."

List of Wasted Items:
{{#each wasteHistory}}
- {{this.itemName}}
{{/each}}

Return the analysis in the specified JSON format.
`,
});

const analyzeWastePatternsFlow = ai.defineFlow(
  {
    name: 'analyzeWastePatternsFlow',
    inputSchema: AnalyzeWastePatternsInputSchema,
    outputSchema: AnalyzeWastePatternsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
