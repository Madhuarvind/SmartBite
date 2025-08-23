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
  RecipeSchema,
} from '../schemas';
import { generateRecipeAudio } from './generate-recipe-audio';
import { generateRecipeVideo } from './generate-recipe-video';
import { generateRecipeStepImage } from './generate-recipe-step-image';
import type { InstructionStep } from '../schemas';

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

const prompt = ai.definePrompt({
  name: 'inventRecipePrompt',
  input: { schema: InventRecipeInputSchema },
  output: { schema: RecipeSchema },
  prompt: `You are a creative and experimental "Creative Chef AI" with a deep understanding of food science. Your task is to invent a completely new, interesting, and delicious recipe using only the provided list of ingredients.

Do not just find a standard recipe. Create something unique and give it an appealing, creative name. For example, if you are given rice, spinach, and curd, you might create a "Spinach Yogurt Rice Bowl with Spiced Dressing."

For the new recipe, you MUST provide:
1.  A unique, appealing name.
2.  A full list of ingredients with specific quantities, using only the provided ingredients.
3.  Detailed, step-by-step instructions.
4.  A detailed nutritional analysis per serving (calories, protein, carbs, fat).

Do not include the estimatedCost field in your JSON output. This will be calculated separately.

Available Ingredients:
{{#each ingredients}}
- {{this.name}}
{{/each}}

Respond in the specified JSON format.
`,
});

const inventRecipeFlow = ai.defineFlow(
  {
    name: 'inventRecipeFlow',
    inputSchema: InventRecipeInputSchema,
    outputSchema: RecipeSchema,
  },
  async (input) => {
    const { output: recipe } = await prompt(input);
    if (!recipe) {
      throw new Error('Creative Chef AI could not invent a recipe.');
    }

    // After generating the recipe, calculate the cost.
    const estimatedCost = calculateEstimatedCost(recipe.ingredients, input.ingredients);
    const recipeWithCost: Recipe = { ...recipe, estimatedCost };

    // Generate step images first
    const instructionSteps: InstructionStep[] = await Promise.all(
      (recipeWithCost.instructionSteps || []).map(async (step) => {
        try {
          const imageResult = await generateRecipeStepImage({
            instruction: step.text,
            recipeName: recipeWithCost.name,
          });
          step.image = imageResult;
        } catch (e) {
          console.error(`Image generation failed for step "${step.text}" in recipe ${recipeWithCost.name}:`, e);
        }
        return step;
      })
    );
    
    const recipeWithImagesAndCost: Recipe = { ...recipeWithCost, instructionSteps };

    // Generate audio and video in the background
    const mediaPromise = (async () => {
        const fullInstructions = recipeWithImagesAndCost.instructionSteps?.map(s => s.text).join('\n') || "";
        const [audioResult, videoResult] = await Promise.allSettled([
            generateRecipeAudio({ instructions: fullInstructions }),
            generateRecipeVideo({ recipeName: recipeWithImagesAndCost.name })
        ]);
        const audio = audioResult.status === 'fulfilled' ? audioResult.value : undefined;
        const video = videoResult.status === 'fulfilled' ? videoResult.value : undefined;
        if (audioResult.status === 'rejected') console.error(`Audio generation failed for invented recipe ${recipeWithImagesAndCost.name}:`, audioResult.reason);
        if (videoResult.status === 'rejected') console.error(`Video generation failed for invented recipe ${recipeWithImagesAndCost.name}:`, videoResult.reason);
        return { audio, video };
    })();

    return {
      ...recipeWithImagesAndCost,
      audio: undefined,
      video: undefined,
      mediaPromise: mediaPromise as any,
    };
  }
);
