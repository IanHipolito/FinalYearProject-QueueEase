import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, CircularProgress, Container, Typography, LinearProgress, Paper, CssBaseline, ThemeProvider, createTheme, Card, CardContent, Grid } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';
import QueueIcon from '@mui/icons-material/Queue';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { keyframes } from '@emotion/react';

interface QueueData {
  queue_id: number;
  service_name: string;
  current_position: number | null;
  status: string;
  expected_ready_time: string | null;
  total_wait?: number;
  time_created?: string;
}

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
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.5px'
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      borderRadius: 8
    },
    body1: {
      lineHeight: 1.6
    }
  },
  shape: {
    borderRadius: 12
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          padding: '10px 16px',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(111, 66, 193, 0.2)'
          }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)'
        }
      }
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          height: 8
        }
      }
    }
  }
});

const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const SuccessPage: React.FC = () => {
  const { queueId } = useParams<{ queueId: string }>();
  const navigate = useNavigate();

  const [queueData, setQueueData] = useState<QueueData | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [initialTime, setInitialTime] = useState<number>(0);
  const [completionTriggered, setCompletionTriggered] = useState<boolean>(false);

  useEffect(() => {
    const fetchQueueDetails = async () => {
      if (!queueId) return;
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/queue-detail/${queueId}/`);
        if (!response.ok) {
          throw new Error('Failed to fetch queue detail');
        }
        const data: QueueData = await response.json();
        setQueueData(data);

        if (data.expected_ready_time && data.total_wait !== undefined) {
          const expectedMs = new Date(data.expected_ready_time).getTime();
          const nowMs = Date.now();
          const diffSec = Math.max(0, Math.floor((expectedMs - nowMs) / 1000));
          setRemainingTime(diffSec);
          if (!initialTime && data.total_wait > 0) {
            setInitialTime(data.total_wait);
          }
        } else {
          setRemainingTime(0);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchQueueDetails();
    const intervalId = setInterval(fetchQueueDetails, 30000);
    return () => clearInterval(intervalId);
  }, [queueId, initialTime]);

  useEffect(() => {
    if (remainingTime <= 0) return;
    const timer = setInterval(() => {
      setRemainingTime(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [remainingTime]);

  useEffect(() => {
    if (remainingTime === 0 && queueData && queueData.status === 'pending' && !completionTriggered) {
      completeQueue(queueData.queue_id);
      setCompletionTriggered(true);
    }
  }, [remainingTime, queueData, completionTriggered]);

  const completeQueue = async (queueId: number) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/queue-complete/${queueId}/`, {
        method: 'POST',
      });
      if (response.ok) {
        console.log("Queue marked as completed");
        setQueueData(prev => prev ? { ...prev, status: 'completed' } : prev);
      } else {
        console.error("Failed to mark queue as completed.");
      }
    } catch (error) {
      console.error("Error in completeQueue:", error);
    }
  };

  const progressPercentage = initialTime
    ? ((initialTime - remainingTime) / initialTime) * 100
    : 0;

  const formatTime = (seconds: number) => {
    const mm = Math.floor(seconds / 60);
    const ss = seconds % 60;
    return `${mm}m ${ss}s`;
  };

  if (queueData?.status === 'completed') {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Container maxWidth="sm" sx={{ mt: 6, mb: 6 }}>
          <Paper elevation={3} sx={{ 
            p: 5, 
            borderRadius: 3, 
            textAlign: 'center',
            background: 'linear-gradient(145deg, #ffffff, #f8f9fa)'
          }}>
            <Box sx={{ 
              mb: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <Box sx={{ 
                backgroundColor: 'rgba(76, 175, 80, 0.1)', 
                borderRadius: '50%', 
                p: 2,
                mb: 2,
                animation: `${pulse} 2s infinite ease-in-out`
              }}>
                <CheckCircleIcon 
                  color="secondary" 
                  sx={{ fontSize: 72 }} 
                />
              </Box>
              <Typography variant="h4" gutterBottom fontWeight="bold">
                Order Complete!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 1, maxWidth: '80%', mx: 'auto' }}>
                Your order has been successfully processed and is now ready.
              </Typography>
              <Typography variant="body1" color="primary" fontWeight="medium" sx={{ mb: 4 }}>
                Thank you for using our service!
              </Typography>
              <Button 
                variant="contained" 
                size="large"
                color="primary" 
                onClick={() => navigate('/usermainpage')}
                sx={{ 
                  px: 4, 
                  py: 1.5,
                  borderRadius: 2,
                  boxShadow: '0 4px 14px rgba(111, 66, 193, 0.3)',
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(111, 66, 193, 0.4)',
                  }
                }}
              >
                Return to Main Page
              </Button>
            </Box>
          </Paper>
        </Container>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="sm" sx={{ mt: 6, mb: 6 }}>
        <Paper elevation={3} sx={{ 
          p: { xs: 3, sm: 4 }, 
          borderRadius: 3,
          background: 'linear-gradient(145deg, #ffffff, #f8f9fa)'
        }}>
          {queueData ? (
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                mb: 4
              }}>
                <Box sx={{ 
                  backgroundColor: 'rgba(111, 66, 193, 0.1)', 
                  borderRadius: '50%', 
                  p: 2,
                  mb: 2
                }}>
                  <HourglassBottomIcon 
                    color="primary" 
                    sx={{ 
                      fontSize: 60, 
                      animation: `${spin} 3s linear infinite` 
                    }} 
                  />
                </Box>
                <Typography variant="h4" gutterBottom fontWeight="bold">
                  Order In Progress
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: '90%', mx: 'auto' }}>
                  We're preparing your order. Please check the details below for real-time updates.
                </Typography>
              </Box>
              
              <Grid container spacing={2.5} sx={{ mb: 4 }}>
                <Grid item xs={12}>
                  <Card sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    border: '1px solid rgba(0,0,0,0.05)'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ 
                        bgcolor: 'primary.light',  
                        color: 'white', 
                        p: 1.5, 
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2
                      }}>
                        <QueueIcon fontSize="medium" />
                      </Box>
                      <Box sx={{ textAlign: 'left', flexGrow: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Current Position
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          {queueData.current_position ?? 'Processing'}
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                </Grid>
                
                <Grid item xs={12}>
                  <Card sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    border: '1px solid rgba(0,0,0,0.05)'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ 
                        bgcolor: 'primary.light', 
                        color: 'white', 
                        p: 1.5, 
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2
                      }}>
                        <StorefrontIcon fontSize="medium" />
                      </Box>
                      <Box sx={{ textAlign: 'left', flexGrow: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Service
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          {queueData.service_name}
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                </Grid>
                
                <Grid item xs={12}>
                  <Card sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    border: '1px solid rgba(0,0,0,0.05)'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ 
                        bgcolor: 'primary.light', 
                        color: 'white', 
                        p: 1.5, 
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2
                      }}>
                        <AccessTimeIcon fontSize="medium" />
                      </Box>
                      <Box sx={{ textAlign: 'left', flexGrow: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Estimated Time Remaining
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          {formatTime(remainingTime)}
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              </Grid>
              
              <Box sx={{ mb: 4, px: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" fontWeight="medium">Progress</Typography>
                  <Typography variant="body2" fontWeight="medium">{Math.min(Math.round(progressPercentage), 100)}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(progressPercentage, 100)}
                  sx={{ 
                    height: 10, 
                    borderRadius: 2,
                    backgroundColor: 'rgba(111, 66, 193, 0.1)',
                    '.MuiLinearProgress-bar': {
                      background: 'linear-gradient(90deg, rgba(111, 66, 193, 0.8) 0%, rgba(111, 66, 193, 1) 100%)',
                    }
                  }}
                />
              </Box>
              
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => navigate('/usermainpage')}
                sx={{ 
                  px: 4, 
                  py: 1.5,
                  borderRadius: 2,
                  boxShadow: '0 4px 14px rgba(111, 66, 193, 0.3)',
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(111, 66, 193, 0.4)',
                  }
                }}
              >
                Return to Main Page
              </Button>
            </Box>
          ) : (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center', 
              alignItems: 'center', 
              py: 6 
            }}>
              <CircularProgress size={48} sx={{ mb: 3 }} />
              <Typography variant="h6" fontWeight="medium" sx={{ mb: 1 }}>
                Loading Order Details
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please wait while we retrieve your order information...
              </Typography>
            </Box>
          )}
        </Paper>
      </Container>
    </ThemeProvider>
  );
};

export default SuccessPage;