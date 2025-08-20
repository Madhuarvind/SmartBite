
// src/ai/flows/generate-meal-plan.ts
'use server';
/**
 * @fileOverview An AI agent for generating weekly meal plans.
 *
 * - generateMealPlan - A function that handles the meal plan generation process.
 */

import { ai } from '@/ai/genkit';
import {
  GenerateMealPlanInput,
  GenerateMealPlanInputSchema,
  GenerateMealPlanOutput,
  GenerateMealPlanOutputSchema,
} from '../schemas';

export async function generateMealPlan(
  input: GenerateMealPlanInput
): Promise<GenerateMealPlanOutput> {
  return generateMealPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMealPlanPrompt',
  input: { schema: GenerateMealPlanInputSchema },
  output: { schema: GenerateMealPlanOutputSchema },
  prompt: `You are a diet planning assistant. Your task is to generate a 7-day meal plan and a shopping list based on the user's available ingredients, a specific nutritional goal, and any dietary restrictions.

The nutritional goal (e.g., 'high protein', 'vegetarian') should guide the overall theme of the meal plan. The dietary restrictions are hard constraints that must be followed.

Create a plan for Breakfast, Lunch, and Dinner for each day of the week (Monday to Sunday).
For each day, provide an object with 'breakfast', 'lunch', and 'dinner' keys.

After creating the meal plan, generate a shopping list of all the ingredients required for the week's recipes that are NOT in the user's list of available ingredients.
Format the shopping list as an array of strings.

Nutritional Goal: {{{nutritionalGoal}}}
Dietary Restrictions: {{#if dietaryRestrictions}}{{join dietaryRestrictions ", "}}{{else}}None{{/if}}
Available Ingredients: {{#each availableIngredients}}{{{this}}}, {{/each}}

Respond in the specified JSON format.
`,
});

const generateMealPlanFlow = ai.defineFlow(
  {
    name: 'generateMealPlanFlow',
    inputSchema: GenerateMealPlanInputSchema,
    outputSchema: GenerateMealPlanOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
