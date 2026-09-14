import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import theme from './theme/theme';
import './index.css';
import i18n from './i18n/config';
import { detectAndApplyCountryLanguage } from './i18n/detectCountryLanguage';
import App from './App.tsx';

// NOU — detectăm țara conexiunii (via IP) și trecem automat pe limba ei,
// dacă userul n-a ales deja manual una. Rulează în fundal, nu blochează
// primul render — dacă schimbă limba, componentele se re-randează automat
// prin i18next (deja abonate cu useTranslation).
detectAndApplyCountryLanguage((lng) => i18n.changeLanguage(lng));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);