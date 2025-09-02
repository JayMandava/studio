
'use client';

import React, { useState, useEffect } from 'react';
import type { ParseRequirementsAndGenerateTestCasesOutput } from '@/ai/flows/parse-requirements-and-generate-test-cases';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { jsPDF } from 'jspdf';
import {
  Trash2,
  FileText,
  Clock,
  Download,
  ChevronDown,
  ListChecks,
  Send,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

export type SavedNotebookEntry = {
  id: string;
  date: string;
  fileName: string;
  data: ParseRequirementsAndGenerateTestCasesOutput;
};

export function NotebookView() {
  const [entries, setEntries] = useState<SavedNotebookEntry[]>([]);
  const [selectedEntry, setSelectedEntry] =
    useState<SavedNotebookEntry | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [activeIntegrations, setActiveIntegrations] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
    try {
      const savedEntries = JSON.parse(
        localStorage.getItem('notebookEntries') || '[]'
      );
      setEntries(savedEntries);
      
      const savedIntegrations = localStorage.getItem('almIntegrations');
      if (savedIntegrations) {
        const parsed = JSON.parse(savedIntegrations);
        setActiveIntegrations(parsed.filter((p: any) => p.isActive));
      }
    } catch (e) {
      console.error('Failed to parse data from localStorage:', e);
      setEntries([]);
    }
  }, []);

  const handleClearHistory = () => {
    localStorage.removeItem('notebookEntries');
    setEntries([]);
  };
  
  const handleAlmExport = (tool: string) => {
    toast({
        title: `Exporting to ${tool}`,
        description: `Your test cases are being exported. This feature is coming soon.`,
    });
  }

  const handleExport = (
    format: 'csv' | 'pdf',
    entry: SavedNotebookEntry | null
  ) => {
    if (!entry || !entry.data.requirementTestCases) return;

    const { requirementTestCases } = entry.data;

    if (format === 'csv') {
      const header =
        'Requirement ID,Requirement Description,Test Case ID,Test Case Description,Compliance Standards\n';
      const rows = requirementTestCases
        .flatMap((req, reqIndex) =>
          req.testCases.map(
            (tc, tcIndex) =>
              `"${reqIndex + 1}","${req.requirement.replace(
                /"/g,
                '""'
              )}","TC-${reqIndex + 1}.${tcIndex + 1}","${tc.description.replace(
                /"/g,
                '""'
              )}","${tc.compliance.join(', ')}"`
          )
        )
        .join('\n');
      const content = header + rows;
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${entry.fileName}-test-cases.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(`Test Cases for ${entry.fileName}`, 14, 22);

      let y = 30;
      requirementTestCases.forEach((item, index) => {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        const reqLines = doc.splitTextToSize(
          `Requirement #${index + 1}: ${item.requirement}`,
          180
        );
        doc.text(reqLines, 14, y);
        y += reqLines.length * 6 + 4;

        doc.setFont(undefined, 'normal');
        item.testCases.forEach(tc => {
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
          doc.setFontSize(10);
          const tcLines = doc.splitTextToSize(`- ${tc.description}`, 175);
          doc.text(tcLines, 20, y);
          y += tcLines.length * 5;

          if (tc.compliance.length > 0) {
            doc.setFontSize(8);
            doc.setTextColor(100);
            const complianceLine = `Standards: ${tc.compliance.join(', ')}`;
            const complianceLines = doc.splitTextToSize(complianceLine, 170);
            doc.text(complianceLines, 22, y + 1);
            y += complianceLines.length * 4 + 2;
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
      a.download = `${entry.fileName}-test-cases.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  if (!isMounted) {
    return null; // or a loading skeleton
  }

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Saved Test Cases</CardTitle>
            <CardDescription>
              Review and export your previously generated test cases.
            </CardDescription>
          </div>
          {entries.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear History
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all saved notebook entries.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearHistory}>
                    Yes, delete everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardHeader>
        <CardContent>
          {entries.length > 0 ? (
            <ScrollArea className="h-96">
              <div className="space-y-4 pr-6">
                {entries.map(entry => (
                  <button
                    key={entry.id}
                    className="w-full text-left"
                    onClick={() => setSelectedEntry(entry)}
                  >
                    <div className="rounded-lg border p-4 transition-colors hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <FileText className="h-6 w-6 text-primary" />
                        <div className="flex-1">
                          <p className="font-semibold">{entry.fileName}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              Saved on{' '}
                              {new Date(entry.date).toLocaleDateString()}{' '}
                              {new Date(entry.date).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                        <Badge variant="secondary">
                          {entry.data.requirementTestCases?.reduce(
                            (acc, curr) => acc + curr.testCases.length,
                            0
                          ) || 0}{' '}
                          Test Cases
                        </Badge>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex h-60 flex-col items-center justify-center rounded-lg border border-dashed">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-center text-muted-foreground">
                Your notebook is empty.
                <br />
                Generate test cases and save them to see them here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedEntry}
        onOpenChange={isOpen => !isOpen && setSelectedEntry(null)}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <ListChecks className="h-6 w-6" />
              {selectedEntry?.fileName}
            </DialogTitle>
          </DialogHeader>

          {selectedEntry && (
            <>
              <div className="flex flex-col space-y-4">
                <p className="text-sm text-muted-foreground">
                  Saved on {new Date(selectedEntry?.date || '').toLocaleString()}
                </p>
                <div className="flex items-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button>
                        <Download className="mr-2 h-4 w-4" />
                        Export
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={() => handleExport('pdf', selectedEntry)}
                      >
                        Export as PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleExport('csv', selectedEntry)}
                      >
                        Export as CSV
                      </DropdownMenuItem>
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
              </div>
              <ScrollArea className="h-[55vh] pt-4">
                <div className="pr-6">
                  <Accordion
                    type="multiple"
                    className="w-full"
                  >
                    {selectedEntry.data.requirementTestCases?.map(
                      (item, index) => (
                        <AccordionItem key={index} value={`item-${index}`}>
                          <AccordionTrigger className="text-left hover:no-underline">
                            <div className="flex flex-col gap-1.5">
                              <span className="font-semibold text-base">
                                Requirement #{index + 1}
                              </span>
                              <p className="font-normal text-muted-foreground">
                                {item.requirement}
                              </p>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="ml-2 border-l-2 border-primary pl-4">
                              <h4 className="mb-3 mt-1 font-semibold">
                                Generated Test Cases ({item.testCases.length})
                              </h4>
                              <ul className="space-y-4">
                                {item.testCases.map((tc, tcIndex) => (
                                  <li
                                    key={tcIndex}
                                    className="prose prose-sm max-w-none list-none text-foreground"
                                  >
                                    <p className="m-0">{tc.description}</p>
                                    {tc.compliance &&
                                      tc.compliance.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                          {tc.compliance.map(standard => (
                                            <Badge
                                              key={standard}
                                              variant="outline"
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
                      )
                    )}
                  </Accordion>
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
