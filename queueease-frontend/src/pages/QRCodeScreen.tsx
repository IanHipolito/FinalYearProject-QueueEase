import React, { useState, useEffect } from "react";
import { Box, Container, Typography, Paper, CircularProgress, ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { keyframes } from '@emotion/react';
import { API } from '../services/api';
import { QRCodeScreenProps } from "types/queueTypes";

const API_BASE =
    window.location.hostname === "localhost"
        ? "http://127.0.0.1:8000/api"
        : "https://c21436494.pythonanywhere.com/api";

const theme = createTheme({
  palette: {
    primary: {
      main: '#6f42c1',
      light: '#8551d9',
      dark: '#5e35b1'
    },
    secondary: {
      main: '#4caf50',
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff'
    },
    text: {
      primary: '#212529',
      secondary: '#6c757d'
    },
    error: {
      main: '#dc3545'
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.5px'
    },
    body1: {
      lineHeight: 1.6
    }
  },
  shape: {
    borderRadius: 12
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)'
        }
      }
    }
  }
});

const pulse = keyframes`
  0% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); opacity: 0.8; }
`;

const QRCodeScreen: React.FC<QRCodeScreenProps> = ({ queueId }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!queueId) {
      setError("Invalid Queue ID");
      setLoading(false);
      return;
    }
    
    const fetchQRCode = async () => {
      try {
        // For QR code we need to handle differently since it returns a blob not JSON
        const response = await fetch(`${API_BASE}/get-qr-code/${queueId}/`);
        
        if (!response.ok) {
          let errorMessage = `API Error: ${response.status} ${response.statusText}`;
          
          try {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const errorData = await response.json();
              errorMessage = errorData.error || errorData.detail || errorMessage;
            } else {
              const textError = await response.text();
              if (textError) errorMessage = textError;
            }
          } catch (parseError) {
            console.error("Error parsing API error response:", parseError);
          }
          
          throw new Error(errorMessage);
        }
        
        // Create a blob URL from the response
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setQrCodeUrl(url);
      } catch (err) {
        console.error("Error fetching QR code:", err);
        setError(err instanceof Error ? err.message : "Failed to generate QR code");
      } finally {
        setLoading(false);
      }
    };
    
    // Add a small timeout to show loading state
    setTimeout(() => {
      fetchQRCode();
    }, 500);
  }, [queueId]);

  // Clean up the blob URL when component unmounts
  useEffect(() => {
    return () => {
      if (qrCodeUrl && qrCodeUrl.startsWith('blob:')) {
        URL.revokeObjectURL(qrCodeUrl);
      }
    };
  }, [qrCodeUrl]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="sm" sx={{ mt: 6, mb: 6 }}>
        <Paper elevation={3} sx={{ 
          p: { xs: 3, sm: 5 }, 
          borderRadius: 3,
          background: 'linear-gradient(145deg, #ffffff, #f8f9fa)',
          textAlign: 'center'
        }}>
          <Box sx={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <Box sx={{ 
              backgroundColor: 'rgba(111, 66, 193, 0.1)',
              borderRadius: '50%', 
              p: 2,
              mb: 2
            }}>
              <QrCodeScannerIcon 
                color="primary" 
                sx={{ fontSize: 60 }} 
              />
            </Box>
            <Typography variant="h4" gutterBottom fontWeight="bold">
              QR Code
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: '90%', mx: 'auto' }}>
              Please scan this QR code with your device to proceed with your order.
            </Typography>
            
            {loading ? (
              <Box sx={{ py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <CircularProgress size={60} sx={{ mb: 2 }} />
                <Typography variant="body1">
                  Generating QR code...
                </Typography>
              </Box>
            ) : error ? (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                p: 4, 
                backgroundColor: 'rgba(220, 53, 69, 0.05)', 
                borderRadius: 2,
                mb: 3
              }}>
                <ErrorOutlineIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="body1" color="error.main" fontWeight="medium">
                  {error}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ 
                position: 'relative',
                mb: 4
              }}>
                <Box sx={{
                  position: 'absolute',
                  top: -10,
                  left: -10,
                  right: -10,
                  bottom: -10,
                  borderRadius: 4,
                  border: '2px solid rgba(111, 66, 193, 0.3)',
                  animation: `${pulse} 2s infinite ease-in-out`,
                  zIndex: 0
                }} />
                <Paper elevation={4} sx={{ 
                  p: 2, 
                  borderRadius: 3,
                  display: 'inline-block',
                  backgroundColor: '#ffffff',
                  position: 'relative',
                  zIndex: 1
                }}>
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    style={{
                      width: 280,
                      height: 280,
                      display: 'block',
                    }}
                  />
                </Paper>
              </Box>
            )}
          </Box>
        </Paper>
      </Container>
    </ThemeProvider>
  );
};

export default QRCodeScreen;