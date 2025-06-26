'use client';

import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

// Material UI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#ef4444', 
    },
    secondary: {
      main: '#6b7280', 
    },
    background: {
      default: '#f9fafb',
    },
  },
  typography: {
    fontFamily: inter.style.fontFamily,
  },
});

export function ClientThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}