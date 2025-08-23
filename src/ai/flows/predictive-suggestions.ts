// src/ai/flows/predictive-suggestions.ts
'use server';
/**
 * @fileOverview An AI agent for predicting what a user might want to cook next.
 *
 * - predictiveSuggestions - A function that handles the predictive suggestion process.
 */

import { ai } from '@/ai/genkit';
import { generateRecipeAudio } from './generate-recipe-audio';
import { generateRecipeVideo } from './generate-recipe-video';
import { generateRecipeStepImage } from './generate-recipe-step-image';
import {
  PredictiveSuggestionsInput,
  PredictiveSuggestionsInputSchema,
  PredictiveSuggestionsOutput,
  PredictiveSuggestionsOutputSchema,
  InstructionStep,
  Recipe,
} from '../schemas';

export async function predictiveSuggestions(
  input: PredictiveSuggestionsInput
): Promise<PredictiveSuggestionsOutput> {
  return predictiveSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictiveSuggestionsPrompt',
  input: { schema: PredictiveSuggestionsInputSchema },
  output: { schema: PredictiveSuggestionsOutputSchema },
  prompt: `You are a highly intuitive predictive cooking assistant. Your task is to analyze a user's profile, which includes their available ingredients, their past purchase history, and their recent cooking activity, to predict what they might want to cook next.

Generate exactly 4 distinct and creative recipes that reflect a thoughtful prediction based on the user's habits and available items. For example, if they recently bought ingredients for a specific cuisine, you might suggest a recipe from that cuisine. If they often cook quick meals, prioritize simpler recipes.

For each recipe, you MUST provide:
1.  A unique, appealing name.
2.  A full list of ingredients with specific quantities, primarily using the user's available ingredients.
3.  Detailed, step-by-step instructions.
4.  A detailed nutritional analysis per serving (calories, protein, carbs, fat).
5.  A brief, one-sentence rationale for why you are suggesting this specific recipe to the user (e.g., "Since you recently bought avocados, this quick guacamole recipe might be perfect," or "Based on your love for Italian food, here's a classic carbonara.").

User's Available Ingredients:
{{#each availableIngredients}}
- {{this}}
{{/each}}

User's Purchase History:
{{#each purchaseHistory}}
- {{this.name}} (Purchased on {{this.purchaseDate}})
{{/each}}

User's Recent Cooking Activity:
{{#each cookingHistory}}
- Cooked "{{this.recipeName}}" on {{this.date}}
{{/each}}

Respond in the specified JSON format.
`,
});

const predictiveSuggestionsFlow = ai.defineFlow(
  {
    name: 'predictiveSuggestionsFlow',
    inputSchema: PredictiveSuggestionsInputSchema,
    outputSchema: PredictiveSuggestionsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output || !output.recipes) {
      return { recipes: [] };
    }

    // After generating the recipe text, kick off all media generation in parallel.
    const enhancedRecipes: Recipe[] = await Promise.all(
      output.recipes.map(async (recipe: Recipe) => {
        // Generate step images first
        const instructionSteps: InstructionStep[] = await Promise.all(
          (recipe.instructionSteps || []).map(async (step) => {
              try {
                const imageResult = await generateRecipeStepImage({
                  instruction: step.text,
                  recipeName: recipe.name,
                });
                step.image = imageResult;
              } catch (e) {
                console.error(`Image generation failed for step "${step.text}" in recipe ${recipe.name}:`, e);
              }
              return step;
            })
        );
        
        const recipeWithImages: Recipe = { ...recipe, instructionSteps };

        // Generate audio and video in the background
        const mediaPromise = (async () => {
          const fullInstructions = recipeWithImages.instructionSteps?.map(s => s.text).join('\n') || "";
          const [audioResult, videoResult] = await Promise.allSettled([
            generateRecipeAudio({ instructions: fullInstructions }),
            generateRecipeVideo({ recipeName: recipe.name }),
          ]);

          const audio = audioResult.status === 'fulfilled' ? audioResult.value : undefined;
          const video = videoResult.status === 'fulfilled' ? videoResult.value : undefined;

          if (audioResult.status === 'rejected') console.error(`Audio generation failed for ${recipe.name}:`, audioResult.reason);
          if (videoResult.status === 'rejected') console.error(`Video generation failed for ${recipe.name}:`, videoResult.reason);
          
          return { audio, video };
        })();


        // Return the recipe with the media promise
        return {
          ...recipeWithImages,
          audio: undefined,
          video: undefined,
          mediaPromise: mediaPromise as any,
        };
      })
    );

    return { recipes: enhancedRecipes };
  }
);
