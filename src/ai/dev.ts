import { config } from 'dotenv';
config();

import '@/ai/flows/parse-requirements-and-generate-test-cases.ts';
import '@/ai/flows/anonymize-health-data-and-generate-gdpr-summary.ts';