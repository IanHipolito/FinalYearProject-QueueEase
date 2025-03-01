import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  Grid,
  IconButton,
  Stack,
  Alert,
  Snackbar,
  Paper,
  Chip,
  useTheme
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StorefrontIcon from '@mui/icons-material/Storefront';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

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
  const [alert, setAlert] = useState<{open: boolean, message: string, severity: 'success' | 'error'}>({
    open: false,
    message: '',
    severity: 'success'
  });
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    if (user) {
      fetch(`http://localhost:8000/api/appointments/${user.id}/`)
        .then(response => response.json())
        .then(data => setAppointments(data))
        .catch(error => console.error('Error fetching appointments:', error));
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#f5f7fb',
        py: 4,
        px: 2
      }}
    >
      <Container maxWidth="md">
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
          <IconButton 
            onClick={() => navigate('/usermainpage')} 
            sx={{ 
              mr: 2,
              color: theme.palette.primary.main,
              '&:hover': { bgcolor: 'rgba(111, 66, 193, 0.08)' }
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" fontWeight={700} color="text.primary">
            Your Appointments
          </Typography>
        </Box>

        <Paper 
          elevation={0}
          sx={{
            borderRadius: 3,
            p: 2,
            mb: 3,
            bgcolor: 'white',
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={2} 
            sx={{ width: '100%' }}
          >
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/add-appointment')}
              sx={{ 
                borderRadius: 2,
                bgcolor: theme.palette.primary.main,
                '&:hover': { bgcolor: theme.palette.primary.dark },
                py: 1.5,
                flex: { xs: '1', sm: '0 0 auto' }
              }}
            >
              Add Appointment
            </Button>
            <Button
              variant="outlined"
              startIcon={<AutoAwesomeIcon />}
              onClick={generateDemoAppointments}
              sx={{ 
                borderRadius: 2,
                color: theme.palette.primary.main,
                borderColor: theme.palette.primary.main,
                '&:hover': { 
                  bgcolor: 'rgba(111, 66, 193, 0.08)',
                  borderColor: theme.palette.primary.dark
                },
                py: 1.5,
                flex: { xs: '1', sm: '0 0 auto' }
              }}
            >
              Generate Demo Appointments
            </Button>
          </Stack>
        </Paper>

        {appointments.length === 0 ? (
          <Card 
            sx={{ 
              borderRadius: 3,
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
          </Card>
        ) : (
          <Grid container spacing={3}>
            {appointments.map(appointment => (
              <Grid item xs={12} key={appointment.order_id}>
                <Card 
                  sx={{
                    borderRadius: 3,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                    overflow: 'hidden',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
                    }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography 
                      variant="h5" 
                      fontWeight={600} 
                      sx={{ mb: 2, color: theme.palette.primary.main }}
                    >
                      {appointment.appointment_title}
                    </Typography>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: { xs: 'column', sm: 'row' },
                      gap: 2,
                      mb: 2
                    }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        color: 'text.secondary'
                      }}>
                        <StorefrontIcon sx={{ mr: 1, fontSize: 18 }} />
                        <Typography variant="body1">
                          {appointment.service_name}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        color: 'text.secondary'
                      }}>
                        <EventIcon sx={{ mr: 1, fontSize: 18 }} />
                        <Typography variant="body1">
                          {formatDate(appointment.appointment_date)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        color: 'text.secondary'
                      }}>
                        <AccessTimeIcon sx={{ mr: 1, fontSize: 18 }} />
                        <Typography variant="body1">
                          {appointment.appointment_time}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                  
                  <Divider />
                  
                  <CardActions sx={{ p: 2, justifyContent: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleViewDetails(appointment.order_id)}
                      sx={{ 
                        borderRadius: 2,
                        borderColor: theme.palette.primary.main,
                        color: theme.palette.primary.main,
                        mr: 1,
                        '&:hover': { 
                          bgcolor: 'rgba(111, 66, 193, 0.08)',
                          borderColor: theme.palette.primary.dark
                        },
                      }}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleRemoveAppointment(appointment.order_id)}
                      sx={{ 
                        borderRadius: 2, 
                        '&:hover': { 
                          bgcolor: 'rgba(211, 47, 47, 0.08)'
                        }
                      }}
                    >
                      Remove
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
      
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
    </Box>
  );
};

export default AppointmentsList;