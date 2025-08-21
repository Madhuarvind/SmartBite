// src/ai/flows/predict-facial-mood.ts
'use server';
/**
 * @fileOverview An AI flow for predicting a user's mood from a facial expression.
 *
 * - predictFacialMood - A function that takes an image of a face and returns a predicted mood.
 */

import { ai } from '@/ai/genkit';
import {
  PredictFacialMoodInput,
  PredictFacialMoodInputSchema,
  PredictFacialMoodOutput,
  PredictFacialMoodOutputSchema,
} from '../schemas';

export async function predictFacialMood(
  input: PredictFacialMoodInput
): Promise<PredictFacialMoodOutput> {
  return predictFacialMoodFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictFacialMoodPrompt',
  input: { schema: PredictFacialMoodInputSchema },
  output: { schema: PredictFacialMoodOutputSchema },
  prompt: `You are an expert at reading human emotions from facial expressions. Analyze the provided photo of a person's face. 

Your task is to identify the dominant emotion or mood conveyed by their expression. The output should be a single, simple word or short phrase that could be used to find recipes. Examples: "Happy", "Tired", "Stressed", "Sad", "Relaxed", "Celebratory", "Content".

Do not describe the person or the photo. Only return the predicted mood.

Photo: {{media url=photoDataUri}}
`,
});

const predictFacialMoodFlow = ai.defineFlow(
  {
    name: 'predictFacialMoodFlow',
    inputSchema: PredictFacialMoodInputSchema,
    outputSchema: PredictFacialMoodOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
