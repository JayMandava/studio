import { createTheme } from '@mui/material/styles';
import type { ThemeOptions } from '@mui/material/styles';

// Theme options (plain object) so we avoid passing non-serializable functions from server to client.
export const material3ThemeOptions: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: '#1A73E8', // Google blue
      light: '#E8F0FE',
      dark: '#0F5ABB',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#34A853', // Google green
      light: '#E6F4EA',
      dark: '#1E7B39',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#EA4335', // Google red
      light: '#FCE8E6',
      dark: '#C5221F',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#FBBC04', // Google yellow
      light: '#FEF7E0',
      dark: '#C08900',
      contrastText: '#202124',
    },
    background: {
      default: '#F8F9FA',
      paper: '#FFFFFF',
    },
    divider: '#DADCE0',
    text: {
      primary: '#202124',
      secondary: '#5F6368',
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Roboto", "Inter", system-ui, -apple-system, "Segoe UI", sans-serif',
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 999, // pill-ish, but still subtle
        },
      },
    },
  },
};

export const createMaterial3Theme = () => createTheme(material3ThemeOptions);
