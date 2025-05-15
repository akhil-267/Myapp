'use server';
/**
 * @fileOverview Identifies a medicine from an image and provides its uses.
 *
 * - identifyMedicine - A function that handles the medicine identification process.
 * - IdentifyMedicineInput - The input type for the identifyMedicine function.
 * - IdentifyMedicineOutput - The return type for the identifyMedicine function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IdentifyMedicineInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a tablet sheet, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  language: z.string().describe('The language in which to provide the medicine uses.'),
});
export type IdentifyMedicineInput = z.infer<typeof IdentifyMedicineInputSchema>;

const IdentifyMedicineOutputSchema = z.object({
  medicineName: z.string().describe('The name of the identified medicine.'),
  uses: z.string().describe('The uses of the identified medicine in the specified language.'),
});
export type IdentifyMedicineOutput = z.infer<typeof IdentifyMedicineOutputSchema>;

export async function identifyMedicine(input: IdentifyMedicineInput): Promise<IdentifyMedicineOutput> {
  return identifyMedicineFlow(input);
}

const prompt = ai.definePrompt({
  name: 'identifyMedicinePrompt',
  input: {schema: IdentifyMedicineInputSchema},
  output: {schema: IdentifyMedicineOutputSchema},
  prompt: `You are an expert pharmacist. You will identify the medicine from the image and provide its uses in the specified language.

  The user will upload a picture of the medicine, which you will identify and state the name.

  You will also provide the uses of the medicine in the following language: {{{language}}}.

  Image: {{media url=photoDataUri}}
  Language: {{{language}}}
  `, 
});

const identifyMedicineFlow = ai.defineFlow(
  {
    name: 'identifyMedicineFlow',
    inputSchema: IdentifyMedicineInputSchema,
    outputSchema: IdentifyMedicineOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
