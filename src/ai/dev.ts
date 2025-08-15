import { config } from 'dotenv';
config();

import '@/ai/flows/scan-ingredients.ts';
import '@/ai/flows/recommend-recipes.ts';
import '@/ai/flows/suggest-substitutions.ts';