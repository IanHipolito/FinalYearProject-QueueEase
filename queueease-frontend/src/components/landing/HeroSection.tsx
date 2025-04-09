import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Container, Grid, Typography } from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import LoginIcon from '@mui/icons-material/Login';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { HeroSectionProps } from 'types/commonTypes';

const HeroSection: React.FC<HeroSectionProps> = ({ displayText, fadeIn }) => {
  const navigate = useNavigate();
  
  return (
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
              The Smart Way To Manage
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
            </Box>
            <Typography variant="body2" sx={{ mt: 2, opacity: 0.9 }}>
              * Login required to access QueueEase features.
            </Typography>
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Box sx={{ 
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              height: 300
            }}>
              <Box sx={{ 
                bgcolor: '#ffffff', 
                borderRadius: '50%',
                p: 5,
                boxShadow: '0px 10px 20px rgba(0,0,0,0.15)',
                position: 'relative',
                zIndex: 2
              }}>
                <QrCodeScannerIcon sx={{ fontSize: 120, color: '#6f42c1' }} />
              </Box>
              <Box sx={{ 
                position: 'absolute',
                top: 20,
                right: '30%',
                bgcolor: '#ffffff',
                borderRadius: '50%',
                p: 2,
                boxShadow: '0px 8px 16px rgba(0,0,0,0.1)',
                zIndex: 1
              }}>
                <NotificationsActiveIcon sx={{ fontSize: 40, color: '#8551d9' }} />
              </Box>
              <Box sx={{ 
                position: 'absolute',
                bottom: 40,
                left: '30%',
                bgcolor: '#ffffff',
                borderRadius: '50%',
                p: 2,
                boxShadow: '0px 8px 16px rgba(0,0,0,0.1)',
                zIndex: 1
              }}>
                <AccessTimeIcon sx={{ fontSize: 40, color: '#8551d9' }} />
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default HeroSection;