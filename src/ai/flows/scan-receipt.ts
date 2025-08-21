// src/ai/flows/scan-receipt.ts
'use server';
/**
 * @fileOverview An AI flow for scanning and extracting items from a grocery receipt.
 *
 * - scanReceipt - A function that takes a receipt image and returns a list of items.
 */

import { ai } from '@/ai/genkit';
import {
  ScanReceiptInputSchema,
  ScanReceiptInput,
  ScanReceiptOutputSchema,
  ScanReceiptOutput,
} from '../schemas';

export async function scanReceipt(
  input: ScanReceiptInput
): Promise<ScanReceiptOutput> {
  return scanReceiptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'scanReceiptPrompt',
  input: { schema: ScanReceiptInputSchema },
  output: { schema: ScanReceiptOutputSchema },
  prompt: `You are an expert OCR and data extraction AI. Analyze the provided image of a grocery store receipt.

Your task is to extract all the food items listed on the receipt. For each item, you must identify its name, the quantity purchased, and the price.

- Ignore non-food items, taxes, totals, store information, and other metadata.
- If a quantity is not explicitly mentioned, assume it is "1".
- Standardize item names (e.g., "LG ORG MILK" should become "Organic Milk").
- Extract the price for each item as a number, removing any currency symbols.

Return the result as a JSON object containing an array of the extracted items.

Receipt Photo: {{media url=receiptDataUri}}
  `,
});

const scanReceiptFlow = ai.defineFlow(
  {
    name: 'scanReceiptFlow',
    inputSchema: ScanReceiptInputSchema,
    outputSchema: ScanReceiptOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
