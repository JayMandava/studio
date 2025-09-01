'use server';
/**
 * @fileOverview Parses requirements documents and generates comprehensive test cases using GenAI.
 *
 * - parseRequirementsAndGenerateTestCases - A function that handles the parsing and test case generation process.
 * - ParseRequirementsAndGenerateTestCasesInput - The input type for the parseRequirementsAndGenerateTestCases function.
 * - ParseRequirementsAndGenerateTestCasesOutput - The return type for the parseRequirementsAndGenerateTestCases function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ParseRequirementsAndGenerateTestCasesInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "A document (PDF, Word, XML, Markdown) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ParseRequirementsAndGenerateTestCasesInput = z.infer<typeof ParseRequirementsAndGenerateTestCasesInputSchema>;

const ParseRequirementsAndGenerateTestCasesOutputSchema = z.object({
  testCases: z.array(z.string()).describe('A list of generated test cases.'),
});
export type ParseRequirementsAndGenerateTestCasesOutput = z.infer<typeof ParseRequirementsAndGenerateTestCasesOutputSchema>;

export async function parseRequirementsAndGenerateTestCases(
  input: ParseRequirementsAndGenerateTestCasesInput
): Promise<ParseRequirementsAndGenerateTestCasesOutput> {
  return parseRequirementsAndGenerateTestCasesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'parseRequirementsAndGenerateTestCasesPrompt',
  input: {schema: ParseRequirementsAndGenerateTestCasesInputSchema},
  output: {schema: ParseRequirementsAndGenerateTestCasesOutputSchema},
  prompt: `You are an expert in healthcare software testing and regulatory compliance.

You will receive a document containing software requirements. Your task is to parse these requirements and generate a comprehensive set of test cases covering functional, non-functional, and edge cases. Ensure that the test cases are detailed and cover a wide range of scenarios.

The document can be in PDF, Word, XML, or Markdown format.

Document:
{{media url=documentDataUri}}

Consider healthcare-specific terminology and relevant regulations (FDA, IEC 62304, ISO 9001, ISO 13485, ISO 27001, GDPR) when generating the test cases.

Test Cases:
`,
});

const parseRequirementsAndGenerateTestCasesFlow = ai.defineFlow(
  {
    name: 'parseRequirementsAndGenerateTestCasesFlow',
    inputSchema: ParseRequirementsAndGenerateTestCasesInputSchema,
    outputSchema: ParseRequirementsAndGenerateTestCasesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
