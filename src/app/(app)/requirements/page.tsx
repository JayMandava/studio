import { RequirementsForm } from "./requirements-form";

export default function RequirementsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Requirements & Test Case Generation
        </h1>
        <p className="text-muted-foreground">
          Upload a requirements document to automatically generate a full suite of test cases.
        </p>
      </div>
      <RequirementsForm />
    </div>
  );
}
