import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'context/AuthContext';
import { API } from '../services/api';
import { Grid, Alert, Snackbar, Typography, Stack, useTheme } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PageContainer from '../components/common/PageContainer';
import PageHeader from '../components/common/PageHeader';
import StyledCard from '../components/common/StyledCard';
import StyledButton from '../components/common/StyledButton';
import AppointmentCard from '../components/appointments/AppointmentCard';
import { formatDate } from '../utils/formatters';
import LoadingSkeleton from '../components/skeletons/LoadingSkeletons';
import { Appointment } from 'types/appointmentTypes';

const AppointmentsList: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{open: boolean, message: string, severity: 'success' | 'error'}>({
    open: false,
    message: '',
    severity: 'success'
  });
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        const data = await API.appointments.getAll(user.id);
        
        setAppointments(data);
      } catch (err) {
        console.error('Error fetching appointments:', err);
        setAlert({
          open: true,
          message: err instanceof Error ? err.message : 'Failed to fetch appointments',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchAppointments();
  }, [user]);

  const handleViewDetails = (orderId: string) => {
    navigate(`/appointment/${orderId}`);
  };

  const handleRemoveAppointment = async (orderId: string) => {
    try {
      await API.appointments.deleteAppointment(orderId);
      
      // If we get here, deletion was successful
      setAlert({
        open: true,
        message: "Appointment removed successfully",
        severity: 'success'
      });
      
      // Update local state to remove the appointment
      setAppointments(appointments.filter(app => app.order_id !== orderId));
    } catch (err) {
      console.error("Error removing appointment:", err);
      setAlert({
        open: true,
        message: err instanceof Error ? err.message : "An error occurred while removing the appointment.",
        severity: 'error'
      });
    }
  };

  const handleCloseAlert = () => {
    setAlert({...alert, open: false});
  };

  return (
    <PageContainer maxWidth="md">
      <PageHeader title="Your Appointments" backUrl="/usermainpage" />
      
      <StyledCard sx={{ p: 2, mb: 3, bgcolor: 'white', border: `1px solid ${theme.palette.divider}` }}>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2} 
          sx={{ width: '100%' }}
        >
          <StyledButton
            startIcon={<AddIcon />}
            onClick={() => navigate('/add-appointment')}
            sx={{ flex: { xs: '1', sm: '0 0 auto' } }}
          >
            Add Appointment
          </StyledButton>
          {/* Remove the Generate Demo Appointments button */}
        </Stack>
      </StyledCard>

      {loading ? (
        <LoadingSkeleton variant="list" />
      ) : appointments.length === 0 ? (
        <StyledCard 
          sx={{ 
            textAlign: 'center',
            py: 4,
            px: 2,
            bgcolor: 'rgba(111, 66, 193, 0.05)',
            border: '1px dashed',
            borderColor: 'divider'
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No appointments found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {/* Message */}
            Add a new appointment to get started.
          </Typography>
        </StyledCard>
      ) : (
        <Grid container spacing={3}>
          {appointments.map(appointment => (
            <Grid item xs={12} key={appointment.order_id}>
              <AppointmentCard
                appointment={appointment}
                onView={handleViewDetails}
                onRemove={handleRemoveAppointment}
                formatDate={formatDate}
              />
            </Grid>
          ))}
        </Grid>
      )}
      
      <Snackbar 
        open={alert.open} 
        autoHideDuration={6000} 
        onClose={handleCloseAlert}
      >
        <Alert 
          onClose={handleCloseAlert} 
          severity={alert.severity} 
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
};

export default AppointmentsList;