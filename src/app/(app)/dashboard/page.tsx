import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ShieldOff, ArrowRight, TestTubeDiagonal } from "lucide-react";
import Link from 'next/link';
import Image from "next/image";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Welcome to HealthTestAI</h1>
        <p className="text-muted-foreground">
          Your intelligent partner for automated test case generation and compliance in healthcare.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="grid size-12 place-items-center rounded-lg bg-primary/10 text-primary">
                <FileText className="h-6 w-6" />
              </div>
              <CardTitle>Requirements & Test Cases</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between gap-4">
            <CardDescription>
              Upload a requirements document (PDF, XML, or Markdown) to automatically parse its content and generate comprehensive test cases.
            </CardDescription>
            <Button asChild className="mt-auto w-full">
              <Link href="/requirements">
                Generate Test Cases <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="grid size-12 place-items-center rounded-lg bg-primary/10 text-primary">
                <ShieldOff className="h-6 w-6" />
              </div>
              <CardTitle>Data Anonymization</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between gap-4">
            <CardDescription>
              Paste sensitive health data to anonymize it and receive a GDPR compliance report, ensuring data privacy and security.
            </CardDescription>
            <Button asChild className="mt-auto w-full">
              <Link href="/anonymization">
                Anonymize Data <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <div className="relative col-span-1 hidden overflow-hidden rounded-lg border lg:block">
            <Image 
                src="https://picsum.photos/600/400" 
                alt="Healthcare technology" 
                fill={true}
                objectFit="cover"
                data-ai-hint="healthcare technology"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6">
                <h3 className="text-xl font-bold text-white">Ensuring Quality in HealthTech</h3>
                <p className="text-sm text-white/80 mt-2">Leverage AI to meet rigorous standards and deliver safer medical software.</p>
            </div>
        </div>

      </div>

      <Card>
        <CardHeader>
          <CardTitle>Core Capabilities</CardTitle>
          <CardDescription>
            HealthTestAI provides an end-to-end solution for quality assurance in the medical software domain.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
            <div className="flex items-start gap-4">
                <TestTubeDiagonal className="h-8 w-8 text-accent-foreground mt-1" />
                <div>
                    <h3 className="font-semibold">Compliance Mapping</h3>
                    <p className="text-sm text-muted-foreground">Automatically map test cases to standards like FDA, GDPR, and ISO 13485.</p>
                </div>
            </div>
            <div className="flex items-start gap-4">
                <TestTubeDiagonal className="h-8 w-8 text-accent-foreground mt-1" />
                <div>
                    <h3 className="font-semibold">Traceability Matrix</h3>
                    <p className="text-sm text-muted-foreground">Maintain full traceability from requirements to tests for complete audit trails.</p>
                </div>
            </div>
            <div className="flex items-start gap-4">
                <TestTubeDiagonal className="h-8 w-8 text-accent-foreground mt-1" />
                <div>
                    <h3 className="font-semibold">ALM Export</h3>
                    <p className="text-sm text-muted-foreground">Seamlessly export to Jira, Polarion, and Azure DevOps to fit your workflow.</p>
                </div>
            </div>
             <div className="flex items-start gap-4">
                <TestTubeDiagonal className="h-8 w-8 text-accent-foreground mt-1" />
                <div>
                    <h3 className="font-semibold">Interactive Visualization</h3>
                    <p className="text-sm text-muted-foreground">Visualize test coverage and compliance in an intuitive dashboard.</p>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
