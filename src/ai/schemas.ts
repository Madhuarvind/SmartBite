
// src/ai/schemas.ts
/**
 * @fileOverview This file contains all the Zod schemas and TypeScript types for the AI flows.
 * By centralizing them here, we avoid "use server" export errors in the flow files.
 */

import { z } from 'genkit';

// Schemas for analyze-plate.ts
export const AnalyzePlateInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a cooked meal, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzePlateInput = z.infer<typeof AnalyzePlateInputSchema>;

export const AnalyzePlateOutputSchema = z.object({
    mealName: z.string().describe('The identified name of the meal (e.g., "Spaghetti Bolognese", "Chicken Salad").'),
    nutrition: z.object({
      calories: z.number().describe('The estimated number of calories for the meal.'),
      protein: z.number().describe('The estimated grams of protein for the meal.'),
      carbs: z.number().describe('The estimated grams of carbohydrates for the meal.'),
      fat: z.number().describe('The estimated grams of fat for the meal.'),
    }).describe('The estimated nutritional information for the meal.'),
});
export type AnalyzePlateOutput = z.infer<typeof AnalyzePlateOutputSchema>;


// Schemas for predict-expiry-date.ts
export const PredictExpiryDateInputSchema = z.object({
    ingredientName: z.string().describe('The name of the ingredient, e.g., "Tomatoes", "Chicken Breast".'),
    purchaseDate: z.string().describe('The date the ingredient was purchased, in ISO 8601 format (YYYY-MM-DD).'),
});
export type PredictExpiryDateInput = z.infer<typeof PredictExpiryDateInputSchema>;

export const PredictExpiryDateOutputSchema = z.object({
    expiryDate: z.string().describe('The predicted expiry date for the ingredient, in ISO 8601 format (YYYY-MM-DD).'),
});
export type PredictExpiryDateOutput = z.infer<typeof PredictExpiryDateOutputSchema>;


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
    .optional()
    .describe(
      "A photo of ingredients, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  textQuery: z.string().optional().describe("A natural language query about ingredients, e.g., 'add 2 eggs and a carrot'"),
}).superRefine((data, ctx) => {
    if (!data.photoDataUri && !data.textQuery) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Either photoDataUri or textQuery must be provided.",
        });
    }
    if(data.photoDataUri && data.textQuery) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Provide either photoDataUri or textQuery, not both.",
        });
    }
});
export type ScanIngredientsInput = z.infer<typeof ScanIngredientsInputSchema>;

export const DetectedIngredientSchema = z.object({
    name: z.string().describe('The name of the ingredient.'),
    quantity: z.string().describe('The estimated quantity of the ingredient (e.g., "3", "500g", "1 bottle").'),
    expiryDate: z.string().nullable().describe('The expiry date found on the package in YYYY-MM-DD format, or null if not found.'),
});
export type DetectedIngredient = z.infer<typeof DetectedIngredientSchema>;

export const ScanIngredientsOutputSchema = z.object({
  ingredients: z.array(DetectedIngredientSchema).describe('A list of ingredients identified in the image or text query.'),
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
    .describe('A list of suggested ingredient substitutions with explanations.'),
});
export type SuggestSubstitutionsOutput = z.infer<
  typeof SuggestSubstitutionsOutputSchema
>;


// Schemas for recommend-recipes.ts and other recipe-generating flows
export const InstructionStepSchema = z.object({
    step: z.number().describe('The step number.'),
    text: z.string().describe('The text of the instruction.'),
    image: GenerateRecipeStepImageOutputSchema.optional(),
});
export type InstructionStep = z.infer<typeof InstructionStepSchema>;

const RecipeIngredientSchema = z.object({
  name: z.string().describe('The name of the ingredient.'),
  quantity: z.string().describe('The quantity of the ingredient (e.g., "200g", "1 cup").'),
});
export type RecipeIngredient = z.infer<typeof RecipeIngredientSchema>;

export const RecipeSchema = z.object({
  name: z.string().describe('The name of the recipe.'),
  ingredients: z.array(RecipeIngredientSchema).describe('The ingredients required for the recipe.'),
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

export const RecipeOutputSchema = z.object({
  recipes: z.array(RecipeSchema).describe('A list of recommended recipes.'),
});
export type RecipeOutput = z.infer<typeof RecipeOutputSchema>;


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

export const RecommendRecipesOutputSchema = RecipeOutputSchema;
export type RecommendRecipesOutput = z.infer<typeof RecommendRecipesOutputSchema>;


// Schemas for generate-meal-plan.ts
export const GenerateMealPlanInputSchema = z.object({
    availableIngredients: z.array(z.string()).describe('A list of ingredients the user has available.'),
    dietaryRestrictions: z.array(z.string()).optional().describe('A list of dietary restrictions the user has.'),
    nutritionalGoal: z.string().optional().describe('A specific nutritional goal for the week (e.g., high protein, low carb).')
});
export type GenerateMealPlanInput = z.infer<typeof GenerateMealPlanInputSchema>;

const DayMealPlanSchema = z.object({
    breakfast: z.string().describe('The name of the breakfast meal.'),
    lunch: z.string().describe('The name of the lunch meal.'),
    dinner: z.string().describe('The name of the dinner meal.'),
});

export const GenerateMealPlanOutputSchema = z.object({
    mealPlan: z.object({
        monday: DayMealPlanSchema,
        tuesday: DayMealPlanSchema,
        wednesday: DayMealPlanSchema,
        thursday: DayMealPlanSchema,
        friday: DayMealPlanSchema,
        saturday: DayMealPlanSchema,
        sunday: DayMealPlanSchema,
    }).describe('A 7-day meal plan with breakfast, lunch, and dinner for each day.'),
    shoppingList: z.array(z.string()).describe('An array of ingredients to buy.'),
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


// Schemas for suggest-recipes-by-mood.ts
export const SuggestRecipesByMoodInputSchema = z.object({
  mood: z.string().describe("The user's current mood or feeling (e.g., 'tired', 'celebratory', 'stressed')."),
});
export type SuggestRecipesByMoodInput = z.infer<typeof SuggestRecipesByMoodInputSchema>;

export const SuggestRecipesByMoodOutputSchema = RecipeOutputSchema;
export type SuggestRecipesByMoodOutput = z.infer<typeof SuggestRecipesByMoodOutputSchema>;

// Schemas for scan-receipt.ts
export const ScanReceiptInputSchema = z.object({
  receiptDataUri: z
    .string()
    .describe(
      "A photo of a grocery receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ScanReceiptInput = z.infer<typeof ScanReceiptInputSchema>;

export const ScannedItemSchema = z.object({
    name: z.string().describe('The name of the grocery item.'),
    quantity: z.string().describe('The quantity of the item (e.g., "1", "500g", "2 lbs").'),
    price: z.number().optional().describe('The price of the item as a number.'),
});
export type ScannedItem = z.infer<typeof ScannedItemSchema>;

export const ScanReceiptOutputSchema = z.object({
  items: z.array(ScannedItemSchema).describe('A list of items identified on the receipt.'),
});
export type ScanReceiptOutput = z.infer<typeof ScanReceiptOutputSchema>;

// Schemas for analyze-waste-patterns.ts
const WastedItemSchema = z.object({
  itemName: z.string().describe("The name of the wasted item."),
});
export const AnalyzeWastePatternsInputSchema = z.object({
  wasteHistory: z.array(WastedItemSchema).describe('A list of items the user has marked as wasted.'),
});
export type AnalyzeWastePatternsInput = z.infer<typeof AnalyzeWastePatternsInputSchema>;

export const AnalyzeWastePatternsOutputSchema = z.object({
    mostWastedItem: z.string().describe('The single item that is most frequently wasted.'),
    keyInsight: z.string().describe('A concise, one-sentence insight into the user\'s waste patterns.'),
    suggestions: z.array(z.string()).describe('Three actionable suggestions to help the user reduce waste.'),
});
export type AnalyzeWastePatternsOutput = z.infer<typeof AnalyzeWastePatternsOutputSchema>;


// Schemas for identify-and-check-item.ts
export const IdentifyAndCheckItemInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a grocery item, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  userId: z.string().describe('The unique ID of the user asking the question.'),
});
export type IdentifyAndCheckItemInput = z.infer<typeof IdentifyAndCheckItemInputSchema>;

export const IdentifyAndCheckItemOutputSchema = z.object({
  response: z.string().describe('The AI\'s helpful response to the user\'s query.'),
});
export type IdentifyAndCheckItemOutput = z.infer<typeof IdentifyAndCheckItemOutputSchema>;


// Schemas for ask-pantry-assistant.ts
export const AskPantryAssistantInputSchema = z.object({
  query: z.string().describe('The user\'s question about their pantry.'),
  userId: z.string().describe('The unique ID of the user asking the question.'),
});
export type AskPantryAssistantInput = z.infer<typeof AskPantryAssistantInputSchema>;

export const AskPantryAssistantOutputSchema = z.object({
  answer: z.string().describe('The AI\'s helpful response to the user\'s query.'),
});
export type AskPantryAssistantOutput = z.infer<typeof AskPantryAssistantOutputSchema>;

// Schemas for calculate-carbon-footprint.ts
export const CalculateCarbonFootprintInputSchema = z.object({
  items: z.array(ScannedItemSchema).describe('A list of items scanned from a grocery receipt.'),
});
export type CalculateCarbonFootprintInput = z.infer<typeof CalculateCarbonFootprintInputSchema>;

export const CalculateCarbonFootprintOutputSchema = z.object({
  totalCarbonFootprint: z.number().describe('The total estimated carbon footprint for the items, in kg CO2e.'),
  suggestions: z.array(z.string()).describe('An array of three actionable, eco-friendly suggestions.'),
});
export type CalculateCarbonFootprintOutput = z.infer<typeof CalculateCarbonFootprintOutputSchema>;


// Schemas for analyze-health-habits.ts
const PurchasedItemSchema = z.object({
  name: z.string().describe("The name of the purchased item."),
  price: z.number().optional().describe("The price of the item."),
});
export const AnalyzeHealthHabitsInputSchema = z.object({
  purchaseHistory: z.array(PurchasedItemSchema).describe('A list of all items the user has purchased.'),
});
export type AnalyzeHealthHabitsInput = z.infer<typeof AnalyzeHealthHabitsInputSchema>;

export const AnalyzeHealthHabitsOutputSchema = z.object({
    spendingBreakdown: z.array(z.object({
        category: z.string().describe("The spending category (e.g., 'Fresh Produce', 'Snacks/Processed Foods')."),
        percentage: z.number().describe("The percentage of total spending for this category."),
    })).describe("A breakdown of spending by food category."),
    keyInsight: z.string().describe('A concise, one-sentence insight into the user\'s dietary habits.'),
    suggestions: z.array(z.string()).describe('Three actionable suggestions to help the user make healthier choices.'),
});
export type AnalyzeHealthHabitsOutput = z.infer<typeof AnalyzeHealthHabitsOutputSchema>;
