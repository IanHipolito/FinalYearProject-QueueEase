import React from 'react';
import {
  Box,
  Container,
  Grid,
  Typography
} from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MapIcon from '@mui/icons-material/Map';

const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      icon: <QrCodeScannerIcon sx={{ fontSize: 40, color: '#6f42c1' }} />,
      title: '1. Scan QR Code',
      description: 'Scan the QR code at the venue to join the virtual queue'
    },
    {
      icon: <CalendarTodayIcon sx={{ fontSize: 40, color: '#6f42c1' }} />,
      title: '2. Join Any Service',
      description: 'Queue for restaurants, retail, healthcare, government services and more'
    },
    {
      icon: <MapIcon sx={{ fontSize: 40, color: '#6f42c1' }} />,
      title: '3. Receive Notifications',
      description: "Get updates on your queue status and when it's your turn"
    }
  ];

  return (
    <Box sx={{ py: 8, backgroundColor: '#f5f7fb' }}>
      <Container maxWidth="lg">
        <Typography variant="h3" align="center" fontWeight={600} gutterBottom>
          How It Works
        </Typography>
        <Typography variant="h6" align="center" color="text.secondary" paragraph sx={{ mb: 6 }}>
          Simple steps to manage your queue experience
        </Typography>
        
        <Grid container spacing={3} alignItems="center">
          {steps.map((step, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  width: 80, 
                  height: 80, 
                  borderRadius: '50%',
                  backgroundColor: '#e8deff',
                  mb: 2,
                  mx: 'auto'
                }}>
                  {step.icon}
                </Box>
                <Typography variant="h5" fontWeight={600}>{step.title}</Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  {step.description}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default HowItWorksSection;