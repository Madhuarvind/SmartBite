// src/ai/flows/suggest-recipes-by-mood.ts
'use server';
/**
 * @fileOverview A recipe recommendation agent that suggests meals based on the user's mood.
 *
 * - suggestRecipesByMood - A function that handles the mood-based recipe recommendation process.
 */

import { ai } from '@/ai/genkit';
import { generateRecipeAudio } from './generate-recipe-audio';
import { generateRecipeVideo } from './generate-recipe-video';
import { generateRecipeStepImage } from './generate-recipe-step-image';
import {
  SuggestRecipesByMoodInput,
  SuggestRecipesByMoodInputSchema,
  SuggestRecipesByMoodOutput,
  SuggestRecipesByMoodOutputSchema,
  InstructionStep,
  Recipe,
} from '../schemas';

export async function suggestRecipesByMood(
  input: SuggestRecipesByMoodInput
): Promise<SuggestRecipesByMoodOutput> {
  return suggestRecipesByMoodFlow(input);
}

const prompt = ai.definePrompt({
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
1. A unique, appealing name.
2. A full list of ingredients with specific quantities, taken only from the user's available list.
3. Detailed, step-by-step instructions.
4. A detailed nutritional analysis per serving (calories, protein, carbs, fat).

User's current mood: {{{mood}}}
Available Ingredients: {{#each availableIngredients}}{{{this}}}, {{/each}}

Respond in the specified JSON format.
`,
});

const suggestRecipesByMoodFlow = ai.defineFlow(
  {
    name: 'suggestRecipesByMoodFlow',
    inputSchema: SuggestRecipesByMoodInputSchema,
    outputSchema: SuggestRecipesByMoodOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output || !output.recipes) {
      return { recipes: [] };
    }

    // After generating the recipe text, kick off all media generation in parallel.
    const enhancedRecipes: Recipe[] = await Promise.all(
      output.recipes.map(async (recipe: Recipe) => {
        // Generate step images first as they are quicker
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
