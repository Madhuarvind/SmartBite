
import { config } from 'dotenv';
config();

// Import all flows from the central index file - this is no longer needed
// as Next.js will handle loading flows on-demand.
// import '@/ai/index';

import './flows/analyze-health-habits';
import './flows/analyze-plate';
import './flows/analyze-user-spending';
import './flows/analyze-waste-patterns';
import './flows/ask-pantry-assistant';
import './flows/calculate-carbon-footprint';
import './flows/deduct-ingredients';
import './flows/find-recipe-from-meal';
import './flows/generate-image';
import './flows/generate-meal-plan';
import './flows/generate-recipe-audio';
import './flows/generate-recipe-step-image';
import './flows/generate-recipe-video';
import './flows/identify-and-check-item';
import './flows/invent-recipe';
import './flows/predict-expiry-date';
import './flows/predict-facial-mood';
import './flows/predictive-suggestions';
import './flows/recommend-recipes';
import './flows/scan-ingredients';
import './flows/scan-receipt';
import './flows/suggest-recipes-by-mood';
import './flows/suggest-substitutions';
import './flows/transform-recipe';
import './flows/generate-recipe-media';
