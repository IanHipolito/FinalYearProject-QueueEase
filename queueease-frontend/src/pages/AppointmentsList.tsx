import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import {
  Box,
  Grid,
  Alert,
  Snackbar,
  Typography,
  Stack,
  useTheme
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

// Import components
import PageContainer from '../components/common/PageContainer';
import PageHeader from '../components/common/PageHeader';
import StyledCard from '../components/common/StyledCard';
import StyledButton from '../components/common/StyledButton';
import AppointmentCard from '../components/appointments/AppointmentCard';
import { formatDate } from '../utils/formatters';
import LoadingSkeleton from '../components/skeletons/LoadingSkeletons';

interface Appointment {
  order_id: string;
  appointment_date: string;
  appointment_time: string;
  service_name: string;
  appointment_title: string;
}

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
    if (user) {
      setLoading(true);
      fetch(`http://localhost:8000/api/appointments/${user.id}/`)
        .then(response => response.json())
        .then(data => {
          setAppointments(data);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching appointments:', error);
          setLoading(false);
        });
    }
  }, [user]);

  const handleViewDetails = (orderId: string) => {
    navigate(`/appointment/${orderId}`);
  };

  const handleRemoveAppointment = async (orderId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/appointment/delete/${orderId}/`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setAlert({
          open: true,
          message: "Appointment removed successfully",
          severity: 'success'
        });
        setAppointments(appointments.filter(app => app.order_id !== orderId));
      } else {
        const data = await response.json();
        setAlert({
          open: true,
          message: `Failed to remove appointment: ${data.error}`,
          severity: 'error'
        });
      }
    } catch (error) {
      console.error("Error removing appointment:", error);
      setAlert({
        open: true,
        message: "An error occurred while removing the appointment.",
        severity: 'error'
      });
    }
  };

  const generateDemoAppointments = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/generate-demo/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user?.id }),
      });
  
      if (response.ok) {
        setAlert({
          open: true,
          message: 'Demo appointments generated!',
          severity: 'success'
        });
        window.location.reload();
      } else {
        const data = await response.json();
        setAlert({
          open: true,
          message: `Failed to generate demo appointments: ${data.error}`,
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error generating demo appointments:', error);
      setAlert({
        open: true,
        message: 'Error generating demo appointments',
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
          <StyledButton
            variant="outlined"
            startIcon={<AutoAwesomeIcon />}
            onClick={generateDemoAppointments}
            sx={{ flex: { xs: '1', sm: '0 0 auto' } }}
          >
            Generate Demo Appointments
          </StyledButton>
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
            Add a new appointment or generate demo appointments to get started.
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