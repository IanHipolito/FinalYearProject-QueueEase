import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  IconButton,
  useTheme
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

const AddAppointment: React.FC = () => {
  const { user } = useAuth();
  const [orderID, setOrderID] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const theme = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:8000/api/appointment/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderID, user_id: user?.id }),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error('Invalid JSON response from server.');
      }

      if (response.ok) {
        alert('Appointment added successfully!');
        navigate('/appointments');
      } else {
        setError(data.error || 'Failed to add appointment.');
      }
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'An error occurred. Please try again.');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#f5f7fb',
        py: 4,
        px: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      <Container maxWidth="sm">
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', width: '100%' }}>
          <IconButton 
            onClick={() => navigate('/appointments')} 
            sx={{ 
              mr: 2,
              color: theme.palette.primary.main,
              '&:hover': { bgcolor: 'rgba(111, 66, 193, 0.08)' }
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" fontWeight={700} color="text.primary">
            Add Appointment
          </Typography>
        </Box>

        <Paper
          elevation={2}
          sx={{
            borderRadius: 3,
            p: 4,
            width: '100%',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)'
            }
          }}
        >
          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 3, borderRadius: 2 }}
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 3
            }}
          >
            <TextField
              id="orderID"
              label="Order ID"
              variant="outlined"
              fullWidth
              value={orderID}
              onChange={(e) => setOrderID(e.target.value)}
              required
              InputProps={{
                sx: {
                  borderRadius: 2,
                }
              }}
              helperText="Enter the order ID provided to you"
            />
            
            <Button
              type="submit"
              variant="contained"
              fullWidth
              startIcon={<AddCircleOutlineIcon />}
              sx={{ 
                py: 1.5,
                borderRadius: 2,
                bgcolor: theme.palette.primary.main,
                '&:hover': {
                  bgcolor: theme.palette.primary.dark,
                  transform: 'translateY(-2px)',
                  boxShadow: '0 5px 15px rgba(111, 66, 193, 0.3)'
                },
                transition: 'all 0.2s ease',
                fontWeight: 600,
                mt: 2
              }}
            >
              Add Appointment
            </Button>
          </Box>
        </Paper>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Don't have an order ID?{' '}
            <Box 
              component="span" 
              sx={{ 
                color: theme.palette.primary.main,
                cursor: 'pointer',
                '&:hover': { textDecoration: 'underline' }
              }}
              onClick={() => navigate('/appointments')}
            >
              Go back to appointments
            </Box>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default AddAppointment;