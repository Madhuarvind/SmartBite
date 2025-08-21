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
  prompt: `You are a creative chef and culinary psychologist. Your task is to suggest recipes that perfectly match the user's current mood.

Analyze the user's stated mood and generate exactly 4 distinct and creative recipes that would complement or improve that feeling.

- If the mood is "tired" or "stressed", suggest quick, comforting, and high-energy meals.
- If the mood is "celebratory" or "happy", suggest festive, impressive, or fun recipes.
- If the mood is "adventurous", suggest exotic or unique dishes.
- If the mood is "sad" or "down", suggest comforting "soul food".

For each recipe, you MUST provide:
1. A unique, appealing name.
2. A full list of ingredients with specific quantities.
3. Detailed, step-by-step instructions as a single string, with each step separated by a newline character.
4. A detailed nutritional analysis per serving (calories, protein, carbs, fat).

User's current mood: {{{mood}}}

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
    const enhancedRecipes = await Promise.all(
      output.recipes.map(async (recipe: Recipe) => {
        // Generate step images first as they are quicker
        const instructionSteps: InstructionStep[] = await Promise.all(
          recipe.instructions
            .split('\n')
            .filter((line) => line.trim().length > 0)
            .map(async (instructionText, index) => {
              const step: InstructionStep = {
                step: index + 1,
                text: instructionText.replace(/^\d+\.\s*/, ''),
              };
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
        
        const recipeWithImages = { ...recipe, instructionSteps };

        // Generate audio and video in the background
        const mediaPromise = Promise.allSettled([
          generateRecipeAudio({ instructions: recipe.instructions }),
          generateRecipeVideo({ recipeName: recipe.name }),
        ]).then(([audioResult, videoResult]) => {
          const audio = audioResult.status === 'fulfilled' ? audioResult.value : undefined;
          const video = videoResult.status === 'fulfilled' ? videoResult.value : undefined;

          if (audioResult.status === 'rejected') console.error(`Audio generation failed for ${recipe.name}:`, audioResult.reason);
          if (videoResult.status === 'rejected') console.error(`Video generation failed for ${recipe.name}:`, videoResult.reason);
          
          return { ...recipeWithImages, audio, video };
        });

        // Return the recipe with the media promise
        return {
          ...recipeWithImages,
          audio: undefined,
          video: undefined,
          ...await mediaPromise
        };
      })
    );

    return { recipes: enhancedRecipes };
  }
);
