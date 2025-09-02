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

export const piiCategories = [
  'Names',
  'Dates of Birth',
  'Addresses',
  'Phone Numbers',
  'Email Addresses',
  'Medical Record Numbers',
  'Other',
] as const;
export const anonymizationStrategies = ['Redact', 'Replace', 'Mask'] as const;

const AnonymizeHealthDataInputSchema = z.object({
  healthData: z
    .string()
    .describe(
      'The sensitive health data to anonymize. This can be in various formats such as text, PDF, or XML.'
    ),
  anonymizationStrategy: z
    .enum(anonymizationStrategies)
    .describe('The anonymization strategy to apply.'),
  piiCategories: z
    .array(z.enum(piiCategories))
    .describe('The categories of PII to anonymize.'),
});
export type AnonymizeHealthDataInput = z.infer<typeof AnonymizeHealthDataInputSchema>;

const GDPRComplianceReportOutputSchema = z.object({
  isHealthcareDomain: z
    .boolean()
    .describe('Whether the provided data belongs to the healthcare domain.'),
  anonymizedData: z
    .string()
    .optional()
    .describe('The anonymized health data, with all PII removed.'),
  complianceSummary: z
    .string()
    .optional()
    .describe('A summary of the GDPR compliance analysis of the anonymized data.'),
  suggestedInformation: z
    .string()
    optional()
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

  First, determine if the provided health data is from the healthcare domain.
  If it is not, set 'isHealthcareDomain' to false and do not proceed with the other steps.
  If it is from the healthcare domain, set 'isHealthcareDomain' to true and then:

  1.  Anonymize the data based on the following user-defined criteria:
      -   Anonymization Strategy: {{{anonymizationStrategy}}}
          -   Redact: Completely remove PII, replacing it with a placeholder like [REDACTED].
          -   Replace: Replace PII with realistic but fake data.
          -   Mask: Partially obscure the data (e.g., an email 'john.doe@example.com' becomes 'j***.***@example.com').
      -   PII Categories to Target: {{{piiCategories}}}

  2.  Analyze the anonymized data for GDPR compliance.
  3.  Provide a summary report of the compliance analysis.
  4.  Suggest any missing information or steps to improve GDPR compliance.

  Health Data: {{{healthData}}}

  Output the anonymized data, compliance summary, and suggestions in the appropriate fields only if the data is healthcare-related.
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
