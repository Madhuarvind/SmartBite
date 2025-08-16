// src/ai/flows/transform-recipe.ts
'use server';
/**
 * @fileOverview An AI agent for transforming recipes based on user requests.
 *
 * - transformRecipe - A function that handles the recipe transformation process.
 */

import { ai } from '@/ai/genkit';
import {
  TransformRecipeInput,
  TransformRecipeInputSchema,
  TransformRecipeOutput,
  TransformRecipeOutputSchema,
} from '../schemas';

export async function transformRecipe(
  input: TransformRecipeInput
): Promise<TransformRecipeOutput> {
  return transformRecipeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'transformRecipePrompt',
  input: { schema: TransformRecipeInputSchema },
  output: { schema: TransformRecipeOutputSchema },
  prompt: `You are an expert chef and recipe developer. Your task is to transform a given recipe based on a user's specific request.

You must modify the recipe's name, ingredients, and instructions to reflect the transformation. You also need to recalculate the nutritional information for the new version.

Return the entire modified recipe in the specified JSON format.

Original Recipe Name: {{{recipe.name}}}
Original Recipe Ingredients: {{#each recipe.ingredients}}{{{this}}}, {{/each}}
Original Recipe Instructions: {{{recipe.instructions}}}

Transformation Request: {{{transformation}}}

Generate a new, transformed recipe based on this request.
`,
});

const transformRecipeFlow = ai.defineFlow(
  {
    name: 'transformRecipeFlow',
    inputSchema: TransformRecipeInputSchema,
    outputSchema: TransformRecipeOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
