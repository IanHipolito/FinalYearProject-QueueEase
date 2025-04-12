import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'context/AuthContext';
import { API } from '../services/api';
import { Grid, Alert, Snackbar, Typography, Stack, useTheme, CircularProgress, Box } from '@mui/material';
import PageContainer from '../components/common/PageContainer';
import PageHeader from '../components/common/PageHeader';
import StyledCard from '../components/common/StyledCard';
import AppointmentCard from '../components/appointments/AppointmentCard';
import { formatDate } from '../utils/formatters';
import LoadingSkeleton from '../components/skeletons/LoadingSkeletons';
import { Appointment } from 'types/appointmentTypes';
import { useAuthGuard } from '../hooks/useAuthGuard';

const AppointmentsList: React.FC = () => {
  const { authenticated, loading: authLoading } = useAuthGuard();
  
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
    // Only fetch appointments if user is authenticated
    if (!authenticated || !user?.id) return;
    
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        
        // First check and update appointment status
        try {
          await API.appointments.checkAndUpdateAppointments();
        } catch (checkError) {
          console.warn('Error checking appointments status:', checkError);
        }
        
        const data = await API.appointments.getAll(user.id);
        
        // Add type safety by ensuring data is an array
        if (Array.isArray(data)) {
          setAppointments(data.map(appointment => ({
            ...appointment,
            // Ensure required fields exist with defaults
            order_id: appointment.order_id || `APT-${Math.random().toString(36).substr(2, 9)}`,
            service_name: appointment.service_name || 'Unknown Service',
            appointment_date: appointment.appointment_date || new Date().toISOString().split('T')[0],
            appointment_time: appointment.appointment_time || '12:00',
            status: appointment.status || 'pending'
          })));
        } else {
          // Handle case where API doesn't return an array
          setAppointments([]);
          throw new Error('Invalid data format received from server');
        }
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
  }, [authenticated, user?.id]);

  const handleViewDetails = (orderId: string) => {
    navigate(`/appointment/${orderId}`);
  };

  const handleRemoveAppointment = async (orderId: string) => {
    // Confirm deletion with the user for better UX
    const confirmDelete = window.confirm(
      'Are you sure you want to remove this appointment? This action cannot be undone.'
    );
    
    if (!confirmDelete) return;
    
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

  // Show loading state during auth check
  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress size={40} sx={{ color: theme.palette.primary.main }} />
      </Box>
    );
  }

  return (
    <PageContainer maxWidth="md">
      <PageHeader title="Your Appointments" backUrl="/usermainpage" />
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