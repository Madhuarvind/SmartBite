// src/ai/flows/recommend-recipes.ts
'use server';
/**
 * @fileOverview A recipe recommendation AI agent.
 *
 * - recommendRecipes - A function that handles the recipe recommendation process.
 * - RecommendRecipesInput - The input type for the recommendRecipes function.
 * - RecommendRecipesOutput - The return type for the recommendRecipes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendRecipesInputSchema = z.object({
  ingredients: z
    .array(z.string())
    .describe('A list of ingredients the user has available.'),
  dietaryRestrictions: z
    .array(z.string())
    .optional()
    .describe('A list of dietary restrictions the user has.'),
  expiringIngredients: z
    .array(z.string())
    .optional()
    .describe('A list of ingredients that are about to expire.'),
});
export type RecommendRecipesInput = z.infer<typeof RecommendRecipesInputSchema>;

const RecipeSchema = z.object({
  name: z.string().describe('The name of the recipe.'),
  ingredients: z.array(z.string()).describe('The ingredients required for the recipe.'),
  instructions: z.string().describe('The instructions for the recipe.'),
  dietaryInformation: z.array(z.string()).optional().describe('Dietary information about the recipe.'),
});

const RecommendRecipesOutputSchema = z.object({
  recipes: z.array(RecipeSchema).describe('A list of recommended recipes.'),
});
export type RecommendRecipesOutput = z.infer<typeof RecommendRecipesOutputSchema>;

export async function recommendRecipes(input: RecommendRecipesInput): Promise<RecommendRecipesOutput> {
  return recommendRecipesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendRecipesPrompt',
  input: {schema: RecommendRecipesInputSchema},
  output: {schema: RecommendRecipesOutputSchema},
  prompt: `You are a recipe recommendation engine. You will be provided with a list of ingredients the user has available, their dietary restrictions, and a list of ingredients that are about to expire.

You will use this information to recommend recipes to the user. Prioritize recipes that use ingredients that are about to expire.

Ingredients: {{{ingredients}}}
Dietary Restrictions: {{{dietaryRestrictions}}}
Expiring Ingredients: {{{expiringIngredients}}}

Respond in JSON format.
`,
});

const recommendRecipesFlow = ai.defineFlow(
  {
    name: 'recommendRecipesFlow',
    inputSchema: RecommendRecipesInputSchema,
    outputSchema: RecommendRecipesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
