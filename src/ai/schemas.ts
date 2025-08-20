
// src/ai/schemas.ts
/**
 * @fileOverview This file contains all the Zod schemas and TypeScript types for the AI flows.
 * By centralizing them here, we avoid "use server" export errors in the flow files.
 */

import { z } from 'genkit';

// Schemas for generate-recipe-step-image.ts
export const GenerateRecipeStepImageInputSchema = z.object({
  instruction: z.string().describe('The single recipe instruction to generate an image for.'),
  recipeName: z.string().describe('The name of the recipe this step belongs to.'),
});
export type GenerateRecipeStepImageInput = z.infer<typeof GenerateRecipeStepImageInputSchema>;

export const GenerateRecipeStepImageOutputSchema = z.object({
    imageDataUri: z.string().describe("The generated image as a data URI. Expected format: 'data:image/png;base64,<encoded_data>'."),
});
export type GenerateRecipeStepImageOutput = z.infer<typeof GenerateRecipeStepImageOutputSchema>;


// Schemas for generate-recipe-audio.ts
export const GenerateRecipeAudioInputSchema = z.object({
  instructions: z.string().describe('The recipe instructions to be converted to speech.'),
});
export type GenerateRecipeAudioInput = z.infer<typeof GenerateRecipeAudioInputSchema>;

export const GenerateRecipeAudioOutputSchema = z.object({
  audioDataUri: z.string().describe("The generated audio as a data URI. Expected format: 'data:audio/wav;base64,<encoded_data>'."),
});
export type GenerateRecipeAudioOutput = z.infer<typeof GenerateRecipeAudioOutputSchema>;


// Schemas for generate-recipe-video.ts
export const GenerateRecipeVideoInputSchema = z.object({
    recipeName: z.string().describe('The name of the recipe to generate a video for.'),
});
export type GenerateRecipeVideoInput = z.infer<typeof GenerateRecipeVideoInputSchema>;

export const GenerateRecipeVideoOutputSchema = z.object({
    videoDataUri: z.string().describe("The generated video as a data URI. Expected format: 'data:video/mp4;base64,<encoded_data>'."),
});
export type GenerateRecipeVideoOutput = z.infer<typeof GenerateRecipeVideoOutputSchema>;


// Schemas for scan-ingredients.ts
export const ScanIngredientsInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of ingredients, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ScanIngredientsInput = z.infer<typeof ScanIngredientsInputSchema>;

export const DetectedIngredientSchema = z.object({
    name: z.string().describe('The name of the ingredient.'),
    quantity: z.string().describe('The estimated quantity of the ingredient (e.g., "3", "500g", "1 bottle").'),
});
export type DetectedIngredient = z.infer<typeof DetectedIngredientSchema>;

export const ScanIngredientsOutputSchema = z.object({
  ingredients: z.array(DetectedIngredientSchema).describe('A list of ingredients identified in the image, with quantities.'),
});
export type ScanIngredientsOutput = z.infer<typeof ScanIngredientsOutputSchema>;


// Schemas for suggest-substitutions.ts
export const SuggestSubstitutionsInputSchema = z.object({
  missingIngredient: z
    .string()
    .describe('The ingredient that the user is missing.'),
  availableIngredients: z
    .array(z.string())
    .describe('A list of ingredients the user has available.'),
});
export type SuggestSubstitutionsInput = z.infer<
  typeof SuggestSubstitutionsInputSchema
>;

export const SuggestSubstitutionsOutputSchema = z.object({
  substitutions: z
    .array(z.string())
    .describe('A list of suggested ingredient substitutions.'),
});
export type SuggestSubstitutionsOutput = z.infer<
  typeof SuggestSubstitutionsOutputSchema
>;


// Schemas for recommend-recipes.ts
export const RecommendRecipesInputSchema = z.object({
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

export const InstructionStepSchema = z.object({
    step: z.number().describe('The step number.'),
    text: z.string().describe('The text of the instruction.'),
    image: GenerateRecipeStepImageOutputSchema.optional(),
});
export type InstructionStep = z.infer<typeof InstructionStepSchema>;

export const RecipeSchema = z.object({
  name: z.string().describe('The name of the recipe.'),
  ingredients: z.array(z.string()).describe('The ingredients required for the recipe.'),
  instructions: z.string().describe('The instructions for the recipe, with each step on a new line.'),
  instructionSteps: z.array(InstructionStepSchema).optional().describe('A structured list of recipe instruction steps, each with an optional image.'),
  dietaryInformation: z.array(z.string()).optional().describe('Dietary information about the recipe.'),
  nutrition: z.object({
      calories: z.number().describe('The estimated number of calories per serving.'),
      protein: z.number().describe('The estimated grams of protein per serving.'),
      carbs: z.number().describe('The estimated grams of carbohydrates per serving.'),
      fat: z.number().describe('The estimated grams of fat per serving.'),
  }).describe('The nutritional information for the recipe.'),
  audio: GenerateRecipeAudioOutputSchema.optional(),
  video: GenerateRecipeVideoOutputSchema.optional(),
});
export type Recipe = z.infer<typeof RecipeSchema>;

export const RecommendRecipesOutputSchema = z.object({
  recipes: z.array(RecipeSchema).describe('A list of recommended recipes.'),
});
export type RecommendRecipesOutput = z.infer<typeof RecommendRecipesOutputSchema>;


// Schemas for generate-meal-plan.ts
export const GenerateMealPlanInputSchema = z.object({
    availableIngredients: z.array(z.string()).describe('A list of ingredients the user has available.'),
    dietaryRestrictions: z.array(z.string()).optional().describe('A list of dietary restrictions the user has.'),
    nutritionalGoal: z.string().optional().describe('A specific nutritional goal for the week (e.g., high protein, low carb).')
});
export type GenerateMealPlanInput = z.infer<typeof GenerateMealPlanInputSchema>;

export const GenerateMealPlanOutputSchema = z.object({
    mealPlan: z.string().describe("A string containing the 7-day meal plan, with each meal on a new line formatted as 'Day: Meal Type: Meal Name'."),
    shoppingList: z.string().describe('A comma-separated string of ingredients to buy.'),
});
export type GenerateMealPlanOutput = z.infer<typeof GenerateMealPlanOutputSchema>;


// Schemas for transform-recipe.ts
export const TransformRecipeInputSchema = z.object({
    recipe: RecipeSchema.describe('The original recipe to be transformed.'),
    transformation: z.string().describe('The requested transformation (e.g., "make it vegan", "add a spicy twist").'),
});
export type TransformRecipeInput = z.infer<typeof TransformRecipeInputSchema>;

export const TransformRecipeOutputSchema = RecipeSchema.describe('The new, transformed recipe.');
export type TransformRecipeOutput = z.infer<typeof TransformRecipeOutputSchema>;
