
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DescriptionIcon from "@mui/icons-material/Description";
import ShieldIcon from "@mui/icons-material/Shield";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import BiotechIcon from "@mui/icons-material/Biotech";
import DashboardCustomizeIcon from "@mui/icons-material/DashboardCustomize";
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary via-primary/90 to-secondary/80 p-6 text-white shadow-lg">
        <div className="absolute inset-0 bg-white/5 blur-3xl" aria-hidden="true" />
        <div className="relative space-y-2">
          <h1 className="text-3xl font-bold tracking-tight font-headline">Welcome to HealthTestAI</h1>
          <p className="text-sm text-white/90">
            Your intelligent partner for automated test case generation and compliance in healthcare.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary flex-shrink-0">
                <DescriptionIcon fontSize="small" />
              </div>
              <CardTitle className="text-base">Requirements & Test Cases</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <CardDescription className="text-sm">
              Upload requirements documents to generate comprehensive test cases.
            </CardDescription>
            <Button asChild className="w-full" size="sm">
              <Link href="/requirements">
                Generate Test Cases <ArrowForwardIosIcon fontSize="inherit" className="ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary flex-shrink-0">
                <ShieldIcon fontSize="small" />
              </div>
              <CardTitle className="text-base">Data Anonymization</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <CardDescription className="text-sm">
              Anonymize sensitive health data and receive GDPR compliance reports.
            </CardDescription>
            <Button asChild className="w-full" size="sm">
              <Link href="/anonymization">
                Anonymize Data <ArrowForwardIosIcon fontSize="inherit" className="ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Core Capabilities</CardTitle>
          <CardDescription className="text-sm">
            End-to-end quality assurance solution for medical software.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3">
                <BiotechIcon fontSize="small" className="mt-0.5 text-accent-foreground" />
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">Compliance Mapping</h3>
                    <p className="text-xs text-muted-foreground">Map test cases to FDA, GDPR, and ISO 13485.</p>
                </div>
            </div>
            <div className="flex items-start gap-3">
                <BiotechIcon fontSize="small" className="mt-0.5 text-accent-foreground" />
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">Traceability Matrix</h3>
                    <p className="text-xs text-muted-foreground">Full traceability from requirements to tests.</p>
                </div>
            </div>
            <div className="flex items-start gap-3">
                <DashboardCustomizeIcon fontSize="small" className="mt-0.5 text-accent-foreground" />
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">Interactive Visualization</h3>
                    <p className="text-xs text-muted-foreground">Visualize test coverage and compliance.</p>
                </div>
            </div>
            <div className="flex items-start gap-3">
                <DashboardCustomizeIcon fontSize="small" className="mt-0.5 text-accent-foreground" />
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">ALM Integrations</h3>
                    <p className="text-xs text-muted-foreground">Connect to Jira, Azure DevOps, and more.</p>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
