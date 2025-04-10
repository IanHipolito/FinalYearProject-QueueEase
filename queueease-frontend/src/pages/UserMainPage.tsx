import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../services/api';
import {
  Box, Container, Typography, Button, Grid, Card, CardContent,
  CardActions, AppBar, Toolbar, Avatar, Menu,
  MenuItem, Divider, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions, Snackbar, Alert
} from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MapIcon from '@mui/icons-material/Map';
import HistoryIcon from '@mui/icons-material/History';
import FeedbackIcon from '@mui/icons-material/Feedback';
import QueueProgressAnimation from '../components/queues/QueueProgressAnimation';
import LogoutIcon from '@mui/icons-material/Logout';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import InsightsIcon from '@mui/icons-material/Insights';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { useAuth } from '../context/AuthContext';
import { UserMainPageQueue } from '../types/queueTypes';
import { useAuthGuard } from '../hooks/useAuthGuard';

const UserMainPage: React.FC = () => {
  const { authenticated, loading: authLoading } = useAuthGuard();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [autoCompletionAttempted, setAutoCompletionAttempted] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isLeavingQueue, setIsLeavingQueue] = useState<boolean>(false);
  const [activeQueue, setActiveQueue] = useState<UserMainPageQueue | null>(null);
  const [isTransferred, setIsTransferred] = useState<boolean>(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch the active queue for the logged-in user
  useEffect(() => {
    if (!user) return;

    const fetchDetailedQueue = async (queueId: number, isInitialLoad = false) => {
      try {
        const detailData = await API.queues.getDetails(queueId);
        
        // Check if the queue was transferred
        if (detailData.is_transferred) {
          setIsTransferred(true);
        } else {
          setIsTransferred(false);
        }

        if (detailData.status !== 'pending') {
          setActiveQueue(null);
          return;
        }

        setActiveQueue((prev: UserMainPageQueue | null) => ({
          ...(prev || {}),
          id: detailData.queue_id,
          service_id: detailData.service_id,
          service_name: detailData.service_name,
          position: detailData.current_position,
          total_wait: detailData.total_wait,
          expected_ready_time: detailData.expected_ready_time,
          status: detailData.status,
          time_created: detailData.time_created
        }));
      } catch (error) {
        if (isInitialLoad) {
          setActiveQueue(null);
        }
      } finally {
        if (isInitialLoad) {
          setInitialLoading(false);
        } else {
          setRefreshing(false);
        }
      }
    };

    const fetchActiveQueue = async (isInitialLoad = false) => {
      if (isInitialLoad) {
        setInitialLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        if (isInitialLoad) {
          setActiveQueue(null);
        }

        if (!user) return;
        
        const data = await API.queues.getActive(user.id);
        
        // If data is null, it means no active queue (expected state)
        if (!data) {
          setActiveQueue(null);
          if (isInitialLoad) {
            setInitialLoading(false);
          } else {
            setRefreshing(false);
          }
          return;
        }

        // If we get here, we have active queue data
        if (data && data.queue_id && data.current_position !== undefined) {
          const basicQueue = {
            ...(activeQueue || {}),
            id: data.queue_id,
            service_id: data.service_id,
            service_name: data.service_name,
            position: data.current_position,
            status: 'pending'
          };

          setActiveQueue(basicQueue);
          await fetchDetailedQueue(data.queue_id, isInitialLoad);
        } else {
          if (activeQueue !== null) {
            setActiveQueue(null);
          }
          
          if (isInitialLoad) {
            setInitialLoading(false);
          } else {
            setRefreshing(false);
          }
        }
      } catch (error) {
        if (activeQueue !== null) {
          setActiveQueue(null);
        }
        
        if (isInitialLoad) {
          setInitialLoading(false);
        } else {
          setRefreshing(false);
        }
      }
    };

    fetchActiveQueue(true);

    const intervalId = setInterval(() => fetchActiveQueue(false), 5000);
    return () => clearInterval(intervalId);
  }, [user]);

  useEffect(() => {
    if (activeQueue &&
      activeQueue.id &&
      activeQueue.expected_ready_time &&
      activeQueue.status === 'pending') {

      const expectedMs = new Date(activeQueue.expected_ready_time).getTime();
      const nowMs = Date.now();
      const diffSec = Math.max(0, Math.floor((expectedMs - nowMs) / 1000));
      setRemainingTime(diffSec);

      // Auto-complete when time reaches zero or is negative
      if (diffSec <= 0 && !isLeavingQueue && !autoCompletionAttempted) {
        setAutoCompletionAttempted(true);

        API.queues.completeQueue(activeQueue.id)
          .then(data => {
            if (data.status === 'completed') {
              setActiveQueue(null);
              setTimeout(() => {
                refreshQueueData(false);
                setAutoCompletionAttempted(false);
              }, 500);
            } else {
              // Reset if not completed so we can try again later
              setTimeout(() => setAutoCompletionAttempted(false), 30000);
            }
          })
          .catch(error => {
            // Reset on error so we can try again
            setTimeout(() => setAutoCompletionAttempted(false), 30000);
          });
      }
    } else {
      // Reset when active queue changes or is removed
      setAutoCompletionAttempted(false);
    }
  }, [activeQueue, isLeavingQueue, remainingTime]);

  const handleProfileMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const refreshQueueData = async (showLoading = true) => {
    if (showLoading) {
      setRefreshing(true);
    }

    try {
      if (!user) return;
      
      const activeQueueData = await API.queues.getActive(user.id);
      
      if (activeQueueData && activeQueueData.queue_id && activeQueueData.current_position !== undefined) {
        const basicQueue = {
          ...(activeQueue || {}),
          id: activeQueueData.queue_id,
          service_id: activeQueueData.service_id,
          service_name: activeQueueData.service_name,
          position: activeQueueData.current_position,
          status: 'pending'
        };

        setActiveQueue(basicQueue);

        try {
          const detailData = await API.queues.getDetails(activeQueueData.queue_id);
          
          // Check if the queue was transferred
          if (detailData.is_transferred) {
            setIsTransferred(true);
          } else {
            setIsTransferred(false);
          }

          if (detailData.status === 'pending') {
            setActiveQueue((prev: UserMainPageQueue | null) => ({
              ...(prev || {}),
              id: detailData.queue_id,
              service_id: detailData.service_id,
              service_name: detailData.service_name,
              position: detailData.current_position,
              total_wait: detailData.total_wait,
              expected_ready_time: detailData.expected_ready_time,
              status: detailData.status,
              time_created: detailData.time_created,
            }));
          } else {
            setActiveQueue(null);
          }
        } catch (detailError) {
        }
      } else {
        setActiveQueue(null);
      }
    } catch (error) {
      setActiveQueue(null);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLeaveQueue = async () => {
    if (!activeQueue?.id) return;

    setIsLeavingQueue(true);

    try {
      await API.queues.leaveQueue(activeQueue.id);
      
      setActiveQueue(null);
      setSnackbar({
        open: true,
        message: 'You have successfully left the queue',
        severity: 'success'
      });
      setTimeout(() => refreshQueueData(false), 500);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : "Failed to leave the queue. Please try again.",
        severity: 'error'
      });
    } finally {
      setIsLeavingQueue(false);
      setConfirmDialogOpen(false);
    }
  };

  const handleNavigateToTransfer = () => {
    if (activeQueue && activeQueue.id) {
      navigate('/mapproximity');
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  // Show loading state during auth check
  if (authLoading) {
    return <CircularProgress />;
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      backgroundColor: '#f5f7fb',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <AppBar position="static" color="transparent" elevation={0} sx={{ backgroundColor: '#fff' }}>
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: '#6f42c1',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              QueueEase
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box
                onClick={handleProfileMenuClick}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  '&:hover': { opacity: 0.9 }
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: '#6f42c1',
                    width: 40,
                    height: 40
                  }}
                >
                  {user.name ? user.name.charAt(0) : '?'}
                </Avatar>
                <Typography
                  variant="subtitle2"
                  sx={{
                    ml: 1,
                    display: { xs: 'none', sm: 'block' }
                  }}
                >
                  {user.name}
                </Typography>
              </Box>

              <Menu
                anchorEl={anchorEl}
                id="account-menu"
                open={open}
                onClose={handleProfileMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <LogoutIcon sx={{ mr: 2 }} /> Logout
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 6, flexGrow: 1 }}>
        {initialLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress sx={{ color: '#6f42c1' }} />
          </Box>
        ) : (activeQueue &&
          activeQueue.id &&
          activeQueue.status === 'pending' &&
          activeQueue.position !== undefined) ? (
          <Card
            sx={{
              borderRadius: 4,
              mb: 4,
              background: 'linear-gradient(135deg, #6f42c1 0%, #8551d9 100%)',
              color: '#fff',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {refreshing && (
              <Box sx={{
                position: 'absolute',
                top: 10,
                right: 10,
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                bgcolor: 'rgba(255,255,255,0.2)',
                borderRadius: 10,
                px: 1,
                py: 0.5
              }}>
                <CircularProgress size={14} sx={{ color: '#fff', mr: 1 }} />
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Updating...
                </Typography>
              </Box>
            )}
            <CardContent sx={{ p: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={8}>
                  <Typography variant="h5" fontWeight={600} gutterBottom>
                    You are currently in queue
                  </Typography>
                  <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
                    {activeQueue.service_name || 'Service'}
                  </Typography>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body1">
                      {activeQueue.position !== undefined && activeQueue.position !== null ? (
                        <>Your position: <strong>#{activeQueue.position}</strong></>
                      ) : (
                        <>Queue registered - awaiting position</>
                      )}
                    </Typography>
                  </Box>
                  {activeQueue.position !== undefined && activeQueue.position !== null &&
                    remainingTime > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AccessTimeIcon sx={{ mr: 1, fontSize: 20, opacity: 0.9 }} />
                        <Typography variant="body1">
                          Estimated wait: {Math.round(remainingTime / 60)} min
                        </Typography>
                      </Box>
                    )}
                </Grid>
                <Grid item xs={12} sm={4} sx={{ textAlign: 'right' }}>
                  <Box sx={{
                    display: 'inline-flex',
                    bgcolor: 'rgba(255,255,255,0.2)',
                    borderRadius: '50%',
                    p: 2
                  }}>
                    <Box sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {activeQueue.position !== undefined && activeQueue.position !== null ? (
                        <>
                          <Typography variant="h3" fontWeight={700} lineHeight={1}>
                            {activeQueue.position}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            in line
                          </Typography>
                        </>
                      ) : (
                        <AccessTimeIcon sx={{ fontSize: 48 }} />
                      )}
                    </Box>
                  </Box>
                </Grid>

                {/* Queue Progress */}
                {activeQueue.position !== undefined && activeQueue.position !== null && (activeQueue.position > 0) && (
                  <Grid item xs={12}>
                    <QueueProgressAnimation position={activeQueue.position} />
                  </Grid>
                )}

                {/* Show transferred indicator if applicable */}
                {isTransferred && (
                  <Grid item xs={12}>
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mt: 2,
                      bgcolor: 'rgba(255,255,255,0.2)',
                      p: 1,
                      borderRadius: 1
                    }}>
                      <SwapHorizIcon sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        This queue was transferred from another location
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </CardContent>
            <CardActions sx={{ bgcolor: 'rgba(0,0,0,0.1)', p: 2 }}>
              <Button
                variant="contained"
                size="medium"
                onClick={() => navigate(`/success/${activeQueue.id}`)}
                sx={{
                  bgcolor: '#fff',
                  color: '#6f42c1',
                  '&:hover': { bgcolor: '#f0f0f0' },
                  borderRadius: 2,
                  fontWeight: 600,
                  mr: 1
                }}
              >
                View Details
              </Button>

              {/* Add Transfer Button - only for immediate services */}
              {activeQueue.service_id && (
                <Button
                  variant="outlined"
                  size="medium"
                  onClick={handleNavigateToTransfer}
                  startIcon={<SwapHorizIcon />}
                  sx={{
                    borderColor: '#fff',
                    color: '#fff',
                    mr: 1,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                    borderRadius: 2
                  }}
                >
                  Transfer
                </Button>
              )}

              <Button
                variant="outlined"
                size="medium"
                disabled={isLeavingQueue}
                onClick={() => setConfirmDialogOpen(true)}
                sx={{
                  borderColor: '#fff',
                  color: '#fff',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                  borderRadius: 2,
                  position: 'relative'
                }}
              >
                {isLeavingQueue ? (
                  <>
                    <CircularProgress
                      size={24}
                      sx={{
                        color: '#fff',
                        position: 'absolute',
                        left: '50%',
                        marginLeft: '-12px'
                      }}
                    />
                    <span style={{ visibility: 'hidden' }}>Leave Queue</span>
                  </>
                ) : (
                  'Leave Queue'
                )}
              </Button>
            </CardActions>
          </Card>
        ) : (
          <Card
            sx={{
              borderRadius: 4,
              mb: 4,
              position: 'relative',
              overflow: 'hidden',
              border: '1px dashed',
              borderColor: 'divider',
              bgcolor: 'rgba(111, 66, 193, 0.05)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 8px 25px rgba(111, 66, 193, 0.2)',
                borderColor: '#6f42c1',
                transform: 'translateY(-5px)'
              }
            }}
          >
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Box
                sx={{
                  mb: 3,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    animation: 'pulse 2s infinite',
                    '@keyframes pulse': {
                      '0%': {
                        transform: 'scale(1)',
                        opacity: 1,
                      },
                      '50%': {
                        transform: 'scale(1.1)',
                        opacity: 0.8,
                      },
                      '100%': {
                        transform: 'scale(1)',
                        opacity: 1,
                      },
                    },
                  }}
                >
                  <Box sx={{
                    bgcolor: 'rgba(111, 66, 193, 0.1)',
                    borderRadius: '50%',
                    p: 3,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    position: 'relative',
                    zIndex: 1
                  }}>
                    <QrCodeScannerIcon sx={{ fontSize: 64, color: '#6f42c1' }} />
                  </Box>
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      borderRadius: '50%',
                      bgcolor: 'rgba(111, 66, 193, 0.05)',
                      animation: 'ripple 2s infinite ease-in-out',
                      '@keyframes ripple': {
                        '0%': {
                          transform: 'scale(0.9)',
                          opacity: 1,
                        },
                        '100%': {
                          transform: 'scale(1.5)',
                          opacity: 0,
                        },
                      },
                    }}
                  />
                </Box>
              </Box>
              <Typography variant="h5" fontWeight={500} gutterBottom color="textSecondary">
                You're not in any queue yet
              </Typography>
              <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
                Join a queue by scanning a QR code or selecting a service
              </Typography>
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'center',
                gap: 2
              }}>
                <Button
                  variant="contained"
                  startIcon={<QrCodeScannerIcon />}
                  onClick={() => navigate('/qrscanner')}
                  sx={{
                    borderRadius: 2,
                    bgcolor: '#6f42c1',
                    '&:hover': {
                      bgcolor: '#8551d9',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 5px 15px rgba(111, 66, 193, 0.3)'
                    },
                    transition: 'all 0.2s ease',
                    px: 3
                  }}
                >
                  Scan QR Code
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ArrowForwardIcon />}
                  onClick={() => navigate('/services')}
                  sx={{
                    borderRadius: 2,
                    borderColor: '#6f42c1',
                    color: '#6f42c1',
                    '&:hover': {
                      borderColor: '#8551d9',
                      bgcolor: 'rgba(111, 66, 193, 0.04)',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.2s ease',
                    px: 3
                  }}
                >
                  Browse Services
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Feature Grid */}
        <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
          What would you like to do?
        </Typography>

        <Grid container spacing={3}>
          {[
            {
              title: "Scan QR Code",
              description: "Scan a QR code to join a queue instantly",
              icon: <QrCodeScannerIcon sx={{ fontSize: 48, color: '#6f42c1' }} />,
              action: () => navigate('/qrscanner'),
              color: "linear-gradient(135deg, #A020F0 0%, #6f42c1 100%)"
            },
            {
              title: "View Appointments",
              description: "Schedule your visit to avoid the wait",
              icon: <CalendarTodayIcon sx={{ fontSize: 48, color: '#0d6efd' }} />,
              action: () => navigate('/appointments'),
              color: "linear-gradient(135deg, #3d8bfd 0%, #3373C4 100%)"
            },
            {
              title: "Find Location",
              description: "Find the nearest QueueEase location",
              icon: <MapIcon sx={{ fontSize: 48, color: '#198754' }} />,
              action: () => navigate('/mapproximity'),
              color: "linear-gradient(135deg, #28a745 0%, #198754 100%)"
            },
            {
              title: "Queue History",
              description: "View your previous queue activity",
              icon: <HistoryIcon sx={{ fontSize: 48, color: '#6c757d' }} />,
              action: () => navigate('/history'),
              color: "linear-gradient(135deg, #919ca6 0%, #6c757d 100%)"
            },
            {
              title: "Give Feedback",
              description: "Share your experience with us",
              icon: <FeedbackIcon sx={{ fontSize: 48, color: '#fd7e14' }} />,
              action: () => navigate('/feedback'),
              color: "linear-gradient(135deg, #ffb066 0%, #ff8c00 100%)"
            },
            {
              title: "View Analytics",
              description: "See insights about your queue usage patterns",
              icon: <InsightsIcon sx={{ fontSize: 48, color: '#FFD300' }} />,
              action: () => navigate('/analytics'),
              color: "linear-gradient(135deg, #FFD300 0%, #BA8E23 100%)"
            }
          ].map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 4,
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                  },
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <Box sx={{
                  background: feature.color,
                  p: 3,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <Box sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    borderRadius: '50%',
                    p: 2,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    {feature.icon}
                  </Box>
                </Box>
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ p: 2 }}>
                  <Button
                    size="medium"
                    endIcon={<ArrowForwardIcon />}
                    onClick={feature.action}
                    sx={{ color: '#6f42c1' }}
                  >
                    Get Started
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => !isLeavingQueue && setConfirmDialogOpen(false)}
        aria-labelledby="leave-queue-dialog-title"
      >
        <DialogTitle id="leave-queue-dialog-title">Leave Queue?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to leave this queue? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmDialogOpen(false)}
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
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Footer */}
      <Box sx={{ bgcolor: '#fff', py: 3, borderTop: '1px solid', borderColor: 'divider', mt: 'auto' }}>
        <Container maxWidth="lg">
          <Grid container justifyContent="space-between" alignItems="center">
            <Grid item>
              <Typography variant="body2" color="text.secondary">
                © 2025 QueueEase. All rights reserved.
              </Typography>
            </Grid>
            <Grid item>
              <Typography variant="body2" color="text.secondary">
                Need help? Contact Support
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default UserMainPage;