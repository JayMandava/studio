# HealthTestAI Studio

HealthTestAI is an AI-assisted quality engineering workspace purpose-built for healthcare software teams. It couples generative test design with GDPR-aware anonymization so regulated workflows can be exercised end to end before rollout.

---

## Architecture Overview

- **Framework**: Next.js 15 App Router with server components for layout navigation and client components for interactive tools.
- **AI Runtime**: Google Gemini 2.5 Flash orchestrated through Genkit (`src/ai/genkit.ts:1`), exposing typed server actions for use in React.
- **UI System**: Tailwind CSS with shadcn/ui primitives (see `src/components/ui/`) wrapped by a persistent sidebar shell (`src/app/(app)/layout.tsx:9`).
- **State & Storage**: Transient UI state in React hooks, durable workspace state cached in `localStorage` (`notebookEntries`, `almIntegrations`).
- **Hosting**: Firebase App Hosting (`apphosting.yaml`) with a single instance cap; ready for integration with other Firebase services when needed.

---

## AI Flows (`src/ai/flows`)

### Requirements Traceability Flow  
File: `src/ai/flows/parse-requirements-and-generate-test-cases.ts:8`

- **Input**: A Base64 data URI representing a PDF, XML, or Markdown requirements document.
- **Processing**:
  - Uses `ai.definePrompt` to call Gemini with instructions to detect healthcare context.
  - If non-healthcare, short-circuits with `isHealthcareDomain = false`.
  - Otherwise parses granular requirements, fabricates rich test cases, and tags each case with relevant standards (FDA 21 CFR, IEC 62304, ISO 13485, ISO 27001, ISO 9001, GDPR).
- **Output**: `requirementTestCases[]` array plus metadata flagging healthcare relevance.

### GDPR Anonymization Flow  
File: `src/ai/flows/anonymize-health-data-and-generate-gdpr-summary.ts:9`

- **Input**: Free-form patient data, desired anonymization strategy (`Redact`, `Replace`, `Mask`), and PII categories.
- **Processing**:
  - Gemini evaluates healthcare domain applicability.
  - Applies the requested masking recipe and emits Markdown-formatted compliance bullet lists with bolded subheadings.
- **Output**: Anonymized payload plus compliance summary and follow-up recommendations.

### Genkit Runtime

- `src/ai/genkit.ts:1` registers the Google AI plugin and default model.
- `src/ai/dev.ts:1` loads environment variables (`dotenv`) and imports flows for `genkit start`, enabling local invocation alongside the Next.js dev server.

---

## Feature Modules (`src/app/(app)`)

### Dashboard (`dashboard/page.tsx:6`)
Landing page presenting quick links into requirements generation, anonymization, and integrations with domain-specific messaging.

### Requirements Workspace (`requirements/requirements-form.tsx:20`)
- Handles file selection, normalizes MIME types for `.md`/`.xml`, and uploads documents as data URIs.
- Calls `parseRequirementsAndGenerateTestCases` server action.
- Provides loading skeletons, domain gating, toast notifications, and error cards.
- Offers export utilities:
  - PDF via `jsPDF`, paginating long content.
  - CSV writer that flattens requirement/test mappings.
- Persists a snapshot to the notebook (`localStorage.notebookEntries`) and exposes ALM export stubs for active integrations.

### Anonymization Workspace (`anonymization/anonymization-form.tsx:20`)
- Collects free-form health data, anonymization strategy, and selected PII categories.
- Invokes `anonymizeHealthDataAndGenerateGDPRSummary`.
- Renders structured cards for anonymized output, compliance summary, and follow-up suggestions with copy-to-clipboard actions.
- Uses scrollable panels to manage long content and tooltip affordances for helpers.

### Notebook (`notebook/notebook-view.tsx:20`)
- Loads saved requirement runs from `localStorage`.
- Presents entries in a scrollable list with modal drill-down to accordion-based requirement/test detail.
- Reuses PDF/CSV exporters and ALM export placeholder actions; includes a guarded “Clear History” flow.

### Integrations (`integrations/integrations-form.tsx:20`)
- React Hook Form + Zod to manage ALM connections (Jira, Polarion, Azure DevOps, ALM).
- Persists configurations in `localStorage.almIntegrations`.
- Enforces single active integration via toggle logic and surfaces status indicators.

### Layout & Shell (`layout.tsx:9`, `src/components/ui/sidebar.tsx:19`)
- `SidebarProvider` keeps desktop/mobile navigation state, exposes keyboard toggles, and reads from cookies.
- Top-level layout seeds the Inter font, wraps children, and mounts global toasts (`src/components/ui/toaster.tsx`).

---

## Styling & UI System

- Theme tokens and chart palette defined in `src/app/globals.css:1`; light/dark variables map to Tailwind tokens.
- Tailwind configuration extends font stacks and registers shadcn animations (`tailwind.config.ts`).
- Shared helpers:
  - `cn` utility (`src/lib/utils.ts:1`) merges Tailwind classes.
  - `useToast` (`src/hooks/use-toast.ts:1`) implements a singleton toast queue.
  - `useIsMobile` (`src/hooks/use-mobile.tsx:1`) provides client-side breakpoint detection.

---

## Client Storage & Data Hygiene

- `notebookEntries`: Array of `{ id, date, fileName, data }`, stored newest-first.
- `almIntegrations`: Array of tool configs; `isActive` drives export menus and form toggles.
- Domain validation across flows ensures operations only continue when healthcare context is detected, guarding accidental data misuse.

---

## Development Workflow

1. Install dependencies: `npm install`
2. Launch both servers:
   - Next.js app: `npm run dev`
   - Genkit runtime (for flow hot-reload): `npm run genkit:dev` or `npm run genkit:watch`
3. Environment variables:
   - Provide `GOOGLE_GENAI_API_KEY` (or equivalent credentials supported by `@genkit-ai/googleai`) before starting Genkit.
   - Configure any additional Firebase or Gemini settings in `.env` as needed.
4. Recommended scripts:
   - `npm run lint` – ESLint checks.
   - `npm run typecheck` – TypeScript validation.

---

## Deployment Notes

- `apphosting.yaml` currently limits Firebase App Hosting to a single instance (`runConfig.maxInstances`).
- Add Firebase service initialization once backend features (auth, persistence) are introduced; the `firebase` package is already available in dependencies.

---

## Additional Documentation

- Design intent, visual language, and feature blueprint live in `docs/blueprint.md`.
