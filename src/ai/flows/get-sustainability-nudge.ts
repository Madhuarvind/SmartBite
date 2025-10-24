// src/ai/flows/get-sustainability-nudge.ts
'use server';
/**
 * @fileOverview An AI agent that provides behavioral nudges for sustainable living.
 *
 * - getSustainabilityNudge - A function that returns a personalized, actionable tip.
 */

import { ai } from '@/ai/genkit';
import {
  GetSustainabilityNudgeInput,
  GetSustainabilityNudgeInputSchema,
  GetSustainabilityNudgeOutput,
  GetSustainabilityNudgeOutputSchema,
} from '../schemas';

export async function getSustainabilityNudge(
  input: GetSustainabilityNudgeInput
): Promise<GetSustainabilityNudgeOutput> {
  return getSustainabilityNudgeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'sustainabilityNudgePrompt',
  input: { schema: GetSustainabilityNudgeInputSchema },
  output: { schema: GetSustainabilityNudgeOutputSchema },
  prompt: `You are a warm, encouraging, and insightful behavioral psychologist and sustainability coach for the SmartBite app.
Your goal is to provide a single, concise, and personalized "nudge" to the user to encourage more sustainable habits.

Analyze the user's weekly summary data provided below:
- Weekly Meals Cooked: {{weeklyMealsCooked}}
- Weekly Items Wasted: {{weeklyItemsWasted}}
- Weekly Spending: ₹{{weeklySpending}}
- Current Inventory Count: {{currentInventoryCount}}

Based on this data, generate one single, encouraging, and actionable nudge. Follow these rules:

1.  **Be Positive and Encouraging:** Always start with a positive reinforcement tone. Avoid being preachy or negative.
2.  **Be Data-Driven:** Your nudge must be directly related to the data provided.
3.  **Be Actionable:** The nudge should suggest a simple, achievable action or challenge.
4.  **Be Varied:** Do not always give the same type of advice. Mix it up between celebrating successes, gentle suggestions for improvement, and forward-looking challenges.
5.  **Keep it Concise:** The nudge should be a single, engaging sentence.

Here are some examples of good nudges based on different data scenarios:

*   **If the user cooked a lot:** "Cooking {{weeklyMealsCooked}} meals at home this week is fantastic for your wallet and the planet! Keep up the great work."
*   **If waste was low:** "Only {{weeklyItemsWasted}} items wasted this week? That's amazing! You're becoming a zero-waste champion."
*   **If waste was a bit high:** "You're doing great! To reduce waste further, try the 'Invent a Recipe' feature with one or two items from your inventory this week."
*   **If spending was low:** "Great job keeping your spending to ₹{{weeklySpending}} this week! Planning your meals is clearly paying off."
*   **If inventory is high:** "Your pantry is well-stocked with {{currentInventoryCount}} items! Why not try a 'no-spend' weekend and cook only with what you have?"
*   **If they cooked and didn't waste:** "Wow, {{weeklyMealsCooked}} meals cooked and zero waste! You are a sustainability superstar!"
*   **A general, forward-looking nudge:** "Have you tried the Meal Planner? It's a great way to use up ingredients you already have."

Now, generate the perfect nudge for the current user based on their data.
`,
});

const getSustainabilityNudgeFlow = ai.defineFlow(
  {
    name: 'getSustainabilityNudgeFlow',
    inputSchema: GetSustainabilityNudgeInputSchema,
    outputSchema: GetSustainabilityNudgeOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output?.nudge) {
      throw new Error('Could not generate a sustainability nudge.');
    }
    return output;
  }
);
