import { createTheme } from '@mui/material/styles';

// EdgeTech color palette
const edgeTechColors = {
  purple: {
    main: '#5E2E8E', // Purple from the logo
    light: '#7B4BA7',
    dark: '#4A2370',
    contrastText: '#FFFFFF',
  },
  green: {
    main: '#A4FF00', // Bright green from the logo
    light: '#BEFF4D',
    dark: '#8BD500',
    contrastText: '#000000',
  }
};

// Create a theme instance with EdgeTech colors
const theme = createTheme({
  palette: {
    primary: edgeTechColors.purple,
    secondary: edgeTechColors.green,
    background: {
      default: '#f8f8f8',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: edgeTechColors.purple.main,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          textTransform: 'none',
          fontWeight: 500,
        },
        containedSecondary: {
          color: '#000000',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#FFFFFF',
          borderRight: `1px solid #E0E0E0`,
        },
      },
    },
  },
});

export default theme; 