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
import { generateRecipeAudio } from './generate-recipe-audio';
import { generateRecipeVideo } from './generate-recipe-video';
import { generateRecipeStepImage } from './generate-recipe-step-image';

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

    // Asynchronously generate all media in the background.
    const mediaPromise = (async () => {
      // Prioritize the first image to make the UI feel faster
      const firstImageResult = await generateRecipeStepImage({
        prompt: `A clear, professional, appetizing food photography shot of the following cooking step for a recipe called "${recipeWithCost.name}": ${recipeWithCost.instructionSteps[0].text}. Focus on the action described.`,
      }).catch(e => {
        console.error(`First image generation failed for ${recipeWithCost.name}:`, e);
        return undefined;
      });

      const instructionStepsWithFirstImage = [...recipeWithCost.instructionSteps];
      if (firstImageResult) {
        instructionStepsWithFirstImage[0] = {
          ...instructionStepsWithFirstImage[0],
          image: firstImageResult,
        };
      }
      
      const remainingMediaPromise = (async () => {
        const [remainingImagePromises, audioResult, videoResult] = await Promise.all([
          Promise.allSettled(
            recipeWithCost.instructionSteps.slice(1).map(step =>
              generateRecipeStepImage({
                prompt: `A clear, professional, appetizing food photography shot of the following cooking step for a recipe called "${recipeWithCost.name}": ${step.text}. Focus on the action described.`,
              })
            )
          ),
          generateRecipeAudio({ instructions: recipeWithCost.instructionSteps.map(s => s.text).join('\n') }).catch(e => {
              console.error(`Audio generation failed for ${recipeWithCost.name}:`, e);
              return undefined;
          }),
          generateRecipeVideo({ recipeName: recipeWithCost.name }).catch(e => {
              console.error(`Video generation failed for ${recipeWithCost.name}:`, e);
              return undefined;
          })
        ]);

        const finalInstructionSteps = [...instructionStepsWithFirstImage];
        recipeWithCost.instructionSteps.slice(1).forEach((step, index) => {
            const imageResult = remainingImagePromises[index];
            if (imageResult.status === 'fulfilled') {
                finalInstructionSteps[index + 1] = { ...step, image: imageResult.value };
            } else {
                console.error(`Image generation failed for step "${step.text}" in recipe ${recipeWithCost.name}:`, imageResult.reason);
            }
        });
        
        return {
          instructionSteps: finalInstructionSteps,
          audio: audioResult,
          video: videoResult,
        };
      })();

      return {
          instructionSteps: instructionStepsWithFirstImage,
          mediaPromise: remainingMediaPromise,
      }
    })();

    return {
      ...recipeWithCost,
      instructionSteps: recipeWithCost.instructionSteps.map(step => ({...step, image: undefined})),
      audio: undefined,
      video: undefined,
      mediaPromise: mediaPromise as any,
    };
  }
);
