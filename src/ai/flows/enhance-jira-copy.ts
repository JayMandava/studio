'use server';
/**
 * @fileOverview Polishes JIRA-facing copy using LLM with guardrails.
 *
 * - enhanceJiraCopy - Generates a concise tagline plus richer BDD phrasing.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhanceJiraCopyInputSchema = z.object({
  requirement: z.string().describe('Full requirement text for context.'),
  testCaseDescription: z.string().optional().describe('Original test case description if available.'),
  target: z.enum(['requirement', 'testcase']).default('testcase').describe('Whether the copy is for the parent requirement or a specific test case.'),
});

export type EnhanceJiraCopyInput = z.infer<typeof EnhanceJiraCopyInputSchema>;

const EnhanceJiraCopyOutputSchema = z.object({
  summaryTagline: z
    .string()
    .describe('<=110 characters, self-contained phrase suitable for a JIRA summary.'),
  given: z
    .string()
    .optional()
    .describe('Context for BDD. Keep grounded in the provided requirement/test case.'),
  when: z
    .string()
    .optional()
    .describe('Action in BDD. Be specific about actors and data when present.'),
  then: z
    .string()
    .optional()
    .describe('Outcome in BDD. Include validation details/observables.'),
  notes: z
    .string()
    .optional()
    .describe('Optional notes/artifacts to make the test execution clearer (logs, screenshots, data checks).'),
});

export type EnhanceJiraCopyOutput = z.infer<typeof EnhanceJiraCopyOutputSchema>;

const prompt = ai.definePrompt({
  name: 'enhanceJiraCopyPrompt',
  input: {schema: EnhanceJiraCopyInputSchema},
  output: {schema: EnhanceJiraCopyOutputSchema},
  prompt: `You polish JIRA-facing copy without inventing new facts.

Inputs:
- requirement: the full requirement text.
- testCaseDescription: optional test case text.
- target: "requirement" or "testcase".

Rules:
- summaryTagline: max 110 characters, present-tense, no trailing ellipsis unless absolutely needed. Make it a clear, human-friendly phrase. If target is "requirement", summarize the requirement. If "testcase", summarize the test intent.
- BDD fields (given/when/then): keep the Given/When/Then structure but add helpful specifics (actors, data, edge conditions, expected artifacts) only when present in the input. Do NOT invent new systems, roles, or data.
- notes: optional, short callouts for evidence or edge considerations; only include if strongly implied by the inputs.
- Ground everything in the provided texts; never add requirements that are not there.
- Prefer crisp language over jargon. Avoid repeating the requirement ID.

Return summaryTagline and, when target is "testcase", fill in given/when/then (and notes if helpful).`,
});

const enhanceJiraCopyFlow = ai.defineFlow(
  {
    name: 'enhanceJiraCopyFlow',
    inputSchema: EnhanceJiraCopyInputSchema,
    outputSchema: EnhanceJiraCopyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

export async function enhanceJiraCopy(input: EnhanceJiraCopyInput): Promise<EnhanceJiraCopyOutput> {
  return enhanceJiraCopyFlow(input);
}
