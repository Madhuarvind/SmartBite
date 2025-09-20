
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
import { predictExpiryDate } from '@/ai/flows/predict-expiry-date';

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

Your task is to extract all the food items listed on the receipt. For each item, you must identify:
- Its name
- The quantity purchased
- The price
- Whether it is a fresh product that requires an expiry date prediction (e.g., fresh produce, meat, dairy). Packaged goods with long shelf lives (like cans, jars, dry pasta) do not need prediction.

- Ignore non-food items, taxes, totals, store information, and other metadata.
- If a quantity is not explicitly mentioned, assume it is "1".
- Standardize item names (e.g., "LG ORG MILK" should become "Organic Milk").
- Extract the price for each item as a number, removing any currency symbols.
- Set expiryDate to null. It will be predicted later.

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
    if (!output || !output.items) {
      return { items: [] };
    }

    // After scanning, predict expiry dates for fresh items
    const itemsWithPredictions = await Promise.all(
      output.items.map(async (item) => {
        if (item.isFresh) {
          try {
            const prediction = await predictExpiryDate({
              ingredientName: item.name,
              purchaseDate: new Date().toISOString().split('T')[0],
            });
            return { ...item, expiryDate: prediction.expiryDate };
          } catch (e) {
            console.error(`Could not predict expiry for ${item.name}`, e);
            // If prediction fails, fall back to default
          }
        }
        
        // For non-fresh items or failed predictions, set a default expiry date of 30 days from now
        const defaultExpiry = new Date();
        defaultExpiry.setDate(defaultExpiry.getDate() + 30);
        return { ...item, expiryDate: defaultExpiry.toISOString().split('T')[0] };
      })
    );

    return { items: itemsWithPredictions };
  }
);


