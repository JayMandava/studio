import { AnonymizationForm } from "./anonymization-form";

export default function AnonymizationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Health Data Anonymization
        </h1>
        <p className="text-muted-foreground">
          Paste sensitive data to remove PII and generate a GDPR compliance summary.
        </p>
      </div>
      <AnonymizationForm />
    </div>
  );
}
