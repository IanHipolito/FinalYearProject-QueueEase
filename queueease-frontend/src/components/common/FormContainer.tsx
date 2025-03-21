import React from 'react';
import {
  Box, Paper, Container, Typography, Alert, ThemeProvider, createTheme, CssBaseline
} from '@mui/material';

interface FormContainerProps {
  title: string;
  children: React.ReactNode;
  error?: string;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  theme?: ReturnType<typeof createTheme>;
}

const defaultTheme = createTheme({
  palette: {
    primary: {
      main: '#6f42c1',
      light: '#8551d9',
      dark: '#5e35b1'
    }
  }
});

const FormContainer: React.FC<FormContainerProps> = ({
  title,
  children,
  error,
  maxWidth = 'sm',
  theme = defaultTheme
}) => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ 
        minHeight: '100vh', 
        py: 4,
        background: 'linear-gradient(135deg, rgba(111,66,193,0.1) 0%, rgba(133,81,217,0.05) 100%)',
      }}>
        <Container maxWidth={maxWidth}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
            <Typography variant="h5" component="h1" align="center" fontWeight="bold" mb={3}>
              {title}
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            {children}
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default FormContainer;