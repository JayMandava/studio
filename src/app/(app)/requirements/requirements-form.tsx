
"use client";

import React, { useState } from "react";
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
import { Upload, Loader2, ListChecks, Download, AlertTriangle, FileText, X, ChevronDown, BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { jsPDF } from "jspdf";

const complianceStandards = ["FDA 21 CFR", "IEC 62304", "ISO 13485", "GDPR", "ISO 27001", "ISO 9001"];

export function RequirementsForm() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParseRequirementsAndGenerateTestCasesOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [showDomainAlert, setShowDomainAlert] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
    }
  };
  
  const handleRemoveFile = () => {
    setFile(null);
    setResult(null);
    setError(null);
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
          if (response.requirementTestCases) {
            const totalTestCases = response.requirementTestCases.reduce((acc, curr) => acc + curr.testCases.length, 0);
            toast({
                title: "Success!",
                description: `Generated ${totalTestCases} test cases across ${response.requirementTestCases.length} requirements.`,
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

  const handleExport = (format: 'csv' | 'pdf') => {
    if (!result || !result.requirementTestCases) return;
  
    if (format === 'csv') {
      const header = 'Requirement ID,Requirement Description,Test Case ID,Test Case Description,Compliance Standards\n';
      const rows = result.requirementTestCases.flatMap((req, reqIndex) =>
        req.testCases.map((tc, tcIndex) =>
          `"${reqIndex + 1}","${req.requirement.replace(/"/g, '""')}","TC-${reqIndex + 1}.${tcIndex + 1}","${tc.description.replace(/"/g, '""')}","${tc.compliance.join(', ')}"`
        )
      ).join('\n');
      const content = header + rows;
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'requirements-test-cases.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("Requirements & Test Cases", 14, 22);
  
      let y = 30;
      result.requirementTestCases.forEach((item, index) => {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }
  
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        const reqLines = doc.splitTextToSize(`Requirement #${index + 1}: ${item.requirement}`, 180);
        doc.text(reqLines, 14, y);
        y += (reqLines.length * 6) + 4;
  
        doc.setFont(undefined, 'normal');
        item.testCases.forEach((tc) => {
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
          doc.setFontSize(10);
          const tcLines = doc.splitTextToSize(`- ${tc.description}`, 175);
          doc.text(tcLines, 20, y);
          y += (tcLines.length * 5);
          
          if (tc.compliance.length > 0) {
            doc.setFontSize(8);
            doc.setTextColor(100);
            const complianceLine = `Standards: ${tc.compliance.join(', ')}`;
            const complianceLines = doc.splitTextToSize(complianceLine, 170);
            doc.text(complianceLines, 22, y + 1);
            y += (complianceLines.length * 4) + 2;
            doc.setTextColor(0);
          }
           y += 3;
        });
        y += 5;
      });
  
      const pdfOutput = doc.output('blob');
      const url = URL.createObjectURL(pdfOutput);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'requirements-test-cases.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
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
                Select a PDF, XML and Markdown file containing your software requirements. The AI will consider the following standards when generating test cases:
              </CardDescription>
                <div className="flex flex-wrap gap-2 pt-2">
                    {complianceStandards.map((standard) => (
                        <Badge key={standard} variant="secondary" className="flex items-center gap-1.5">
                            <BadgeCheck className="h-3 w-3" />
                            {standard}
                        </Badge>
                    ))}
                </div>
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
              <Button type="submit" disabled={loading || !file}>
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

        {result && result.requirementTestCases && result.requirementTestCases.length > 0 && (
          <Card>
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div>
                    <CardTitle className="flex items-center gap-2 text-primary">
                        <ListChecks className="h-6 w-6" /> Generated Test Cases
                    </CardTitle>
                    <CardDescription>
                        {result.requirementTestCases.reduce((acc, curr) => acc + curr.testCases.length, 0)} test cases generated for {result.requirementTestCases.length} requirements.
                    </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button>
                      <Download className="mr-2 h-4 w-4" />
                      Export
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleExport('pdf')}>Export as PDF</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('csv')}>Export as CSV</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="space-y-4">
                  <Accordion type="multiple" className="w-full">
                    {result.requirementTestCases.map((item, index) => (
                      <AccordionItem key={index} value={`item-${index}`}>
                          <AccordionTrigger className="text-left hover:no-underline">
                              <div className="flex flex-col gap-1.5">
                                  <span className="font-semibold text-base">Requirement #{index + 1}</span>
                                  <p className="font-normal text-muted-foreground">{item.requirement}</p>
                              </div>
                          </AccordionTrigger>
                          <AccordionContent>
                              <div className="pl-4 border-l-2 border-primary ml-2">
                                <h4 className="font-semibold mb-3 mt-1">Generated Test Cases ({item.testCases.length})</h4>
                                <ul className="space-y-4">
                                    {item.testCases.map((tc, tcIndex) => (
                                        <li key={tcIndex} className="prose prose-sm max-w-none text-foreground list-none">
                                          <p className="m-0">{tc.description}</p>
                                          {tc.compliance && tc.compliance.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                              {tc.compliance.map(standard => (
                                                <Badge key={standard} variant="outline" className="font-normal">
                                                  {standard}
                                                </Badge>
                                              ))}
                                            </div>
                                          )}
                                        </li>
                                    ))}
                                </ul>
                              </div>
                          </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
              </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
