
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ShieldOff, ArrowRight, TestTubeDiagonal, Puzzle } from "lucide-react";
import Link from 'next/link';

export default function DashboardPage() {
  const tickerText = "Ensuring Quality in HealthTech — Leverage AI to meet rigorous standards and deliver safer medical software.";

  return (
    <div className="space-y-6 max-w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Welcome to HealthTestAI</h1>
        <p className="text-muted-foreground">
          Your intelligent partner for automated test case generation and compliance in healthcare.
        </p>
      </div>

      <div className="overflow-hidden w-full">
        <div className="flex gap-8 whitespace-nowrap py-1 text-card-foreground animate-ticker">
          {[...Array(2)].map((_, idx) => (
            <span
              key={idx}
              className="text-sm font-medium uppercase tracking-wide text-primary"
            >
              {tickerText}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 w-full">
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg break-words">Requirements & Test Cases</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <CardDescription className="text-sm break-words">
              Upload requirements documents to automatically generate comprehensive test cases.
            </CardDescription>
            <Button asChild className="w-full" size="sm">
              <Link href="/requirements">
                Generate Test Cases <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
                <ShieldOff className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg break-words">Data Anonymization</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <CardDescription className="text-sm break-words">
              Anonymize sensitive health data and receive GDPR compliance reports.
            </CardDescription>
            <Button asChild className="w-full" size="sm">
              <Link href="/anonymization">
                Anonymize Data <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Core Capabilities</CardTitle>
          <CardDescription className="text-sm">
            End-to-end quality assurance solution for medical software.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 w-full">
            <div className="flex items-start gap-3 min-w-0">
                <TestTubeDiagonal className="h-6 w-6 text-accent-foreground mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm break-words">Compliance Mapping</h3>
                    <p className="text-xs text-muted-foreground break-words">Map test cases to FDA, GDPR, and ISO 13485 standards.</p>
                </div>
            </div>
            <div className="flex items-start gap-3 min-w-0">
                <TestTubeDiagonal className="h-6 w-6 text-accent-foreground mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm break-words">Traceability Matrix</h3>
                    <p className="text-xs text-muted-foreground break-words">Full traceability from requirements to tests.</p>
                </div>
            </div>
             <div className="flex items-start gap-3 min-w-0">
                <TestTubeDiagonal className="h-6 w-6 text-accent-foreground mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm break-words">Interactive Visualization</h3>
                    <p className="text-xs text-muted-foreground break-words">Visualize test coverage and compliance intuitively.</p>
                </div>
            </div>
            <div className="flex items-start gap-3 min-w-0">
                <Puzzle className="h-6 w-6 text-accent-foreground mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm break-words">ALM Integrations</h3>
                    <p className="text-xs text-muted-foreground break-words">Connect to Jira, Azure DevOps, and more.</p>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
