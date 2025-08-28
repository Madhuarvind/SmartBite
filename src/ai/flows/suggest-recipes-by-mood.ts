// src/ai/flows/suggest-recipes-by-mood.ts
'use server';
/**
 * @fileOverview A recipe recommendation agent that suggests meals based on the user's mood.
 *
 * - suggestRecipesByMood - A function that handles the mood-based recipe recommendation process.
 */

import { ai } from '@/ai/genkit';
import {
  SuggestRecipesByMoodInput,
  SuggestRecipesByMoodInputSchema,
  SuggestRecipesByMoodOutput,
  SuggestRecipesByMoodOutputSchema,
  Recipe,
} from '../schemas';
import { generateRecipeAudio } from './generate-recipe-audio';
import { generateRecipeVideo } from './generate-recipe-video';
import { generateRecipeStepImage } from './generate-recipe-step-image';

export async function suggestRecipesByMood(
  input: SuggestRecipesByMoodInput
): Promise<SuggestRecipesByMoodOutput> {
  return suggestRecipesByMoodFlow(input);
}


const suggestRecipesByMoodFlow = ai.defineFlow(
  {
    name: 'suggestRecipesByMoodFlow',
    inputSchema: SuggestRecipesByMoodInputSchema,
    outputSchema: SuggestRecipesByMoodOutputSchema,
  },
  async (input) => {

    const suggestRecipesByMoodPrompt = ai.definePrompt({
      name: 'suggestRecipesByMoodPrompt',
      input: { schema: SuggestRecipesByMoodInputSchema },
      output: { schema: SuggestRecipesByMoodOutputSchema },
      prompt: `You are a creative chef and culinary psychologist. Your task is to suggest recipes that perfectly match the user's current mood, using ONLY the ingredients they have available.

Analyze the user's stated mood and their available ingredients. Generate exactly 4 distinct and creative recipes.

- If the mood is "tired" or "stressed", suggest quick, comforting, and high-energy meals.
- If the mood is "celebratory" or "happy", suggest festive, impressive, or fun recipes.
- If the mood is "adventurous", suggest exotic or unique dishes.
- If the mood is "sad" or "down", suggest comforting "soul food".
- If the mood is a craving like "sweet", "salty", or "spicy", focus on recipes that satisfy that specific taste profile.

For each recipe, you MUST provide:
1.  A unique, appealing name.
2.  A full list of ingredients with specific quantities, taken only from the user's available list.
3.  A detailed nutritional analysis per serving (calories, protein, carbs, fat).
4.  Detailed, step-by-step instructions. For each step, provide a 'step' number and the 'text' for the instruction. Do not include images yet.

User's current mood: {{{mood}}}
Available Ingredients: {{#each availableIngredients}}{{{this}}}, {{/each}}

Respond in the specified JSON format.
`,
    });

    const { output } = await suggestRecipesByMoodPrompt(input);
    if (!output || !output.recipes) {
      return { recipes: [] };
    }

    // After generating the recipe text, kick off all media generation in parallel.
    const enhancedRecipes: Recipe[] = await Promise.all(
      output.recipes.map(async (recipe: Recipe) => {
        // Asynchronously generate all media in the background.
        const mediaPromise = (async () => {
          const [imagePromises, audioResult, videoResult] = await Promise.all([
            Promise.allSettled(
              recipe.instructionSteps.map(step =>
                generateRecipeStepImage({
                  instruction: step.text,
                  recipeName: recipe.name,
                })
              )
            ),
            generateRecipeAudio({ instructions: recipe.instructionSteps.map(s => s.text).join('\n') }).catch(e => {
                console.error(`Audio generation failed for ${recipe.name}:`, e);
                return undefined;
            }),
            generateRecipeVideo({ recipeName: recipe.name }).catch(e => {
                console.error(`Video generation failed for ${recipe.name}:`, e);
                return undefined;
            })
          ]);

          const instructionStepsWithImages = recipe.instructionSteps.map((step, index) => {
            const imageResult = imagePromises[index];
            if (imageResult.status === 'fulfilled') {
              return { ...step, image: imageResult.value };
            }
            console.error(`Image generation failed for step "${step.text}" in recipe ${recipe.name}:`, imageResult.reason);
            return step;
          });

          return {
            instructionSteps: instructionStepsWithImages,
            audio: audioResult,
            video: videoResult,
          };
        })();
        
        // Return the recipe immediately with placeholders and the media promise
        return {
          ...recipe,
          instructionSteps: recipe.instructionSteps.map(step => ({...step, image: undefined})),
          audio: undefined,
          video: undefined,
          mediaPromise: mediaPromise as any,
        };
      })
    );

    return { recipes: enhancedRecipes };
  }
);
