'use server';
/**
 * @fileOverview Performs a lightweight compliance gap analysis between current requirements/test cases and past test runs.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RequirementTestCaseSchema = z.object({
  requirement: z.string(),
  testCases: z.array(
    z.object({
      description: z.string(),
      compliance: z.array(z.string()),
    })
  ),
});

const PastRunRecordSchema = z.object({
  requirementId: z.string().optional(),
  requirementDescription: z.string().optional(),
  testCaseId: z.string().optional(),
  compliance: z.array(z.string()),
});

const GapFindingSchema = z.object({
  requirementSummary: z.string(),
  complianceStatus: z.string(),
  missingStandards: z.array(z.string()),
  regressionStandards: z.array(z.string()),
  recommendedActions: z.string(),
  notes: z.string().optional(),
});

const PerformGapAnalysisInputSchema = z.object({
  requirementTestCases: z.array(RequirementTestCaseSchema),
  pastRuns: z.array(PastRunRecordSchema).optional(),
  targetStandards: z.array(z.string()),
});

const PerformGapAnalysisOutputSchema = z.object({
  overallSummary: z.string(),
  gapFindings: z.array(GapFindingSchema),
});

export type PerformGapAnalysisOutput = z.infer<typeof PerformGapAnalysisOutputSchema>;

const prompt = ai.definePrompt({
  name: 'performGapAnalysisPrompt',
  input: {schema: PerformGapAnalysisInputSchema},
  output: {schema: PerformGapAnalysisOutputSchema},
  prompt: `You are a compliance analyst. Compare the provided requirements/test cases against target standards and any past runs.

Given:
- requirementTestCases: array of requirements with their generated test cases and compliance tags.
- pastRuns: optional historical test runs with compliance tags.
- targetStandards: the standards we care about.

Produce:
- overallSummary: concise status of how well requirements align to target standards and any notable regressions vs past runs.
- gapFindings: one entry per requirement with:
  - requirementSummary: short phrase identifying the requirement.
  - complianceStatus: plain sentence on coverage.
  - missingStandards: target standards not covered by current test cases.
  - regressionStandards: standards seen in pastRuns but not covered now.
  - recommendedActions: crisp next steps to close the gap.
  - notes: optional extra context (keep short).

Rules:
- Be factual based only on provided data.
- If there are no gaps, say so clearly in complianceStatus/recommendedActions.
- Prefer brevity; avoid repeating requirement IDs verbosely.
`,
});

const performGapAnalysisFlow = ai.defineFlow(
  {
    name: 'performGapAnalysisFlow',
    inputSchema: PerformGapAnalysisInputSchema,
    outputSchema: PerformGapAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

export async function performGapAnalysis(input: z.infer<typeof PerformGapAnalysisInputSchema>): Promise<PerformGapAnalysisOutput> {
  return performGapAnalysisFlow(input);
}
