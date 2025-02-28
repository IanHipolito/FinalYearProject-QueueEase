import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  AppBar,
  Toolbar,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Badge,
  Divider
} from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MapIcon from '@mui/icons-material/Map';
import NotificationsIcon from '@mui/icons-material/Notifications';
import HistoryIcon from '@mui/icons-material/History';
import FeedbackIcon from '@mui/icons-material/Feedback';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useAuth } from '../pages/AuthContext';

const UserMainPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth(); // Get the current logged-in user
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // Remove mock queue data and use null as the default.
  const [activeQueue, setActiveQueue] = useState<any>(null);
  // Mock notification count remains for demo purposes.
  const [notificationCount, setNotificationCount] = useState(3);

  // Fetch the active queue for the logged-in user
  useEffect(() => {
    if (!user) return;
    const fetchActiveQueue = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/active-queue/${user.id}/`);
        if (response.ok) {
          const data = await response.json();
          setActiveQueue(data);
        } else {
          // If no active queue is found, clear any previous state.
          setActiveQueue(null);
        }
      } catch (error) {
        console.error("Error fetching active queue:", error);
        setActiveQueue(null);
      }
    };

    if (user) {
      fetchActiveQueue();
    }
  }, [user]);

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

  // If user is not logged in, redirect to the login page.
  if (!user) {
    navigate('/login');
    return null;
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
              <IconButton sx={{ mr: 2 }} onClick={() => navigate('/notifications')}>
                <Badge badgeContent={notificationCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>

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
                <MenuItem onClick={() => navigate('/profile')}>
                  <PersonIcon sx={{ mr: 2 }} /> Profile
                </MenuItem>
                <MenuItem onClick={() => navigate('/tickets')}>
                  <ReceiptLongIcon sx={{ mr: 2 }} /> My Tickets
                </MenuItem>
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
        {/* Active Queue Card */}
        {activeQueue ? (
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
            {/* Your existing active queue card content */}
            <CardContent sx={{ p: 3 }}>
              {/* ...existing content... */}
            </CardContent>
            <CardActions sx={{ bgcolor: 'rgba(0,0,0,0.1)', p: 2 }}>
              {/* ...existing actions... */}
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
              color: "linear-gradient(135deg, #6f42c1 0%, #8551d9 100%)"
            },
            {
              title: "Book Appointment",
              description: "Schedule your visit to avoid the wait",
              icon: <CalendarTodayIcon sx={{ fontSize: 48, color: '#0d6efd' }} />,
              action: () => navigate('/appointments'),
              color: "linear-gradient(135deg, #0d6efd 0%, #3d8bfd 100%)"
            },
            {
              title: "Find Location",
              description: "Find the nearest QueueEase location",
              icon: <MapIcon sx={{ fontSize: 48, color: '#198754' }} />,
              action: () => navigate('/locations'),
              color: "linear-gradient(135deg, #198754 0%, #28a745 100%)"
            },
            {
              title: "Queue History",
              description: "View your previous queue activity",
              icon: <HistoryIcon sx={{ fontSize: 48, color: '#6c757d' }} />,
              action: () => navigate('/history'),
              color: "linear-gradient(135deg, #6c757d 0%, #919ca6 100%)"
            },
            {
              title: "Give Feedback",
              description: "Share your experience with us",
              icon: <FeedbackIcon sx={{ fontSize: 48, color: '#fd7e14' }} />,
              action: () => navigate('/feedback'),
              color: "linear-gradient(135deg, #fd7e14 0%, #ffb066 100%)"
            },
            {
              title: "View Tickets",
              description: "Access your active and past tickets",
              icon: <ReceiptLongIcon sx={{ fontSize: 48, color: '#dc3545' }} />,
              action: () => navigate('/tickets'),
              color: "linear-gradient(135deg, #dc3545 0%, #e35d6a 100%)"
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
