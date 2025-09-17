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
  Recipe,
} from '../schemas';
import { generateRecipeAudio } from './generate-recipe-audio';
import { generateRecipeVideo } from './generate-recipe-video';
import { generateRecipeStepImage } from './generate-recipe-step-image';

export async function transformRecipe(
  input: TransformRecipeInput
): Promise<Recipe> {
  return transformRecipeFlow(input);
}


const transformRecipeFlow = ai.defineFlow(
  {
    name: 'transformRecipeFlow',
    inputSchema: TransformRecipeInputSchema,
    outputSchema: Recipe,
  },
  async (input) => {

    const transformRecipePrompt = ai.definePrompt({
      name: 'transformRecipePrompt',
      input: { schema: TransformRecipeInputSchema },
      output: { schema: Recipe },
      prompt: `You are an expert chef and culinary psychologist. Your task is to act as an "AI Taste Predictor". You will transform a given recipe based on a user's specific taste preferences and requests.

You must deeply analyze the transformation request and modify the recipe accordingly. This might involve:
- Changing ingredients (e.g., swapping a mild pepper for a hotter one).
- Adjusting quantities (e.g., adding more garlic).
- Adding or changing steps in the instructions.
- Renaming the recipe to reflect its new character (e.g., "Spicy & Garlicky Chicken" instead of "Simple Roast Chicken").

After transforming, you must recalculate the nutritional information for the new version based on the modified ingredients.

For each instruction step, provide a 'step' number and the 'text' for the instruction. Do not include images, audio, or video yet.

Return the entire modified recipe in the specified JSON format.

Original Recipe Name: {{{recipe.name}}}
Original Recipe Ingredients: {{#each recipe.ingredients}}}{{{this.name}}} ({{{this.quantity}}}), {{/each}}
Original Recipe Instructions: {{{recipe.instructionSteps}}}

Transformation Request / Taste Profile: "{{{transformation}}}"

Generate a new, transformed recipe based on this request.
`,
    });

    const { output: recipe } = await transformRecipePrompt(input);
    if (!recipe) {
      throw new Error('Could not transform recipe.');
    }
    
    // Asynchronously generate all media in the background.
    const mediaPromise = (async () => {
       // Prioritize the first image to make the UI feel faster
      const firstImageResult = await generateRecipeStepImage({
        prompt: `A clear, professional, appetizing food photography shot of the following cooking step for a recipe called "${recipe.name}": ${recipe.instructionSteps[0].text}. Focus on the action described.`,
      }).catch(e => {
        console.error(`First image generation failed for ${recipe.name}:`, e);
        return undefined;
      });

      const instructionStepsWithFirstImage = [...recipe.instructionSteps];
      if (firstImageResult) {
        instructionStepsWithFirstImage[0] = {
          ...instructionStepsWithFirstImage[0],
          image: firstImageResult,
        };
      }
      
      const remainingMediaPromise = (async () => {
        const [remainingImagePromises, audioResult, videoResult] = await Promise.all([
          Promise.allSettled(
            recipe.instructionSteps.slice(1).map(step =>
              generateRecipeStepImage({
                prompt: `A clear, professional, appetizing food photography shot of the following cooking step for a recipe called "${recipe.name}": ${step.text}. Focus on the action described.`,
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

        const finalInstructionSteps = [...instructionStepsWithFirstImage];
        recipe.instructionSteps.slice(1).forEach((step, index) => {
            const imageResult = remainingImagePromises[index];
            if (imageResult.status === 'fulfilled') {
                finalInstructionSteps[index + 1] = { ...step, image: imageResult.value };
            } else {
                console.error(`Image generation failed for step "${step.text}" in recipe ${recipe.name}:`, imageResult.reason);
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
      };
    })();

    return {
      ...recipe,
      instructionSteps: recipe.instructionSteps.map(step => ({...step, image: undefined})),
      audio: undefined,
      video: undefined,
      mediaPromise: mediaPromise as any,
    };
  }
);
