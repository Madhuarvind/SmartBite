// src/ai/flows/invent-recipe.ts
'use server';
/**
 * @fileOverview An AI agent for inventing new recipes from a list of ingredients.
 *
 * - inventRecipe - A function that handles the creative recipe invention process.
 */

import { ai } from '@/ai/genkit';
import {
  InventRecipeInput,
  InventRecipeInputSchema,
  Recipe,
} from '../schemas';
import { generateRecipeMedia } from './generate-recipe-media';

// This is a simplified function to estimate the cost.
// A real-world application would need a more sophisticated way to handle quantities and units.
function calculateEstimatedCost(recipeIngredients: { name: string; quantity: string }[], availableIngredients: { name: string; price?: number }[]): number {
    let totalCost = 0;
    for (const rIngredient of recipeIngredients) {
        const matchingAvailable = availableIngredients.find(aIng => aIng.name.toLowerCase() === rIngredient.name.toLowerCase());
        // For simplicity, we assume the recipe uses the entire quantity of the purchased item.
        // E.g., if you have a 1L milk carton that cost $3, and the recipe needs 200ml, we will add the full $3.
        // This is a major simplification but provides a rough cost estimate.
        if (matchingAvailable && matchingAvailable.price) {
            totalCost += matchingAvailable.price;
        }
    }
    return totalCost;
}

export async function inventRecipe(
  input: InventRecipeInput
): Promise<Recipe> {
  return inventRecipeFlow(input);
}


const inventRecipeFlow = ai.defineFlow(
  {
    name: 'inventRecipeFlow',
    inputSchema: InventRecipeInputSchema,
    outputSchema: Recipe,
  },
  async (input) => {

    const inventRecipePrompt = ai.definePrompt({
      name: 'inventRecipePrompt',
      input: { schema: InventRecipeInputSchema },
      output: { schema: Recipe },
      prompt: `You are a creative and experimental "Creative Chef AI" with a deep understanding of food science. Your task is to invent a completely new, interesting, and delicious recipe using only the provided list of ingredients.

Do not just find a standard recipe. Create something unique and give it an appealing, creative name. For example, if you are given rice, spinach, and curd, you might create a "Spinach Yogurt Rice Bowl with Spiced Dressing."

For the new recipe, you MUST provide:
1.  A unique, appealing name.
2.  A full list of ingredients with specific quantities, using only the provided ingredients.
3.  A detailed nutritional analysis per serving (calories, protein, carbs, fat).
4.  Detailed, step-by-step instructions. For each step, provide a 'step' number and the 'text' for the instruction. Do not include images, audio, or video yet.

Do not include the estimatedCost field in your JSON output. This will be calculated separately.

Available Ingredients:
{{#each ingredients}}
- {{this.name}}
{{/each}}

Respond in the specified JSON format.
`,
    });

    const { output: recipe } = await inventRecipePrompt(input);
    if (!recipe) {
      throw new Error('Creative Chef AI could not invent a recipe.');
    }

    // After generating the recipe, calculate the cost.
    const estimatedCost = calculateEstimatedCost(recipe.ingredients, input.ingredients);
    const recipeWithCost: Recipe = { ...recipe, estimatedCost };

    // Asynchronously generate step images.
    const mediaResult = await generateRecipeMedia({ recipe: recipeWithCost });

    return {
      ...recipeWithCost,
      instructionSteps: mediaResult.instructionSteps,
      audio: undefined,
      video: undefined,
    };
  }
);
