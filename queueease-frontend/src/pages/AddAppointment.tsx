import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Box, Typography, useTheme } from '@mui/material';

// Custom components
import PageContainer from '../components/common/PageContainer';
import PageHeader from '../components/common/PageHeader';
import StyledCard from '../components/common/StyledCard';
import AppointmentForm from '../components/appointments/AppointmentForm';

const AddAppointment: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const handleSubmit = async (orderID: string) => {
    const response = await fetch('http://localhost:8000/api/appointment/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderID, user_id: user?.id }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to add appointment.');
    }

    alert('Appointment added successfully!');
    navigate('/appointments');
  };

  return (
    <PageContainer maxWidth="sm" centerContent>
      <PageHeader title="Add Appointment" backUrl="/appointments" />
      
      <StyledCard>
        <AppointmentForm onSubmit={handleSubmit} />
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