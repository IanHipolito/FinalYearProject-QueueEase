import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'context/AuthContext';
import { Box, Typography, useTheme } from '@mui/material';
import { API } from '../services/api';
import PageContainer from '../components/common/PageContainer';
import PageHeader from '../components/common/PageHeader';
import StyledCard from '../components/common/StyledCard';
import AppointmentForm from '../components/appointments/AppointmentForm';

const AddAppointment: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const handleSubmit = async (orderID: string) => {
    if (!user?.id) {
      throw new Error('You must be logged in to add appointments');
    }
    
    const response = await API.appointments.addAppointment(orderID, user.id);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to add appointment.');
    }
    
    const data = await response.json();
    alert('Appointment added successfully!');
    navigate(`/appointment/${data.order_id}`);
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