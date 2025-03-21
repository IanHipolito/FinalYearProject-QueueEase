import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LoginIcon from '@mui/icons-material/Login';

const CallToAction: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ 
      py: 10, 
      backgroundColor: '#6f42c1',
      backgroundImage: 'linear-gradient(135deg, #6f42c1 0%, #8551d9 100%)',
    }}>
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', color: 'white' }}>
          <Typography variant="h3" fontWeight={700} gutterBottom>
            Ready to Skip the Line?
          </Typography>
          <Typography variant="h6" paragraph sx={{ mb: 4, opacity: 0.9 }}>
            Join thousands of people who have already simplified their waiting experience
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button 
              variant="contained"
              size="large"
              onClick={() => navigate('/signup')}
              startIcon={<PersonAddIcon />}
              sx={{ 
                bgcolor: '#ffffff',
                color: '#6f42c1',
                fontWeight: 600,
                '&:hover': { bgcolor: '#f0f0f0' },
                borderRadius: 2,
                px: 3
              }}
            >
              Sign Up Now
            </Button>
            <Button 
              variant="outlined"
              size="large"
              onClick={() => navigate('/login')}
              startIcon={<LoginIcon />}
              sx={{ 
                borderColor: '#fff',
                color: '#fff',
                '&:hover': { borderColor: '#f0f0f0', bgcolor: 'rgba(255,255,255,0.1)' },
                borderRadius: 2,
                px: 3
              }}
            >
              Login
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default CallToAction;