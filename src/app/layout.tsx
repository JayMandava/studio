import type {Metadata} from 'next';
import './globals.css';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from "@/components/ui/toaster";
import { MuiThemeProvider } from '@/components/providers/mui-theme-provider';

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
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <MuiThemeProvider>
          <SidebarProvider>
            {children}
          </SidebarProvider>
          <Toaster />
        </MuiThemeProvider>
      </body>
    </html>
  );
}
