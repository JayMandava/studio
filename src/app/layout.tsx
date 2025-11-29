import type {Metadata} from 'next';
import './globals.css';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider, CssBaseline } from '@mui/material';
import { material3Theme } from '@/theme/material3';

export const metadata: Metadata = {
  title: 'HealthTestAI',
  description: 'Automated Test Case Generation for Healthcare',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider theme={material3Theme}>
          <CssBaseline />
          <SidebarProvider>
            {children}
          </SidebarProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
