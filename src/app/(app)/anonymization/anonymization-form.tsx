
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
import { Loader2, ShieldCheck, Sparkles, Lightbulb, AlertTriangle, Copy, Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

type CopiedField = 'anonymizedData' | 'complianceSummary' | 'suggestedInformation' | null;

export function AnonymizationForm() {
  const [healthData, setHealthData] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GDPRComplianceReportOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [showDomainAlert, setShowDomainAlert] = useState(false);
  const [strategy, setStrategy] = useState<(typeof anonymizationStrategies)[number]>(anonymizationStrategies[0]);
  const [selectedPii, setSelectedPii] = useState<(typeof piiCategories)[number][]>(piiCategories.slice());
  const [copiedField, setCopiedField] = useState<CopiedField>(null);

  const handlePiiChange = (category: typeof piiCategories[number], checked: boolean | 'indeterminate') => {
    if (checked) {
      setSelectedPii((prev) => [...prev, category]);
    } else {
      setSelectedPii((prev) => prev.filter((item) => item !== category));
    }
  };

  const handleCopy = (text: string | undefined, field: NonNullable<CopiedField>) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => {
        setCopiedField(null);
    }, 2000);
  };

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
    if (selectedPii.length === 0) {
      toast({
        variant: "destructive",
        title: "No PII selected",
        description: "Please select at least one PII category to anonymize.",
      });
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await anonymizeHealthDataAndGenerateGDPRSummary({
        healthData,
        anonymizationStrategy: strategy,
        piiCategories: selectedPii,
      });
      if (!response.isHealthcareDomain) {
        setShowDomainAlert(true);
      } else {
        setResult(response);
        toast({
          title: "Anonymization Complete",
          description: "Data has been anonymized and a compliance report generated.",
        });
      }
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
    <>
      <AlertDialog open={showDomainAlert} onOpenChange={setShowDomainAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Can't process</AlertDialogTitle>
            <AlertDialogDescription>
              This tool is designed to work exclusively with data from the healthcare sector.
              The provided content does not appear to be related to healthcare and cannot be processed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowDomainAlert(false)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-8">
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Anonymize Health Data</CardTitle>
              <CardDescription>
                Paste sensitive health information, choose an anonymization strategy and the AI will remove the selected PII.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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

              <div className="grid gap-4 md:grid-cols-2">
                 <div>
                    <Label className="text-base">Anonymization Strategy</Label>
                    <p className="text-sm text-muted-foreground mb-4">Select how PII should be transformed.</p>
                    <RadioGroup value={strategy} onValueChange={(value) => setStrategy(value as (typeof anonymizationStrategies)[number])} disabled={loading}>
                      {anonymizationStrategies.map((item) => (
                        <div key={item} className="flex items-center space-x-2">
                          <RadioGroupItem value={item} id={item} />
                          <Label htmlFor={item} className="font-normal">{item}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                 </div>
                 <div>
                    <Label className="text-base">PII Categories to Anonymize</Label>
                    <p className="text-sm text-muted-foreground mb-4">Choose which types of data to find and anonymize.</p>
                    <div className="grid grid-cols-2 gap-2">
                      {piiCategories.map((item) => (
                        <div key={item} className="flex items-center space-x-2">
                          <Checkbox
                            id={item}
                            checked={selectedPii.includes(item)}
                            onCheckedChange={(checked) => handlePiiChange(item, checked)}
                            disabled={loading}
                          />
                          <Label htmlFor={item} className="font-normal">{item}</Label>
                        </div>
                      ))}
                    </div>
                 </div>
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

        {result && result.anonymizedData && (
        <TooltipProvider>
          <div className="grid gap-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                    Anonymized Data
                  </CardTitle>
                  <CardDescription>
                    PII has been transformed based on your selected strategy and categories.
                  </CardDescription>
                </div>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => handleCopy(result.anonymizedData, 'anonymizedData')}>
                            {copiedField === 'anonymizedData' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Copy to clipboard</p>
                    </TooltipContent>
                </Tooltip>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-60">
                    <pre className="text-sm bg-muted p-4 rounded-md whitespace-pre-wrap">
                    <code>{result.anonymizedData}</code>
                    </pre>
                </ScrollArea>
              </CardContent>
            </Card>
            
            <div className="grid gap-8 md:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="space-y-1.5">
                    <CardTitle className="flex items-center gap-2">
                      <ShieldCheck className="h-6 w-6 text-accent-foreground" />
                      GDPR Compliance Summary
                    </CardTitle>
                  </div>
                   <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => handleCopy(result.complianceSummary, 'complianceSummary')}>
                                {copiedField === 'complianceSummary' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Copy to clipboard</p>
                        </TooltipContent>
                    </Tooltip>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-40">
                        <div className="prose prose-sm max-w-none text-foreground pr-4">
                            <p>{result.complianceSummary}</p>
                        </div>
                    </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                 <CardHeader className="flex flex-row items-center justify-between">
                  <div className="space-y-1.5">
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-6 w-6 text-accent-foreground" />
                      Suggested Information
                    </CardTitle>
                  </div>
                   <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => handleCopy(result.suggestedInformation, 'suggestedInformation')}>
                                {copiedField === 'suggestedInformation' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Copy to clipboard</p>
                        </TooltipContent>
                    </Tooltip>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-40">
                        <div className="prose prose-sm max-w-none text-foreground pr-4">
                            <p>{result.suggestedInformation}</p>
                        </div>
                    </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
          </TooltipProvider>
        )}
      </div>
    </>
  );
}

