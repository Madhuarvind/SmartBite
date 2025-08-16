// src/ai/schemas.ts
/**
 * @fileOverview This file contains all the Zod schemas and TypeScript types for the AI flows.
 * By centralizing them here, we avoid "use server" export errors in the flow files.
 */

import { z } from 'genkit';

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

export const ScanIngredientsOutputSchema = z.object({
  ingredients: z.array(z.string()).describe('A list of ingredients identified in the image.'),
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

export const RecipeSchema = z.object({
  name: z.string().describe('The name of the recipe.'),
  ingredients: z.array(z.string()).describe('The ingredients required for the recipe.'),
  instructions: z.string().describe('The instructions for the recipe.'),
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

const MealSchema = z.object({
    name: z.string().describe('The name of the meal.'),
    // We can add more details like recipe link or nutrition later if needed
}).nullable();

const DailyPlanSchema = z.object({
    breakfast: MealSchema,
    lunch: MealSchema,
    dinner: MealSchema,
});

export const GenerateMealPlanOutputSchema = z.object({
    mealPlan: z.object({
        monday: DailyPlanSchema,
        tuesday: DailyPlanSchema,
        wednesday: DailyPlanSchema,
        thursday: DailyPlanSchema,
        friday: DailyPlanSchema,
        saturday: DailyPlanSchema,
        sunday: DailyPlanSchema,
    }).describe("The 7-day meal plan."),
    shoppingList: z.array(z.string()).describe('A list of ingredients to buy.'),
});
export type GenerateMealPlanOutput = z.infer<typeof GenerateMealPlanOutputSchema>;
