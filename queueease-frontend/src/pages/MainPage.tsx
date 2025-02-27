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
  Toolbar
} from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MapIcon from '@mui/icons-material/Map';
import LoyaltyIcon from '@mui/icons-material/Loyalty';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const MainPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const words = ['QUEUING', 'WAITING', 'LINES'];
  const [displayText, setDisplayText] = useState(words[0]);
  const [index, setIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

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
            <Box>
              <Button 
                variant="text" 
                sx={{ color: '#6f42c1', mr: 2 }}
                onClick={() => navigate('/login')}
              >
                Log In
              </Button>
              <Button 
                variant="contained"
                sx={{ 
                  bgcolor: '#6f42c1', 
                  '&:hover': { bgcolor: '#8551d9' },
                  borderRadius: 2
                }}
                onClick={() => navigate('/signup')}
              >
                Sign Up
              </Button>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Hero Section */}
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
                  endIcon={<QrCodeScannerIcon />}
                  onClick={() => navigate('/qrscanner')}
                  sx={{ 
                    bgcolor: '#fff',
                    color: '#6f42c1',
                    fontWeight: 600,
                    '&:hover': { bgcolor: '#f0f0f0' },
                    borderRadius: 2,
                    px: 3
                  }}
                >
                  Scan QR Code
                </Button>
                <Button 
                  variant="outlined"
                  size="large"
                  endIcon={<CalendarTodayIcon />}
                  onClick={() => navigate('/appointments')}
                  sx={{ 
                    borderColor: '#fff',
                    color: '#fff',
                    '&:hover': { borderColor: '#f0f0f0', bgcolor: 'rgba(255,255,255,0.1)' },
                    borderRadius: 2,
                    px: 3
                  }}
                >
                  Book Appointment
                </Button>
              </Box>
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

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h4" fontWeight={600} textAlign="center" gutterBottom>
          Why Choose QueueEase?
        </Typography>
        <Typography variant="subtitle1" textAlign="center" color="text.secondary" sx={{ mb: 6, maxWidth: '800px', mx: 'auto' }}>
          Our platform is designed to transform the traditional queuing experience into a more efficient and enjoyable process.
        </Typography>
        
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card sx={{ 
                height: '100%', 
                borderRadius: 4,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 12px 20px rgba(0,0,0,0.1)'
                }
              }}>
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  <Box sx={{ mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Call to Action */}
      <Box sx={{ 
        bgcolor: '#f0f0f5',
        py: 6,
        textAlign: 'center'
      }}>
        <Container maxWidth="md">
          <Typography variant="h4" fontWeight={600} gutterBottom>
            Ready to transform your waiting experience?
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
            Join thousands of satisfied customers who have already made the switch to virtual queues.
          </Typography>
          <Button 
            variant="contained" 
            size="large"
            endIcon={<MapIcon />}
            onClick={() => navigate('/location')}
            sx={{ 
              bgcolor: '#6f42c1', 
              '&:hover': { bgcolor: '#8551d9' },
              borderRadius: 2,
              px: 4,
              py: 1.5
            }}
          >
            Find a Location Near You
          </Button>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ 
        bgcolor: '#fff',
        py: 4,
        borderTop: '1px solid',
        borderColor: 'divider'
      }}>
        <Container maxWidth="lg">
          <Grid container spacing={2} justifyContent="space-between" alignItems="center">
            <Grid item>
              <Typography variant="body2" color="text.secondary">
                © 2023 QueueEase. All rights reserved.
              </Typography>
            </Grid>
            <Grid item>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ cursor: 'pointer' }}>
                  Privacy Policy
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ cursor: 'pointer' }}>
                  Terms of Service
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ cursor: 'pointer' }}>
                  Contact Us
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default MainPage;