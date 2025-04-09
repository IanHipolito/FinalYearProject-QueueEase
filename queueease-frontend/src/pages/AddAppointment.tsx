import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'context/AuthContext';
import { Box, Typography, useTheme, Alert } from '@mui/material';
import { API } from '../services/api';
import PageContainer from '../components/common/PageContainer';
import PageHeader from '../components/common/PageHeader';
import StyledCard from '../components/common/StyledCard';
import AppointmentForm from '../components/appointments/AppointmentForm';

const AddAppointment: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (orderID: string) => {
    if (!user?.id) {
      throw new Error('You must be logged in to add appointments');
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const data = await API.appointments.addAppointment(orderID, user.id);
      
      alert('Appointment added successfully!');
      navigate(`/appointment/${data.order_id}`);
    } catch (err) {
      console.error('Error adding appointment:', err);
      setError(err instanceof Error ? err.message : 'Failed to add appointment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer maxWidth="sm" centerContent>
      <PageHeader title="Add Appointment" backUrl="/appointments" />
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2, borderRadius: 2 }}
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}
      
      <StyledCard>
        <AppointmentForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </StyledCard>

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
    </PageContainer>
  );
};

export default AddAppointment;