import React from 'react';
import { Box, Container, Grid, Paper, Typography } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import LoyaltyIcon from '@mui/icons-material/Loyalty';

const FeaturesSection: React.FC = () => {
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
      title: 'Queue Analytics',
      description: 'View estimated wait times and make informed decisions about when to join'
    }
  ];

  return (
    <Box sx={{ py: 8, backgroundColor: '#ffffff' }}>
      <Container maxWidth="lg">
        <Typography variant="h3" align="center" fontWeight={600} gutterBottom>
          Key Features
        </Typography>
        <Typography variant="h6" align="center" color="text.secondary" paragraph sx={{ mb: 6 }}>
          Discover how QueueEase revolutionizes the waiting experience
        </Typography>
        
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item key={index} xs={12} md={4}>
              <Paper elevation={2} sx={{ p: 4, height: '100%', borderRadius: 3, transition: 'transform 0.3s ease-in-out', '&:hover': { transform: 'translateY(-8px)' } }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  {feature.icon}
                  <Typography variant="h5" sx={{ mt: 2, fontWeight: 600 }}>
                    {feature.title}
                  </Typography>
                  <Typography color="text.secondary" sx={{ mt: 1 }}>
                    {feature.description}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default FeaturesSection;