import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Button, CircularProgress, Container, Typography, LinearProgress, Paper, CssBaseline, 
  ThemeProvider, createTheme, Card, Grid, Dialog, DialogTitle, DialogContent, DialogContentText, 
  DialogActions, Snackbar, Alert, useMediaQuery 
} from '@mui/material';
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
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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

  const fetchQueueDetails = useCallback(async () => {
    if (!queueId) return;
    
    try {
      const data = await API.queues.getDetails(parseInt(queueId));
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

      // Check if user can leave the queue (within 1 minutes of joining)
      if (queueJoinTime) {
        const oneMinuteInMs = 1 * 60 * 1000;
        const currentTime = new Date();
        const joinedTime = new Date(queueJoinTime);
        const timeElapsed = currentTime.getTime() - joinedTime.getTime();
        setCanLeaveQueue(timeElapsed <= oneMinuteInMs);
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
      console.error("Error fetching queue details:", err);
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : "Failed to load queue details",
        severity: 'error'
      });
    }
  }, [queueId, queueJoinTime, initialTime]);

  useEffect(() => {
    fetchQueueDetails();
    const intervalId = setInterval(fetchQueueDetails, 30000);
    return () => clearInterval(intervalId);
  }, [fetchQueueDetails]);

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
      setCompletionTriggered(true);
      
      API.queues.completeQueue(queueData.queue_id)
        .then(data => {
          console.log("Queue completion check:", data);
          if (data.status === 'completed') {
            setQueueData(prev => prev ? { ...prev, status: 'completed' } : prev);
          }
        })
        .catch(error => {
          console.error("Error in auto-completion check:", error);
          setSnackbar({
            open: true,
            message: error instanceof Error ? error.message : "Failed to complete queue",
            severity: 'error'
          });
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
      await API.queues.leaveQueue(parseInt(queueId));
      
      setSnackbar({
        open: true,
        message: 'You have successfully left the queue',
        severity: 'success'
      });
      // Navigate back to main page after a short delay
      setTimeout(() => navigate('/usermainpage'), 1500);
    } catch (error) {
      console.error("Error leaving queue:", error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : "Failed to leave the queue. Please try again.",
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
        message: 'You can only leave the queue within the first 1 minute of joining',
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
        <Container maxWidth="sm" sx={{ 
          mt: { xs: 3, sm: 6 }, 
          mb: { xs: 3, sm: 6 },
          px: { xs: 2, sm: 3 }
        }}>
          <Paper elevation={3} sx={{ 
            p: { xs: 3, sm: 5 }, 
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
                  sx={{ fontSize: { xs: 56, sm: 72 } }} 
                />
              </Box>
              <Typography variant={isMobile ? "h5" : "h4"} gutterBottom fontWeight="bold">
                Order Complete!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 1, maxWidth: '90%', mx: 'auto' }}>
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
                  px: { xs: 3, sm: 4 }, 
                  py: 1.5,
                  borderRadius: 2,
                  boxShadow: '0 4px 14px rgba(111, 66, 193, 0.3)',
                  transition: 'all 0.3s',
                  width: { xs: '100%', sm: 'auto' },
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
      <Container maxWidth="sm" sx={{ 
        mt: { xs: 3, sm: 6 }, 
        mb: { xs: 3, sm: 6 },
        px: { xs: 2, sm: 3 }
      }}>
        <Paper elevation={3} sx={{ 
          p: { xs: 2, sm: 4 }, 
          borderRadius: 3,
          background: 'linear-gradient(145deg, #ffffff, #f8f9fa)'
        }}>
          {queueData ? (
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                mb: 3
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
                      fontSize: { xs: 48, sm: 60 }, 
                      animation: `${spin} 3s linear infinite` 
                    }} 
                  />
                </Box>
                <Typography variant={isMobile ? "h5" : "h4"} gutterBottom fontWeight="bold">
                  Order In Progress
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: '95%', mx: 'auto' }}>
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
                  p: { xs: 1.5, sm: 2 },
                  bgcolor: 'rgba(25, 118, 210, 0.1)',
                  borderRadius: 2
                }}>
                  <SwapHorizIcon sx={{ mr: 1, color: '#1976d2' }} />
                  <Typography variant="body2" sx={{ color: '#1976d2', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    Queue transferred from another location
                  </Typography>
                </Box>
              )}
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12}>
                  <Card sx={{ 
                    p: { xs: 1.5, sm: 2 }, 
                    borderRadius: 2, 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    border: '1px solid rgba(0,0,0,0.05)'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ 
                        bgcolor: 'primary.light',  
                        color: 'white', 
                        p: { xs: 1, sm: 1.5 }, 
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                        minWidth: { xs: '40px', sm: '48px' },
                        minHeight: { xs: '40px', sm: '48px' }
                      }}>
                        <QueueIcon fontSize={isMobile ? "small" : "medium"} />
                      </Box>
                      <Box sx={{ textAlign: 'left', flexGrow: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Current Position
                        </Typography>
                        <Typography variant={isMobile ? "subtitle1" : "h6"} fontWeight="bold">
                          {queueData.current_position ?? 'Processing'}
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                </Grid>
                
                <Grid item xs={12}>
                  <Card sx={{ 
                    p: { xs: 1.5, sm: 2 }, 
                    borderRadius: 2, 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    border: '1px solid rgba(0,0,0,0.05)'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ 
                        bgcolor: 'primary.light', 
                        color: 'white', 
                        p: { xs: 1, sm: 1.5 }, 
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                        minWidth: { xs: '40px', sm: '48px' },
                        minHeight: { xs: '40px', sm: '48px' }
                      }}>
                        <StorefrontIcon fontSize={isMobile ? "small" : "medium"} />
                      </Box>
                      <Box sx={{ textAlign: 'left', flexGrow: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Service
                        </Typography>
                        <Typography variant={isMobile ? "subtitle1" : "h6"} fontWeight="bold">
                          {queueData.service_name}
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                </Grid>
                
                <Grid item xs={12}>
                  <Card sx={{ 
                    p: { xs: 1.5, sm: 2 }, 
                    borderRadius: 2, 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    border: '1px solid rgba(0,0,0,0.05)'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ 
                        bgcolor: 'primary.light', 
                        color: 'white', 
                        p: { xs: 1, sm: 1.5 }, 
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                        minWidth: { xs: '40px', sm: '48px' },
                        minHeight: { xs: '40px', sm: '48px' }
                      }}>
                        <AccessTimeIcon fontSize={isMobile ? "small" : "medium"} />
                      </Box>
                      <Box sx={{ textAlign: 'left', flexGrow: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Estimated Time Remaining
                        </Typography>
                        <Typography variant={isMobile ? "subtitle1" : "h6"} fontWeight="bold">
                          {formatTime(remainingTime)}
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              </Grid>
              
              <Box sx={{ mb: 3, px: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" fontWeight="medium">Progress</Typography>
                  <Typography variant="body2" fontWeight="medium">{Math.min(Math.round(progressPercentage), 100)}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(progressPercentage, 100)}
                  sx={{ 
                    height: 8, 
                    borderRadius: 2,
                    backgroundColor: 'rgba(111, 66, 193, 0.1)',
                    '.MuiLinearProgress-bar': {
                      background: 'linear-gradient(90deg, rgba(111, 66, 193, 0.8) 0%, rgba(111, 66, 193, 1) 100%)',
                    }
                  }}
                />
              </Box>
              
              {/* Action Buttons - Responsive Layout */}
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', md: 'row' }, 
                justifyContent: 'center', 
                gap: { xs: 1.5, md: 2 } 
              }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={() => navigate('/usermainpage')}
                  sx={{ 
                    px: { xs: 2, sm: 4 }, 
                    py: 1.5,
                    borderRadius: 2,
                    boxShadow: '0 4px 14px rgba(111, 66, 193, 0.3)',
                    transition: 'all 0.3s',
                    width: '100%',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(111, 66, 193, 0.4)',
                    }
                  }}
                >
                  Return to Main Page
                </Button>
                
                {/* Add Transfer Button - only for immediate services and when in pending state */}
                {queueData && queueData.status === 'pending' && (
                  <Button
                    variant="outlined"
                    size="medium"
                    onClick={() => navigate('/mapproximity')}
                    startIcon={<SwapHorizIcon />}
                    sx={{
                      borderColor: '#6f42c1',
                      color: '#6f42c1',
                      '&:hover': { 
                        bgcolor: 'rgba(111, 66, 193, 0.08)',
                        transform: 'translateY(-2px)'
                      },
                      borderRadius: 2,
                      px: { xs: 2, sm: 3 },
                      py: 1.5,
                      width: '100%',
                      transition: 'all 0.3s',
                    }}
                  >
                    Transfer
                  </Button>
                )}
                
                <Button 
                  variant="outlined"
                  color="error"
                  startIcon={<LogoutIcon />}
                  disabled={isLeavingQueue || !canLeaveQueue}
                  onClick={handleOpenConfirmDialog}
                  sx={{ 
                    px: { xs: 2, sm: 4 },
                    py: 1.5,
                    borderRadius: 2,
                    width: '100%',
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
                  You can only leave the queue within the first 1 minute of joining
                </Typography>
              )}
            </Box>
          ) : (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center', 
              alignItems: 'center', 
              py: { xs: 4, sm: 6 } 
            }}>
              <CircularProgress size={isMobile ? 40 : 48} sx={{ mb: 3 }} />
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
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Leave Queue?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to leave this queue? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
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
        sx={{ 
          bottom: { xs: 16, sm: 24 },
          width: { xs: '90%', sm: 'auto' },
          left: { xs: '5%', sm: 24 },
          right: { xs: '5%', sm: 24 }
        }}
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