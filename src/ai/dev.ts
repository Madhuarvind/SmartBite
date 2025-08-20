
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
