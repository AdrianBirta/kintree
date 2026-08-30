import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#7c4dd4',
      light: '#9b72e0',
      dark: '#4f2a8c',
      contrastText: '#ffffff',
    },
    secondary: { main: '#9b72e0' },
    error: { main: '#d3324a' },
    success: { main: '#2f9e6a' },
    warning: { main: '#d99a3d' },
    background: {
      default: '#f8f6fb',
      paper: '#ffffff',
    },
    text: {
      primary: '#1f1a2b',
      secondary: '#5b5468',
    },
    divider: '#e7e1f0',
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: '"Inter", sans-serif',
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 12, paddingTop: 10, paddingBottom: 10 },
      },
    },
    MuiPaper: {
      styleOverrides: { root: { borderRadius: 16 } },
    },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: 20 } },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
    },
    MuiFormControl: {
      defaultProps: { size: 'small' },
    },
    // NOU — Autocomplete pune padding-ul real pe elementul .MuiAutocomplete-input
    // din interior, nu (doar) pe wrapper-ul .inputRoot. Suprascriind doar
    // inputRoot, stilul intern al MUI câștiga oricum la specificitate CSS.
    // Aici țintim ambele straturi explicit, cu selectoare care au prioritate
    // mai mare decât stilurile default ale componentei.
    MuiAutocomplete: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        inputRoot: {
          '&.MuiOutlinedInput-root': {
            paddingTop: '3.5px',
            paddingBottom: '3.5px',
          },
        },
        input: {
          paddingTop: '4.5px !important',
          paddingBottom: '4.5px !important',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 12, backgroundColor: '#f8f6fb' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 16, border: '1px solid #e7e1f0' },
      },
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: 999 } },
    },
  },
});

export default theme;