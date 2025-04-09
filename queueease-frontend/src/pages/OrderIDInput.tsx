import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'context/AuthContext';
import { API } from '../services/api';
import { Box, Typography, TextField, Button, Paper, Container, Alert } from '@mui/material';

const OrderIDInput: React.FC = () => {
  const [orderID, setOrderID] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!orderID.trim()) {
      setError('Please enter an Order ID');
      return;
    }

    if (!user?.id) {
      setError('You must be logged in to view appointments');
      return;
    }

    try {
      setLoading(true);
      
      const data = await API.appointments.addAppointment(orderID, user.id);
      
      navigate(`/appointment/${data.order_id}`);
      
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h5" component="h1" gutterBottom align="center">
          Enter Your Order ID
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <TextField
            fullWidth
            id="orderID"
            label="Order ID"
            variant="outlined"
            value={orderID}
            onChange={(e) => setOrderID(e.target.value)}
            margin="normal"
            required
            disabled={loading}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 3, mb: 2, borderRadius: 2 }}
            disabled={loading || !orderID.trim()}
          >
            {loading ? 'Loading...' : 'Find Appointment'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default OrderIDInput;