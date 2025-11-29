
"use client";

import React, { useState, useEffect } from "react";
import {
  parseRequirementsAndGenerateTestCases,
  type ParseRequirementsAndGenerateTestCasesOutput,
} from "@/ai/flows/parse-requirements-and-generate-test-cases";
import { performGapAnalysis, type PerformGapAnalysisOutput } from "@/ai/flows/perform-gap-analysis";
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
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CircularProgress from "@mui/material/CircularProgress";
import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck";
import DownloadIcon from "@mui/icons-material/Download";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import DescriptionIcon from "@mui/icons-material/Description";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import VerifiedIcon from "@mui/icons-material/Verified";
import SaveIcon from "@mui/icons-material/Save";
import SendIcon from "@mui/icons-material/Send";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { Badge } from "@/components/ui/badge";
import { exportAllToJira, validateJiraConfig } from "@/lib/integrations/jira";
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { jsPDF } from "jspdf";
import type { SavedNotebookEntry } from "@/app/(app)/notebook/notebook-view";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const complianceStandards = [
  {
    key: "fda-21-cfr",
    label: "FDA 21 CFR",
    title: "FDA 21 CFR Part 11",
    description: "Electronic records and signatures must be trustworthy, secure, and auditable.",
    focus: "Audit trails, validated workflows, role-based access, electronic signatures.",
  },
  {
    key: "iec-62304",
    label: "IEC 62304",
    title: "IEC 62304",
    description: "Defines the software lifecycle for medical devices with risk-driven controls.",
    focus: "Risk classification, development lifecycle, verification/validation, maintenance.",
  },
  {
    key: "iso-13485",
    label: "ISO 13485",
    title: "ISO 13485",
    description: "Quality management system for medical devices with design and traceability rigor.",
    focus: "Design controls, traceability, documented procedures, CAPA.",
  },
  {
    key: "gdpr",
    label: "GDPR",
    title: "GDPR",
    description: "Protects personal data and privacy for individuals in the EU.",
    focus: "Lawful basis, consent, data minimization, breach response, DSR handling.",
  },
  {
    key: "iso-27001",
    label: "ISO 27001",
    title: "ISO 27001",
    description: "Information security management with controls for confidentiality, integrity, availability.",
    focus: "Risk assessment, access controls, logging, incident response, supplier security.",
  },
  {
    key: "iso-9001",
    label: "ISO 9001",
    title: "ISO 9001",
    description: "General quality management focused on consistent processes and continuous improvement.",
    focus: "Process controls, documentation, internal audits, customer feedback.",
  },
];

type PastRunRecord = {
  requirementId?: string;
  requirementDescription?: string;
  testCaseId?: string;
  compliance: string[];
};

export function RequirementsForm() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParseRequirementsAndGenerateTestCasesOutput | null>(null);
  const [gapAnalysis, setGapAnalysis] = useState<PerformGapAnalysisOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [showDomainAlert, setShowDomainAlert] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [activeIntegrations, setActiveIntegrations] = useState<any[]>([]);
  const [isExportingToJira, setIsExportingToJira] = useState(false);
  const [jiraExportProgress, setJiraExportProgress] = useState({ current: 0, total: 0 });
  const [pastRunFiles, setPastRunFiles] = useState<{ fileName: string; records: PastRunRecord[] }[]>([]);

  useEffect(() => {
    try {
      const savedIntegrations = localStorage.getItem('almIntegrations');
      if (savedIntegrations) {
        const parsed = JSON.parse(savedIntegrations);
        setActiveIntegrations(parsed.filter((p: any) => p.isActive));
      }
    } catch (e) {
      console.error('Failed to load integrations from localStorage:', e);
    }
  }, []);

  const complianceLabels = complianceStandards.map((standard) => standard.label);

  const isRequirementFile = (file: File) => {
    const name = file.name.toLowerCase();
    const type = file.type.toLowerCase();
    return (
      name.endsWith('.pdf') ||
      name.endsWith('.xml') ||
      name.endsWith('.md') ||
      type.includes('pdf') ||
      type.includes('xml') ||
      type.includes('markdown')
    );
  };

  const readFileAsDataURL = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file.'));
      reader.readAsDataURL(file);
    });

  const readFileAsText = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file.'));
      reader.readAsText(file);
    });

  const normalizeRequirementDataUri = (dataUri: string, file: File) => {
    const mimeType = file.type;
    const fileName = file.name;

    if ((mimeType === 'application/octet-stream' || mimeType === '') && fileName.endsWith('.md')) {
      return dataUri.replace(/data:application\/octet-stream;|data:;/, 'data:text/markdown;');
    } else if (
      mimeType === 'application/xml' ||
      mimeType === 'text/xml' ||
      (mimeType === 'application/octet-stream' && fileName.endsWith('.xml')) ||
      (mimeType === '' && fileName.endsWith('.xml'))
    ) {
      return dataUri.replace(/data:application\/xml;|data:text\/xml;|data:application\/octet-stream;|data:;/, 'data:text/plain;');
    }

    return dataUri;
  };

  const parseCsvPastRuns = (csvText: string): PastRunRecord[] => {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return [];
    const dataLines = lines.slice(1);
    return dataLines.map(line => {
      const cells = line.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map(cell => cell.replace(/^\"|\"$/g, '').trim());
      const requirementId = cells[0] || undefined;
      const requirementDescription = cells[1] || undefined;
      const testCaseId = cells[2] || undefined;
      const complianceList = cells[4] ? cells[4].split(',').map(c => c.trim()).filter(Boolean) : [];
      return {
        requirementId,
        requirementDescription,
        testCaseId,
        compliance: complianceList,
      };
    });
  };

  const buildFallbackGapAnalysis = (
    requirements: ParseRequirementsAndGenerateTestCasesOutput['requirementTestCases'] | undefined,
    pastRuns: PastRunRecord[]
  ): PerformGapAnalysisOutput => {
    if (!requirements) return { overallSummary: 'No requirements detected.', gapFindings: [] };
    const pastStandards = new Set(pastRuns.flatMap(run => run.compliance.map(c => c.toLowerCase())));
    const targetStandards = complianceLabels;

    const gapFindings = requirements.map((req, index) => {
      const currentStandards = new Set(
        req.testCases.flatMap(tc => tc.compliance.map(c => c.toLowerCase()))
      );
      const missingStandards = targetStandards.filter(
        standard => !currentStandards.has(standard.toLowerCase())
      );
      const regressionStandards = Array.from(pastStandards).filter(
        standard => !currentStandards.has(standard)
      );

      const isCompliant = missingStandards.length === 0;
      const complianceStatus = isCompliant
        ? 'Aligned with target standards.'
        : `Missing coverage for: ${missingStandards.join(', ')}`;

      return {
        requirementSummary: req.requirement || `Requirement #${index + 1}`,
        complianceStatus,
        missingStandards,
        regressionStandards,
        recommendedActions:
          missingStandards.length === 0 && regressionStandards.length === 0
            ? 'Keep existing coverage; no gaps detected.'
            : 'Add or update test cases to cover missing/regressed standards; update traceability.',
        notes: regressionStandards.length > 0 ? 'Past runs included standards not present in current test cases.' : undefined,
      };
    });

    const anyMissing = gapFindings.some(f => f.missingStandards.length > 0);
    const anyRegression = gapFindings.some(f => f.regressionStandards.length > 0);
    const overallSummary = anyMissing
      ? 'Some requirements are missing target standard coverage.'
      : 'All requirements align with target standards.';
    const summaryWithRegression = anyRegression
      ? `${overallSummary} Regressions vs past runs detected.`
      : overallSummary;

    return {
      overallSummary: summaryWithRegression,
      gapFindings,
    };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const requirementFile = files.find(isRequirementFile);
    if (!requirementFile) {
      toast({
        variant: "destructive",
        title: "No requirements file",
        description: "Please upload a requirements document (PDF, XML, or Markdown).",
      });
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setGapAnalysis(null);
    setPastRunFiles([]);

    try {
      const requirementDataUri = normalizeRequirementDataUri(
        await readFileAsDataURL(requirementFile),
        requirementFile
      );

      const pastCsvFiles = files.filter(f => f.name.toLowerCase().endsWith('.csv'));
      const pastRunData = await Promise.all(
        pastCsvFiles.map(async file => {
          const text = await readFileAsText(file);
          return { fileName: file.name, records: parseCsvPastRuns(text) };
        })
      );
      setPastRunFiles(pastRunData);

      const response = await parseRequirementsAndGenerateTestCases({
        documentDataUri: requirementDataUri,
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

          try {
            const gapResult = await performGapAnalysis({
              requirementTestCases: response.requirementTestCases,
              pastRuns: pastRunData.flatMap(p => p.records),
              targetStandards: complianceLabels,
            });
            setGapAnalysis(gapResult);
          } catch (analysisError) {
            console.warn('Gap analysis flow failed, using fallback.', analysisError);
            setGapAnalysis(buildFallbackGapAnalysis(response.requirementTestCases, pastRunData.flatMap(p => p.records)));
          }
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

  const handleExport = (format: 'csv' | 'pdf') => {
    if (!result || !result.requirementTestCases) return;
    const primaryFileName = files.find(isRequirementFile)?.name || 'requirements';
  
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
      a.download = `${primaryFileName.replace(/\.[^/.]+$/, '') || 'requirements'}-test-cases.csv`;
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
      a.download = `${primaryFileName.replace(/\.[^/.]+$/, '') || 'requirements'}-test-cases.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleGapExport = () => {
    if (!gapAnalysis || !gapAnalysis.gapFindings || !result?.requirementTestCases) return;

    const header = 'Compliance Code,Requirement,TCs Executed Earlier,Status\n';
    const pastRuns = pastRunFiles.flatMap(p => p.records);
    const pastStandards = new Set(
      pastRuns.flatMap(run => run.compliance.map(c => c.toLowerCase()))
    );

    const rows: string[] = [];

    result.requirementTestCases.forEach(req => {
      const currentStandards = new Set(
        req.testCases.flatMap(tc => tc.compliance.map(c => c.toLowerCase()))
      );

      complianceLabels.forEach(code => {
        const codeLower = code.toLowerCase();
        const executedEarlier = pastStandards.has(codeLower) ? 'Done' : 'Not Done';
        const status = currentStandards.has(codeLower) ? 'Pass' : 'Fail'; // No info -> Fail

        rows.push([
          `"${code}"`,
          `"${(req.requirement || '').replace(/"/g, '""')}"`,
          executedEarlier,
          status,
        ].join(','));
      });
    });

    const blob = new Blob([header + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gap-analysis.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleAlmExport = async (tool: string) => {
    if (!result || !result.requirementTestCases) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "No test cases available to export.",
      });
      return;
    }
    const requirementFile = files.find(isRequirementFile) || null;

    // Only handle JIRA for now
    if (tool.toLowerCase() !== 'jira') {
      toast({
        title: `Exporting to ${tool}`,
        description: `Your test cases are being exported. This feature is coming soon.`,
      });
      return;
    }

    // Get JIRA configuration from active integrations
    const jiraIntegration = activeIntegrations.find(
      (integration) => integration.tool.toLowerCase() === 'jira'
    );

    if (!jiraIntegration) {
      toast({
        variant: "destructive",
        title: "JIRA Not Configured",
        description: "Please configure JIRA integration in the Integrations page.",
      });
      return;
    }

    if (!validateJiraConfig(jiraIntegration)) {
      toast({
        variant: "destructive",
        title: "Invalid Configuration",
        description: "JIRA configuration is incomplete. Please check your settings.",
      });
      return;
    }

    setIsExportingToJira(true);
    setJiraExportProgress({ current: 0, total: result.requirementTestCases.length });

    try {
      const exportResult = await exportAllToJira(
        {
          url: jiraIntegration.url,
          username: jiraIntegration.username,
          apiToken: jiraIntegration.apiToken,
          projectKey: jiraIntegration.projectKey,
        },
        result.requirementTestCases,
        requirementFile?.name || 'Requirements',
        (current, total, key) => {
          setJiraExportProgress({ current, total });
          if (key) {
            console.log(`Created JIRA story: ${key}`);
          }
        },
        requirementFile || undefined
      );

      if (exportResult.success > 0) {
        toast({
          title: "Export Successful",
          description: `Successfully created ${exportResult.success} JIRA ${exportResult.success === 1 ? 'task' : 'tasks'} with test case subtasks.${exportResult.failed > 0 ? ` ${exportResult.failed} failed.` : ''}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Export Failed",
          description: exportResult.errors[0] || "Failed to create JIRA tasks.",
        });
      }
    } catch (error) {
      console.error('JIRA export error:', error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
      });
    } finally {
      setIsExportingToJira(false);
      setJiraExportProgress({ current: 0, total: 0 });
    }
  }

  const handleSaveToNotebook = () => {
    if (!result) return;
    const primaryFileName = files.find(isRequirementFile)?.name || 'Untitled';
    try {
        const savedEntries: SavedNotebookEntry[] = JSON.parse(localStorage.getItem('notebookEntries') || '[]');
        const newEntry: SavedNotebookEntry = {
            id: new Date().toISOString(),
            date: new Date().toISOString(),
            data: result,
            fileName: primaryFileName,
        };
        savedEntries.unshift(newEntry);
        localStorage.setItem('notebookEntries', JSON.stringify(savedEntries));
        toast({
            title: "Saved to Notebook",
            description: `The generated test cases for ${primaryFileName} have been saved.`,
        });
    } catch (e) {
        console.error("Failed to save to notebook:", e);
        toast({
            variant: "destructive",
            title: "Failed to save",
            description: "There was an error saving the results to your notebook.",
        });
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
                      <Popover key={standard.key}>
                        <PopoverTrigger asChild>
                          <Badge
                            role="button"
                            tabIndex={0}
                            variant="secondary"
                            className="flex items-center gap-1.5 cursor-pointer hover:border-primary"
                          >
                            <VerifiedIcon className="h-3 w-3" fontSize="inherit" />
                            {standard.label}
                            <InfoOutlinedIcon className="h-3 w-3 text-muted-foreground" />
                          </Badge>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="space-y-1.5">
                            <p className="text-sm font-semibold">{standard.title}</p>
                            <p className="text-sm text-muted-foreground">{standard.description}</p>
                            <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Focus:</span> {standard.focus}</p>
                          </div>
                        </PopoverContent>
                      </Popover>
                    ))}
                </div>
            </CardHeader>
            <CardContent>
              <div className="grid w-full max-w-sm items-center gap-2">
                <Label htmlFor="requirements-file">Document</Label>
                <div className="flex gap-2">
                  <input
                    id="requirements-file"
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    accept=".pdf,.xml,.md,.csv,application/pdf,text/xml,text/markdown,text/csv,application/csv"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <CloudUploadIcon fontSize="small" className="mr-2" />
                    Choose Files
                  </Button>
                </div>
                {files.length > 0 && (
                    <div className="flex flex-col gap-2">
                      {files.map((selectedFile, index) => (
                        <div key={`${selectedFile.name}-${index}`} className="flex items-center justify-between rounded-md border border-input bg-background p-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2 overflow-hidden">
                            <DescriptionIcon className="h-4 w-4 flex-shrink-0" fontSize="inherit" />
                                <span className="truncate">{selectedFile.name}</span>
                                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                                  {selectedFile.name.toLowerCase().endsWith('.csv') ? 'Past run' : 'Requirement'}
                                </span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={() => handleRemoveFile(index)}>
                               <CloseIcon fontSize="small" />
                               <span className="sr-only">Remove file</span>
                            </Button>
                        </div>
                      ))}
                    </div>
                )}
                <p className="text-xs text-muted-foreground">
                  You can upload multiple files, including past test run CSVs, to enrich the gap analysis.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={loading || !files.some(isRequirementFile)}>
                {loading ? (
                  <>
                    <CircularProgress size={16} className="mr-2 text-primary" />
                    Generating...
                  </>
                ) : (
                  <>
                    <CloudUploadIcon fontSize="small" className="mr-2" />
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
                  <CardTitle className="flex items-center gap-2"><CircularProgress size={18} className="text-primary" />Analyzing Document...</CardTitle>
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
                        <PlaylistAddCheckIcon className="h-6 w-6" /> Generated Test Cases
                    </CardTitle>
                    <CardDescription>
                        {result.requirementTestCases.reduce((acc, curr) => acc + curr.testCases.length, 0)} test cases generated for {result.requirementTestCases.length} requirements.
                        {isExportingToJira && (
                          <span className="ml-2 text-sm">
                            (Exporting to JIRA: {jiraExportProgress.current}/{jiraExportProgress.total})
                          </span>
                        )}
                    </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleSaveToNotebook} disabled={isExportingToJira}>
                        <Save className="mr-2 h-4 w-4"/>
                        Save to Notebook
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button disabled={isExportingToJira}>
                          {isExportingToJira ? (
                            <>
                              <CircularProgress size={16} className="mr-2 text-primary" />
                              Exporting...
                            </>
                          ) : (
                            <>
                              <Download className="mr-2 h-4 w-4" />
                              Export
                              <ChevronDown className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleExport('pdf')}>Export as PDF</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExport('csv')}>Export as CSV</DropdownMenuItem>
                         {activeIntegrations.length > 0 && <DropdownMenuSeparator />}
                         {activeIntegrations.map((integration) => (
                           <DropdownMenuItem key={integration.tool} onClick={() => handleAlmExport(integration.tool)}>
                             <Send className="mr-2 h-4 w-4" />
                             Export to {integration.tool}
                           </DropdownMenuItem>
                         ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                  <Accordion type="multiple" className="w-full" defaultValue={[]}>
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
                                                <Badge
                                                  key={standard}
                                                  variant="success"
                                                  className="font-normal"
                                                >
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

        {gapAnalysis && gapAnalysis.gapFindings && gapAnalysis.gapFindings.length > 0 && (
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <AlertTriangle className="h-5 w-5" /> Gap Analysis
                </CardTitle>
                <CardDescription>
                  {gapAnalysis.overallSummary}
                  {pastRunFiles.length > 0 && (
                    <span className="ml-2 text-xs text-muted-foreground">(Past runs used: {pastRunFiles.length})</span>
                  )}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleGapExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Export as CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full" defaultValue={[]}>
                {gapAnalysis.gapFindings.map((finding, index) => (
                  <AccordionItem key={index} value={`gap-${index}`}>
                    <AccordionTrigger className="text-left hover:no-underline">
                      <div className="flex flex-col gap-1.5 text-left">
                        <span className="font-semibold text-base">Requirement #{index + 1}</span>
                        <p className="font-normal text-muted-foreground line-clamp-2">{finding.requirementSummary}</p>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pl-4 border-l-2 border-primary ml-2 space-y-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-semibold">Status</span>
                          <p className="text-sm text-foreground">{finding.complianceStatus}</p>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-1">
                            <span className="text-sm font-semibold">Missing Standards</span>
                            {finding.missingStandards.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {finding.missingStandards.map(standard => (
                                  <Badge key={standard} variant="outline" className="font-normal">
                                    {standard}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">None</p>
                            )}
                          </div>
                          <div className="space-y-1">
                            <span className="text-sm font-semibold">Regressions vs Past Runs</span>
                            {finding.regressionStandards.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {finding.regressionStandards.map(standard => (
                                  <Badge key={standard} variant="destructive" className="font-normal">
                                    {standard}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">None detected</p>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-sm font-semibold">Recommended Actions</span>
                          <p className="text-sm text-foreground">{finding.recommendedActions}</p>
                        </div>
                        {finding.notes && (
                          <div className="space-y-1">
                            <span className="text-sm font-semibold">Notes</span>
                            <p className="text-sm text-muted-foreground">{finding.notes}</p>
                          </div>
                        )}
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
