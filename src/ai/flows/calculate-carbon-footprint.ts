// src/ai/flows/calculate-carbon-footprint.ts
'use server';
/**
 * @fileOverview An AI flow for estimating the carbon footprint of a list of groceries.
 *
 * - calculateCarbonFootprint - A function that takes a list of items and returns a carbon score and suggestions.
 */

import { ai } from '@/ai/genkit';
import {
  CalculateCarbonFootprintInput,
  CalculateCarbonFootprintInputSchema,
  CalculateCarbonFootprintOutput,
  CalculateCarbonFootprintOutputSchema,
} from '../schemas';

export async function calculateCarbonFootprint(
  input: CalculateCarbonFootprintInput
): Promise<CalculateCarbonFootprintOutput> {
  return calculateCarbonFootprintFlow(input);
}

const prompt = ai.definePrompt({
  name: 'calculateCarbonFootprintPrompt',
  input: { schema: CalculateCarbonFootprintInputSchema },
  output: { schema: CalculateCarbonFootprintOutputSchema },
  prompt: `You are an expert environmental scientist specializing in food production life cycle analysis. 
  
You will be given a list of grocery items. Your tasks are:
1.  **Estimate the total carbon footprint**: For the entire list of items, estimate the total carbon footprint in kilograms of CO2 equivalent (kg CO2e). Use average global values for your estimation. Sum up the values for a single total.
2.  **Provide 3 actionable, eco-friendly suggestions**: Based on the items provided, generate three distinct and actionable suggestions for how the user could reduce their carbon footprint on their next shopping trip. These suggestions should be general and not assume the user's location. For example, "Consider swapping beef for lentils, which have a significantly lower carbon footprint," or "Buying seasonal, loose vegetables can reduce packaging waste and emissions."

List of purchased items:
{{#each items}}
- {{this.name}} (Quantity: {{this.quantity}})
{{/each}}

Return the result in the specified JSON format.
`,
});

const calculateCarbonFootprintFlow = ai.defineFlow(
  {
    name: 'calculateCarbonFootprintFlow',
    inputSchema: CalculateCarbonFootprintInputSchema,
    outputSchema: CalculateCarbonFootprintOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
