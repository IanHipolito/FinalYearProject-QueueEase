import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  IconButton,
  Chip,
  LinearProgress,
  Card,
  CardContent,
  Divider,
  Skeleton,
  useTheme
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventIcon from '@mui/icons-material/Event';
import ScheduleIcon from '@mui/icons-material/Schedule';
import StorefrontIcon from '@mui/icons-material/Storefront';
import QueueIcon from '@mui/icons-material/Queue';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';

interface AppointmentDetail {
  order_id: string;
  appointment_date: string;
  appointment_time: string;
  service_name: string;
  queue_status: string;
  estimated_wait_time: number;
  queue_position: number;
  appointment_title: string;
  expected_start_time: string;
}

const AppointmentDetail: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    const fetchAppointment = () => {
      fetch(`http://localhost:8000/api/appointment/${orderId}/`)
        .then(response => response.json())
        .then(data => {
          setAppointment(data);
        })
        .catch(error => console.error('Error fetching appointment details:', error));
    };

    fetchAppointment();
    const pollingInterval = setInterval(fetchAppointment, 60000);
    return () => clearInterval(pollingInterval);
  }, [orderId]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (appointment) {
      const updateRemainingTime = () => {
        const expectedTime = new Date(appointment.expected_start_time).getTime();
        const diffInSeconds = Math.max(0, Math.floor((expectedTime - Date.now()) / 1000));
        setRemainingTime(diffInSeconds);
      };
      updateRemainingTime();
      timer = setInterval(updateRemainingTime, 1000);
    }
    return () => timer && clearInterval(timer);
  }, [appointment]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const progressPercentage = appointment ? (remainingTime / (appointment.estimated_wait_time * 60)) * 100 : 0;

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'completed':
        return 'info';
      default:
        return 'default';
    }
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
            onClick={() => navigate(-1)} 
            sx={{ 
              mr: 2,
              color: theme.palette.primary.main,
              '&:hover': { bgcolor: 'rgba(111, 66, 193, 0.08)' }
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" fontWeight={700} color="text.primary">
            Appointment Details
          </Typography>
        </Box>

        {appointment ? (
          <Card
            elevation={2}
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)'
              }
            }}
          >
            <Box sx={{ 
              bgcolor: theme.palette.primary.main, 
              py: 3, 
              px: 3, 
              color: 'white'
            }}>
              <Typography variant="h5" fontWeight={600}>
                {appointment.appointment_title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <ConfirmationNumberIcon sx={{ mr: 1, fontSize: 18 }} />
                <Typography variant="body2">
                  Order ID: {appointment.order_id}
                </Typography>
              </Box>
            </Box>

            <CardContent sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <StorefrontIcon sx={{ mr: 2, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Service
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {appointment.service_name}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <QueueIcon sx={{ mr: 2, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Queue Status
                      </Typography>
                      <Chip 
                        label={appointment.queue_status} 
                        size="small"
                        color={getStatusColor(appointment.queue_status) as any}
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <EventIcon sx={{ mr: 2, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Appointment Date
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {formatDate(appointment.appointment_date)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <AccessTimeIcon sx={{ mr: 2, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Appointment Time
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {appointment.appointment_time}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <ScheduleIcon sx={{ mr: 2, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Waiting Time
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {appointment.estimated_wait_time} minutes
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <QueueIcon sx={{ mr: 2, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Queue Position
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        #{appointment.queue_position}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Time Remaining
                </Typography>
                <Box sx={{ position: 'relative', mt: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={100 - progressPercentage}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      bgcolor: 'rgba(0, 0, 0, 0.08)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: theme.palette.primary.main,
                      }
                    }}
                  />
                </Box>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  mt: 2
                }}>
                  <AccessTimeIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                  <Typography variant="h6" fontWeight={600} color={theme.palette.primary.main}>
                    {formatTime(remainingTime)} remaining
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ) : (
          <Paper
            elevation={0}
            sx={{ 
              borderRadius: 3,
              p: 3,
              border: `1px solid ${theme.palette.divider}`
            }}
          >
            <Skeleton variant="rectangular" height={40} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" height={20} sx={{ mb: 1 }} />
            <Skeleton variant="rectangular" height={20} sx={{ mb: 1 }} />
            <Skeleton variant="rectangular" height={20} sx={{ mb: 1 }} />
            <Skeleton variant="rectangular" height={20} sx={{ mb: 1 }} />
            <Skeleton variant="rectangular" height={40} sx={{ mt: 2 }} />
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default AppointmentDetail;