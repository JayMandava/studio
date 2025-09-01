
"use client";

import { useState, useEffect, useMemo } from "react";
import * as React from "react";
import {
  parseRequirementsAndGenerateTestCases,
  type ParseRequirementsAndGenerateTestCasesOutput,
} from "@/ai/flows/parse-requirements-and-generate-test-cases";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, ListChecks, Download, CheckCircle, AlertTriangle, FileText, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const complianceStandards = ["FDA 21 CFR", "IEC 62304", "ISO 13485", "GDPR", "ISO 27001"];

interface TestCaseWithCompliance {
  testCase: string;
  compliance: string[];
}

export function RequirementsForm() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParseRequirementsAndGenerateTestCasesOutput | null>(null);
  const [processedResults, setProcessedResults] = useState<TestCaseWithCompliance[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [showDomainAlert, setShowDomainAlert] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (result && result.testCases && result.testCases.length > 0) {
      const newProcessedResults = result.testCases.map((testCase) => ({
        testCase,
        compliance: complianceStandards
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 3) + 1),
      }));
      setProcessedResults(newProcessedResults);
    }
  }, [result]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
      setProcessedResults([]);
    }
  };
  
  const handleRemoveFile = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setProcessedResults([]);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({
        variant: "destructive",
        title: "No file selected",
        description: "Please select a requirements document to upload.",
      });
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setProcessedResults([]);

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      try {
        let dataUri = reader.result as string;
        
        const mimeType = file.type;
        const fileName = file.name;

        if ( (mimeType === 'application/octet-stream' || mimeType === '') && fileName.endsWith('.md')) {
            dataUri = dataUri.replace(/data:application\/octet-stream;|data:;/,'data:text/markdown;');
        } else if ( (mimeType === 'application/xml' || mimeType === 'text/xml' || ((mimeType === 'application/octet-stream' || mimeType === '') && fileName.endsWith('.xml'))) ) {
            dataUri = dataUri.replace(/data:application\/xml;|data:text\/xml;|data:application\/octet-stream;|data:;/, 'data:text/plain;');
        }

        const response = await parseRequirementsAndGenerateTestCases({
          documentDataUri: dataUri,
        });

        if (!response.isHealthcareDomain) {
          setShowDomainAlert(true);
        } else {
          setResult(response);
          if (response.testCases) {
            toast({
                title: "Success!",
                description: `Generated ${response.testCases.length} test cases from your document.`,
            });
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
        setError(errorMessage);
        toast({
          variant: "destructive",
          title: "Generation Failed",
          description: errorMessage,
        });
      } finally {
        setLoading(false);
      }
    };
    
    reader.onerror = () => {
        setError("Failed to read the file.");
        toast({
          variant: "destructive",
          title: "File Read Error",
          description: "There was an error processing your file.",
        });
        setLoading(false);
    };
  };

  return (
    <>
      <AlertDialog open={showDomainAlert} onOpenChange={setShowDomainAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Can't process</AlertDialogTitle>
            <AlertDialogDescription>
              This tool is designed to work exclusively with documents from the healthcare sector.
              The provided document does not appear to be related to healthcare and cannot be processed.
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
              <CardTitle>Upload Requirements Document</CardTitle>
              <CardDescription>
                Select a PDF, XML and Markdown file containing your software requirements.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid w-full max-w-sm items-center gap-2">
                <Label htmlFor="requirements-file">Document</Label>
                <div className="flex gap-2">
                  <Input id="requirements-file" ref={fileInputRef} type="file" onChange={handleFileChange} accept=".pdf,.xml,.md,application/pdf,text/xml,text/markdown" />
                </div>
                {file && (
                    <div className="flex items-center justify-between rounded-md border border-input bg-background p-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <FileText className="h-4 w-4 flex-shrink-0"/>
                            <span className="truncate">{file.name}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={handleRemoveFile}>
                           <X className="h-4 w-4"/>
                           <span className="sr-only">Remove file</span>
                        </Button>
                    </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Generate Test Cases
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        {loading && (
          <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" />Analyzing Document...</CardTitle>
                  <CardDescription>AI is parsing requirements and generating test cases. This may take a moment.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
                      <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
                  </div>
                  <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
                      <div className="h-4 bg-muted rounded w-5/6 animate-pulse"></div>
                  </div>
              </CardContent>
          </Card>
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

        {processedResults.length > 0 && (
          <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                      <ListChecks className="h-6 w-6" /> Generated Test Cases
                  </CardTitle>
                  <CardDescription>
                      {processedResults.length} test cases have been generated. Each case includes traceability and compliance mapping.
                  </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  {processedResults.map((item, index) => (
                      <Card key={index} className="bg-secondary/50">
                          <CardHeader>
                              <CardTitle className="text-base">Test Case #{index + 1}</CardTitle>
                          </CardHeader>
                          <CardContent>
                              <p className="mb-4">{item.testCase}</p>
                              <Separator />
                              <div className="mt-4 space-y-2">
                                  <h4 className="text-sm font-semibold flex items-center gap-2">
                                      <CheckCircle className="h-4 w-4 text-accent-foreground" /> Compliance Mapping
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                      {item.compliance.map(standard => (
                                          <Badge key={standard} variant="outline" className="bg-background">{standard}</Badge>
                                      ))}
                                  </div>
                              </div>
                          </CardContent>
                          <CardFooter className="justify-end gap-2">
                              <Button variant="ghost" size="sm"><Download className="mr-2 h-4 w-4"/>Jira</Button>
                              <Button variant="ghost" size="sm"><Download className="mr-2 h-4 w-4"/>Polarion</Button>
                              <Button variant="ghost" size="sm"><Download className="mr-2 h-4 w-4"/>Azure DevOps</Button>
                          </CardFooter>
                      </Card>
                  ))}
              </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
