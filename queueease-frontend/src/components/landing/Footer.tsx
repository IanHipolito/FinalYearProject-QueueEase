import React from 'react';
import { Box, Container, Typography } from '@mui/material';

const Footer: React.FC = () => {
  return (
    <Box sx={{ py: 4, bgcolor: '#1c1c1c', color: 'white' }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            QueueEase
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.7, mb: 3 }}>
            A smart solution for efficient queue management
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            © 2025 QueueEase - Ian Rainier Hipolito. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;