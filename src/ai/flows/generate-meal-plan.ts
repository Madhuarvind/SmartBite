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
  prompt: `You are a diet planning assistant. Your task is to generate a 7-day meal plan based on the user's available ingredients, dietary restrictions, and a specific nutritional goal.

You must create a plan for Breakfast, Lunch, and Dinner for each day of the week (Monday to Sunday).

After creating the meal plan, generate a shopping list of all the ingredients required for the week's recipes that are NOT in the user's list of available ingredients.

Available Ingredients: {{{availableIngredients}}}
Dietary Restrictions: {{{dietaryRestrictions}}}
Nutritional Goal: {{{nutritionalGoal}}}

Respond in JSON format.
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
