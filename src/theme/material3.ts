import { createTheme } from '@mui/material/styles';

// Material 3 inspired light theme using Google's default color roles.
// This only affects MUI components; existing Tailwind/shadcn UI keeps working as-is.

export const material3Theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6750A4', // M3 Primary
      light: '#EADDFF',
      dark: '#4F378B',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#625B71',
      light: '#E8DEF8',
      dark: '#4A4458',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#B3261E',
      light: '#F9DEDC',
      dark: '#8C1D18',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#FFFBFE', // M3 surface
      paper: '#FFFBFE',
    },
    text: {
      primary: '#1C1B1F',
      secondary: '#49454F',
    },
    divider: '#E7E0EC',
  },
  typography: {
    fontFamily:
      '"Roboto", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
    h1: { fontWeight: 400, fontSize: '3.5625rem', letterSpacing: 0 },
    h2: { fontWeight: 400, fontSize: '2.8125rem', letterSpacing: 0 },
    h3: { fontWeight: 400, fontSize: '2.25rem', letterSpacing: 0 },
    h4: { fontWeight: 400, fontSize: '2rem', letterSpacing: 0.0075 },
    h5: { fontWeight: 400, fontSize: '1.5rem', letterSpacing: 0 },
    h6: { fontWeight: 500, fontSize: '1.25rem', letterSpacing: 0.0094 },
    body1: { fontSize: '1rem', letterSpacing: 0.0313 },
    body2: { fontSize: '0.875rem', letterSpacing: 0.0156 },
    button: { textTransform: 'none', fontWeight: 500, letterSpacing: 0.0125 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 999, // pill-style by default for a more M3 feel
        },
      },
    },
  },
});

