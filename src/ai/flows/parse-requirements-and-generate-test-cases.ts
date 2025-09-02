'use server';
/**
 * @fileOverview Parses requirements documents and generates comprehensive test cases using GenAI,
 * mapping each test case to a specific requirement and relevant compliance standards.
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
      "A document (PDF, XML, Markdown) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ParseRequirementsAndGenerateTestCasesInput = z.infer<typeof ParseRequirementsAndGenerateTestCasesInputSchema>;

const TestCaseSchema = z.object({
  description: z.string().describe('The detailed description of the test case.'),
  compliance: z.array(z.string()).describe('A list of compliance standards this test case helps to verify (e.g., "FDA 21 CFR Part 11", "GDPR").'),
});

const RequirementTestCaseMappingSchema = z.object({
  requirement: z.string().describe('A single, specific requirement extracted from the document.'),
  testCases: z.array(TestCaseSchema).describe('An array of test cases generated specifically for this requirement, each with compliance mapping.'),
});

const ParseRequirementsAndGenerateTestCasesOutputSchema = z.object({
  isHealthcareDomain: z
    .boolean()
    .describe('Whether the provided document is related to the healthcare domain.'),
  requirementTestCases: z.array(RequirementTestCaseMappingSchema).optional().describe('A list of requirements, each with its corresponding test cases and compliance mappings.'),
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

First, analyze the provided document to determine if it belongs to the healthcare domain.
If it is not, set 'isHealthcareDomain' to false and do not proceed.
If the document is related to the healthcare domain, set 'isHealthcareDomain' to true and then proceed with the following:

Your task is to parse the document and create a Requirements Traceability Matrix (RTM).
1.  Identify each individual functional or non-functional requirement from the document.
2.  For each identified requirement, generate a comprehensive set of test cases covering functional, non-functional, and edge cases.
3.  For each test case, identify and map it to all relevant regulatory standards from the list below. A single test case can map to multiple standards.
    -   FDA 21 CFR
    -   IEC 62304
    -   ISO 13485
    -   GDPR
    -   ISO 27001
    -   ISO 9001
4.  Structure the output as an array of objects. Each object must contain a 'requirement' string and a 'testCases' array. Each item in the 'testCases' array must be an object with a 'description' and a 'compliance' array of strings.

The document can be in PDF, XML, or Markdown format.

Document:
{{media url=documentDataUri}}

Prioritize creating high-quality, robust test cases over a large quantity of simple ones.

Output the results in the 'requirementTestCases' field.
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
