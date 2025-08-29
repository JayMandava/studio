"use client";

import { useState } from "react";
import {
  anonymizeHealthDataAndGenerateGDPRSummary,
  type GDPRComplianceReportOutput,
} from "@/ai/flows/anonymize-health-data-and-generate-gdpr-summary";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck, Sparkles, Lightbulb, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function AnonymizationForm() {
  const [healthData, setHealthData] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GDPRComplianceReportOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!healthData.trim()) {
      toast({
        variant: "destructive",
        title: "No data provided",
        description: "Please paste the health data you want to anonymize.",
      });
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await anonymizeHealthDataAndGenerateGDPRSummary({ healthData });
      setResult(response);
      toast({
        title: "Anonymization Complete",
        description: "Data has been anonymized and a compliance report generated.",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Anonymization Failed",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Anonymize Health Data</CardTitle>
            <CardDescription>
              Paste any text containing sensitive health information. The AI will remove personally identifiable information (PII).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid w-full gap-2">
              <Label htmlFor="health-data">Sensitive Health Data</Label>
              <Textarea
                id="health-data"
                placeholder="e.g., Patient John Doe, DOB 01/01/1980, visited Dr. Smith for a check-up..."
                value={healthData}
                onChange={(e) => setHealthData(e.target.value)}
                rows={8}
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Anonymizing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Anonymize & Analyze
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      {loading && (
          <div className="grid gap-8 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-full mt-2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-24 w-full" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-full" />
                </CardContent>
            </Card>
          </div>
      )}

      {error && (
        <Card className="border-destructive">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="h-5 w-5"/> Error</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-destructive">{error}</p>
            </CardContent>
        </Card>
      )}

      {result && (
        <div className="grid gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-primary" />
                Anonymized Data
              </CardTitle>
              <CardDescription>
                All personally identifiable information has been removed or replaced.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
                <code>{result.anonymizedData}</code>
              </pre>
            </CardContent>
          </Card>
          
          <div className="grid gap-8 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-6 w-6 text-accent-foreground" />
                  GDPR Compliance Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none text-foreground">
                <p>{result.complianceSummary}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-6 w-6 text-accent-foreground" />
                  Suggested Information
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none text-foreground">
                <p>{result.suggestedInformation}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
