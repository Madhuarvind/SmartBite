
import { config } from 'dotenv';
config();

import '@/ai/flows/scan-ingredients.ts';
import '@/ai/flows/recommend-recipes.ts';
import '@/ai/flows/suggest-substitutions.ts';
import '@/ai/flows/generate-recipe-audio.ts';
import '@/ai/flows/generate-recipe-video.ts';
import '@/ai/flows/generate-meal-plan.ts';
import '@/ai/flows/transform-recipe.ts';
import '@/ai/flows/generate-recipe-step-image.ts';
import '@/ai/flows/predict-expiry-date.ts';
import '@/ai/flows/analyze-plate.ts';
import '@/ai/flows/suggest-recipes-by-mood.ts';
import '@/ai/flows/scan-receipt.ts';
import '@/ai/flows/analyze-waste-patterns.ts';
import '@/ai/flows/identify-and-check-item.ts';
import '@/ai/flows/ask-pantry-assistant.ts';
import '@/ai/flows/calculate-carbon-footprint.ts';
import '@/ai/flows/analyze-health-habits.ts';
import '@/ai/flows/predictive-suggestions.ts';
import '@/ai/flows/predict-facial-mood.ts';
