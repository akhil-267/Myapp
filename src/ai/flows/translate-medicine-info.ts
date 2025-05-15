// This file is machine-generated - edit at your own risk.

'use server';

/**
 * @fileOverview Medicine information translation flow.
 *
 * This flow translates the medicine name and uses into the user's preferred language.
 *
 * - translateMedicineInfo - A function that handles the medicine information translation process.
 * - TranslateMedicineInfoInput - The input type for the translateMedicineInfo function.
 * - TranslateMedicineInfoOutput - The return type for the translateMedicineInfo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateMedicineInfoInputSchema = z.object({
  medicineName: z.string().describe('The name of the medicine.'),
  uses: z.string().describe('The uses of the medicine.'),
  language: z.string().describe('The language to translate the medicine information to.'),
});
export type TranslateMedicineInfoInput = z.infer<typeof TranslateMedicineInfoInputSchema>;

const TranslateMedicineInfoOutputSchema = z.object({
  translatedMedicineName: z.string().describe('The translated name of the medicine.'),
  translatedUses: z.string().describe('The translated uses of the medicine.'),
});
export type TranslateMedicineInfoOutput = z.infer<typeof TranslateMedicineInfoOutputSchema>;

export async function translateMedicineInfo(input: TranslateMedicineInfoInput): Promise<TranslateMedicineInfoOutput> {
  return translateMedicineInfoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'translateMedicineInfoPrompt',
  input: {schema: TranslateMedicineInfoInputSchema},
  output: {schema: TranslateMedicineInfoOutputSchema},
  prompt: `You are a translation expert. Translate the medicine name and its uses to the specified language.

Medicine Name: {{{medicineName}}}
Uses: {{{uses}}}
Language: {{{language}}}

Ensure that the translated name and uses are medically accurate and appropriate for the target audience.

Output in JSON format.
`,
});

const translateMedicineInfoFlow = ai.defineFlow(
  {
    name: 'translateMedicineInfoFlow',
    inputSchema: TranslateMedicineInfoInputSchema,
    outputSchema: TranslateMedicineInfoOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
