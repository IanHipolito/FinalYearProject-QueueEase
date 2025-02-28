import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Paper,
  Card,
  CardContent,
  Icon,
  useTheme,
  useMediaQuery,
  AppBar,
  Toolbar,
  Menu,
  MenuItem
} from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MapIcon from '@mui/icons-material/Map';
import LoyaltyIcon from '@mui/icons-material/Loyalty';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

const MainPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const words = ['QUEUING', 'WAITING', 'LINES'];
  const [displayText, setDisplayText] = useState(words[0]);
  const [index, setIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

  const handleLoginMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleLoginMenuClose = () => {
    setAnchorEl(null);
  };

  const redirectToLogin = (userType: 'user' | 'admin') => {
    handleLoginMenuClose();
    if (userType === 'admin') {
      navigate('/admin-login');
    } else {
      navigate('/login');
    }
  };

  // Features data
  const features = [
    {
      icon: <AccessTimeIcon sx={{ fontSize: 40, color: '#6f42c1' }} />,
      title: 'Save Time',
      description: 'Skip physical lines and get notified when it\'s your turn'
    },
    {
      icon: <SentimentSatisfiedAltIcon sx={{ fontSize: 40, color: '#6f42c1' }} />,
      title: 'Better Experience',
      description: 'Enjoy a stress-free queuing experience with real-time updates'
    },
    {
      icon: <LoyaltyIcon sx={{ fontSize: 40, color: '#6f42c1' }} />,
      title: 'Special Offers',
      description: 'Access exclusive deals while you wait in our virtual queue'
    }
  ];

  useEffect(() => {
    const wordInterval = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        setIndex((prevIndex) => (prevIndex + 1) % words.length);
        setDisplayText(words[(index + 1) % words.length]);
        setFadeIn(true);
      }, 500);
    }, 2500);
    
    return () => clearInterval(wordInterval);
  }, [index]);

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: '#f5f7fb',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header with Login Options */}
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
            <Box>
              <Button 
                variant="contained"
                startIcon={<LoginIcon />}
                endIcon={<KeyboardArrowDownIcon />}
                onClick={handleLoginMenuClick}
                aria-controls={open ? "login-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={open ? "true" : undefined}
                sx={{ 
                  bgcolor: '#6f42c1', 
                  '&:hover': { bgcolor: '#8551d9' },
                  borderRadius: 2,
                  mr: 2
                }}
              >
                Login
              </Button>
              <Menu
                id="login-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleLoginMenuClose}
                MenuListProps={{
                  'aria-labelledby': 'login-button',
                }}
              >
                <MenuItem onClick={() => redirectToLogin('user')}>
                  <PersonAddIcon sx={{ mr: 1 }} />
                  User Login
                </MenuItem>
                <MenuItem onClick={() => redirectToLogin('admin')}>
                  <AdminPanelSettingsIcon sx={{ mr: 1 }} />
                  Admin Login
                </MenuItem>
              </Menu>
              <Button 
                variant="outlined"
                startIcon={<PersonAddIcon />}
                onClick={() => navigate('/signup')}
                sx={{ 
                  borderColor: '#6f42c1',
                  color: '#6f42c1',
                  '&:hover': { borderColor: '#8551d9', bgcolor: 'rgba(111, 66, 193, 0.04)' },
                  borderRadius: 2
                }}
              >
                Sign Up
              </Button>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Hero Section with Login Requirement Notice */}
      <Box 
        sx={{ 
          py: { xs: 8, md: 12 },
          background: 'linear-gradient(135deg, #6f42c1 0%, #8551d9 100%)',
          color: '#fff',
          textAlign: 'center'
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={5} alignItems="center">
            <Grid item xs={12} md={6} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
              <Typography variant="h2" fontWeight={700} gutterBottom>
                The Smart Way to Manage
                <Box sx={{ 
                  display: 'block', 
                  minHeight: '4rem',
                  opacity: fadeIn ? 1 : 0,
                  transition: 'opacity 0.5s ease-in-out'
                }}>
                  {displayText}
                </Box>
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, mb: 4 }}>
                Say goodbye to physical lines. Join virtual queues and get notified when it's your turn.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                <Button 
                  variant="contained"
                  size="large"
                  endIcon={<LoginIcon />}
                  onClick={() => navigate('/login')}
                  sx={{ 
                    bgcolor: '#fff',
                    color: '#6f42c1',
                    fontWeight: 600,
                    '&:hover': { bgcolor: '#f0f0f0' },
                    borderRadius: 2,
                    px: 3
                  }}
                >
                  Login to Get Started
                </Button>
                <Button 
                  variant="outlined"
                  size="large"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate('/learn-more')}
                  sx={{ 
                    borderColor: '#fff',
                    color: '#fff',
                    '&:hover': { borderColor: '#f0f0f0', bgcolor: 'rgba(255,255,255,0.1)' },
                    borderRadius: 2,
                    px: 3
                  }}
                >
                  Learn More
                </Button>
              </Box>
              <Typography variant="body2" sx={{ mt: 2, opacity: 0.9 }}>
                * Login required to access QR scanning and appointment features
              </Typography>
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box 
                component="img"
                src="/queue-illustration.svg" 
                alt="Queue Illustration"
                sx={{
                  maxWidth: '100%',
                  height: 'auto',
                  transform: 'scale(1.1)',
                  filter: 'drop-shadow(0px 10px 20px rgba(0,0,0,0.15))'
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Rest of your landing page content... */}
    </Box>
  );
};

export default MainPage;