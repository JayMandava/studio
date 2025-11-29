"use client";

import { ReactNode, useMemo } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createMaterial3Theme } from '@/theme/material3';

type Props = {
  children: ReactNode;
};

export function MuiThemeProvider({ children }: Props) {
  // Create the theme on the client to avoid serializing functions from server to client.
  const theme = useMemo(() => createMaterial3Theme(), []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
