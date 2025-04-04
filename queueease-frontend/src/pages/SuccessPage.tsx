import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, CircularProgress, Container, Typography, LinearProgress, Paper, CssBaseline, ThemeProvider, createTheme, Card, CardContent, Grid, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Snackbar, Alert } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';
import QueueIcon from '@mui/icons-material/Queue';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LogoutIcon from '@mui/icons-material/Logout';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { keyframes } from '@emotion/react';
import { API } from '../services/api';
import { QueueData } from 'types/queueTypes';

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
  const [queueJoinTime, setQueueJoinTime] = useState<Date | null>(null);
  const [canLeaveQueue, setCanLeaveQueue] = useState<boolean>(false);
  const [completionTriggered, setCompletionTriggered] = useState<boolean>(false);
  
  // UI state
  const [isLeavingQueue, setIsLeavingQueue] = useState<boolean>(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error' | 'info' | 'warning'}>({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Transfer status states
  const [isTransferred, setIsTransferred] = useState<boolean>(false);
  const [originalQueueId, setOriginalQueueId] = useState<number | null>(null);

  const fetchQueueDetails = async () => {
    if (!queueId) return;
    try {
      const response = await API.queues.getDetails(parseInt(queueId));
      if (!response.ok) {
        throw new Error('Failed to fetch queue detail');
      }
      const data: QueueData = await response.json();
      setQueueData(data);

      // Check if this is a transferred queue
      if (data.is_transferred) {
        setIsTransferred(true);
        if (data.original_queue_id) {
          setOriginalQueueId(data.original_queue_id);
        }
      }

      // Set queue join time if not already set
      if (data.time_created && !queueJoinTime) {
        setQueueJoinTime(new Date(data.time_created));
      }

      // Check if user can leave the queue (within 3 minutes of joining)
      if (queueJoinTime) {
        const threeMinutesInMs = 3 * 60 * 1000;
        const currentTime = new Date();
        const joinedTime = new Date(queueJoinTime);
        const timeElapsed = currentTime.getTime() - joinedTime.getTime();
        setCanLeaveQueue(timeElapsed <= threeMinutesInMs);
      }

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

  useEffect(() => {
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
    if (remainingTime <= 0 && queueData && queueData.status === 'pending' && !completionTriggered) {
      // When timer reaches zero, call the check_and_complete_queue endpoint
      API.queues.completeQueue(queueData.queue_id)
        .then(response => response.json())
        .then(data => {
          console.log("Queue completion check:", data);
          if (data.status === 'completed') {
            setQueueData(prev => prev ? { ...prev, status: 'completed' } : prev);
          }
          setCompletionTriggered(true);
        })
        .catch(error => {
          console.error("Error in auto-completion check:", error);
        });
    }
  }, [remainingTime, queueData, completionTriggered]);

  const progressPercentage = initialTime
    ? ((initialTime - remainingTime) / initialTime) * 100
    : 0;

  const formatTime = (seconds: number) => {
    const mm = Math.floor(seconds / 60);
    const ss = seconds % 60;
    return `${mm}m ${ss}s`;
  };

  const handleLeaveQueue = async () => {
    if (!queueId) return;
    
    setIsLeavingQueue(true);
    try {
      const response = await API.queues.leaveQueue(parseInt(queueId));
      
      if (response.ok) {
        setSnackbar({
          open: true,
          message: 'You have successfully left the queue',
          severity: 'success'
        });
        // Navigate back to main page after a short delay
        setTimeout(() => navigate('/usermainpage'), 1500);
      } else {
        let errorMessage = 'Failed to leave the queue';
        
        // Try to get a more specific error message
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error("Error parsing response:", parseError);
          // If we can't parse the JSON, use the status text
          errorMessage = `${errorMessage}: ${response.status} ${response.statusText}`;
        }
        
        setSnackbar({
          open: true,
          message: errorMessage,
          severity: 'error'
        });
      }
    } catch (error) {
      console.error("Error leaving queue:", error);
      setSnackbar({
        open: true,
        message: 'Network error occurred while trying to leave the queue',
        severity: 'error'
      });
    } finally {
      setIsLeavingQueue(false);
      setOpenConfirmDialog(false);
    }
  };

  const handleOpenConfirmDialog = () => {
    if (!canLeaveQueue) {
      setSnackbar({
        open: true,
        message: 'You can only leave the queue within the first 3 minutes of joining',
        severity: 'warning'
      });
      return;
    }
    setOpenConfirmDialog(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
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
              
              {/* Show transferred indicator */}
              {isTransferred && (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  justifyContent: 'center',
                  mt: 1,
                  mb: 3,
                  p: 1.5,
                  bgcolor: 'rgba(25, 118, 210, 0.1)',
                  borderRadius: 2,
                  width: 'fit-content',
                  mx: 'auto'
                }}>
                  <SwapHorizIcon sx={{ mr: 1, color: '#1976d2' }} />
                  <Typography variant="body2" sx={{ color: '#1976d2' }}>
                    Queue was transferred from another location
                  </Typography>
                </Box>
              )}
              
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
              
              {/* Show transferred indicator */}
              {isTransferred && (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 3,
                  p: 2,
                  bgcolor: 'rgba(25, 118, 210, 0.1)',
                  borderRadius: 2
                }}>
                  <SwapHorizIcon sx={{ mr: 1, color: '#1976d2' }} />
                  <Typography variant="body2" sx={{ color: '#1976d2' }}>
                    Queue transferred from another location
                  </Typography>
                </Box>
              )}
              
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
              
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
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
                
                <Button 
                  variant="outlined"
                  color="error"
                  startIcon={<LogoutIcon />}
                  disabled={isLeavingQueue || !canLeaveQueue}
                  onClick={handleOpenConfirmDialog}
                  sx={{ 
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    transition: 'all 0.3s',
                    opacity: canLeaveQueue ? 1 : 0.6,
                    '&:hover': canLeaveQueue ? {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(244, 67, 54, 0.15)',
                    } : {}
                  }}
                >
                  {isLeavingQueue ? 'Leaving...' : 'Leave Queue'}
                </Button>
              </Box>
              
              {!canLeaveQueue && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                  You can only leave the queue within the first 3 minutes of joining
                </Typography>
              )}
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
      
      {/* Confirmation Dialog */}
      <Dialog
        open={openConfirmDialog}
        onClose={() => setOpenConfirmDialog(false)}
      >
        <DialogTitle>Leave Queue?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to leave this queue? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpenConfirmDialog(false)} 
            color="primary"
            disabled={isLeavingQueue}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleLeaveQueue} 
            color="error" 
            variant="contained"
            disabled={isLeavingQueue}
            startIcon={isLeavingQueue ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {isLeavingQueue ? 'Leaving...' : 'Leave Queue'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
};

export default SuccessPage;