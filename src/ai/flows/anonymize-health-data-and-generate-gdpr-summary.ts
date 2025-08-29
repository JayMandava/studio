'use server';

/**
 * @fileOverview A flow that anonymizes health data, analyzes GDPR compliance,
 * and provides a compliance report summary.
 *
 * - anonymizeHealthDataAndGenerateGDPRSummary - The main function to execute the flow.
 * - AnonymizeHealthDataInput - Input type for the main function.
 * - GDPRComplianceReportOutput - Output type for the main function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

const AnonymizeHealthDataInputSchema = z.object({
  healthData: z
    .string()
    .describe(
      'The sensitive health data to anonymize. This can be in various formats such as text, PDF, or XML.'
    ),
});
export type AnonymizeHealthDataInput = z.infer<typeof AnonymizeHealthDataInputSchema>;

const GDPRComplianceReportOutputSchema = z.object({
  anonymizedData: z
    .string()
    .describe('The anonymized health data, with all PII removed.'),
  complianceSummary: z
    .string()
    .describe('A summary of the GDPR compliance analysis of the anonymized data.'),
  suggestedInformation: z
    .string()
    .describe(
      'Suggestions for any missing information or steps to improve GDPR compliance.'
    ),
});
export type GDPRComplianceReportOutput = z.infer<typeof GDPRComplianceReportOutputSchema>;

export async function anonymizeHealthDataAndGenerateGDPRSummary(
  input: AnonymizeHealthDataInput
): Promise<GDPRComplianceReportOutput> {
  return anonymizeHealthDataAndGenerateGDPRSummaryFlow(input);
}

const anonymizeHealthDataPrompt = ai.definePrompt({
  name: 'anonymizeHealthDataPrompt',
  input: {schema: AnonymizeHealthDataInputSchema},
  output: {schema: GDPRComplianceReportOutputSchema},
  prompt: `You are an expert in health data anonymization and GDPR compliance.

  Based on the provided health data, you will:
  1.  Anonymize the data to remove all Personally Identifiable Information (PII).
  2.  Analyze the anonymized data for GDPR compliance.
  3.  Provide a summary report of the compliance analysis.
  4.  Suggest any missing information or steps to improve GDPR compliance.

  Health Data: {{{healthData}}}

  Output the anonymized data, compliance summary, and suggestions in the appropriate fields.
  `,
});

const anonymizeHealthDataAndGenerateGDPRSummaryFlow = ai.defineFlow(
  {
    name: 'anonymizeHealthDataAndGenerateGDPRSummaryFlow',
    inputSchema: AnonymizeHealthDataInputSchema,
    outputSchema: GDPRComplianceReportOutputSchema,
  },
  async input => {
    const {output} = await anonymizeHealthDataPrompt(input);
    return output!;
  }
);
