import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API } from '../services/api';
import { 
  Box, Typography, Button, Dialog, DialogActions, DialogContent, 
  DialogContentText, DialogTitle, Alert, useTheme, useMediaQuery, 
  Paper, Grid, CircularProgress
} from '@mui/material';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventIcon from '@mui/icons-material/Event';
import StorefrontIcon from '@mui/icons-material/Storefront';
import QueueIcon from '@mui/icons-material/Queue';
import WarningIcon from '@mui/icons-material/Warning';
import { AppointmentDetail as AppointmentDetailType } from 'types/appointmentTypes';
import { 
  stripTimezoneDesignator, 
  createDateFromStrings, 
  getHoursDifference,
  formatIrishDate,
  formatTimeString
} from '../utils/timezoneUtils';

const AppointmentDetail: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [appointment, setAppointment] = useState<AppointmentDetailType | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [formattedRemainingTime, setFormattedRemainingTime] = useState<string>('');
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [originalTime, setOriginalTime] = useState<string | null>(null);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const determineQueueStatus = (appointment: AppointmentDetailType, currentTime: Date, timeRemaining: number): string => {
    if (appointment.queue_status === 'in_queue') return 'in_queue'; 
    if (appointment.status === 'completed') return 'completed';
    if (appointment.status === 'cancelled') return 'cancelled';

    if (appointment.actual_start_time && !appointment.actual_end_time) {
      return 'in_queue';
    }

    const expectedStartTime = new Date(stripTimezoneDesignator(appointment.expected_start_time));
    const appointmentDateTime = createDateFromStrings(
      appointment.appointment_date,
      appointment.appointment_time
    );
    
    if (timeRemaining <= 0 && currentTime > appointmentDateTime) {
      return 'completed';
    }
    
    if (currentTime > expectedStartTime && currentTime > appointmentDateTime) {
      return 'in_queue';
    }
    
    const TimeBeforeQueueStart = new Date(appointmentDateTime);
    TimeBeforeQueueStart.setMinutes(TimeBeforeQueueStart.getMinutes() - 300);
    
    if (currentTime >= TimeBeforeQueueStart && currentTime < appointmentDateTime) {
      return 'in_queue';
    }
    
    return 'not_started';
  };

  const renderDelayInfo = () => {
    if (!appointment || !appointment.last_delay_minutes || appointment.last_delay_minutes < 1) {
      return null;
    }
    
    return (
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 2.5,
          borderRadius: 2,
          bgcolor: theme.palette.warning.light + '20',
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          mb: 1.5,
          gap: 1
        }}>
          <WarningIcon color="warning" />
          <Typography 
            variant="subtitle1" 
            fontWeight="medium" 
            color="warning.main"
          >
            Appointment Delayed
          </Typography>
        </Box>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Your appointment has been delayed by {appointment.last_delay_minutes} minutes due to
          longer service times today.
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Original Time
            </Typography>
            <Typography variant="body2" sx={{ textDecoration: 'line-through' }}>
              {originalTime && formatTimeString(originalTime)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              New Expected Time
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {appointment.appointment_time && formatTimeString(appointment.appointment_time)}
            </Typography>
          </Box>
        </Box>
      </Paper>
    );
  };

  const handleOpenCancelDialog = () => {
    setOpenCancelDialog(true);
    setCancelError(null);
  };

  const handleCloseCancelDialog = () => {
    setOpenCancelDialog(false);
  };

  const handleCancelAppointment = async () => {
    if (!orderId) return;
    
    try {
      await API.appointments.cancelAppointment(orderId);
      
      setCancelSuccess(true);
      setOpenCancelDialog(false);
      
      if (appointment) {
        setAppointment({
          ...appointment,
          status: 'cancelled',
          queue_status: 'cancelled'
        });
      }
      
      setTimeout(() => {
        fetchAppointment();
      }, 1000);
      
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      setCancelError(error instanceof Error ? error.message : 'An unexpected error occurred');
    }
  };

  const fetchAppointment = async () => {
    setLoading(true);
    try {
      const data = await API.appointments.getAppointmentDetails(orderId || '');
      
      if (data && data.appointment_date) {
        setAppointment(data);
        
        if (!originalTime) {
          setOriginalTime(data.appointment_time);
        }
      } else {
        throw new Error('Invalid appointment data received');
      }
    } catch (error) {
      console.error('Error fetching appointment details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointment();
    const pollingInterval = setInterval(fetchAppointment, 30000);
    return () => clearInterval(pollingInterval);
  }, [orderId]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (appointment) {
      const updateRemainingTime = () => {
        const currentTime = new Date();
        
        const expectedTimeString = stripTimezoneDesignator(appointment.expected_start_time);
        const expectedTime = new Date(expectedTimeString);
        
        const diffInSeconds = Math.max(0, Math.floor((expectedTime.getTime() - currentTime.getTime()) / 1000));
        
        setRemainingTime(diffInSeconds);
        
        const days = Math.floor(diffInSeconds / (24 * 60 * 60));
        const hours = Math.floor((diffInSeconds % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((diffInSeconds % (60 * 60)) / 60);
        const seconds = diffInSeconds % 60;
        
        let formattedTime = '';
        if (days > 0) formattedTime += `${days}d `;
        if (hours > 0 || days > 0) formattedTime += `${hours}h `;
        if (minutes > 0 || hours > 0 || days > 0) formattedTime += `${minutes}m `;
        formattedTime += `${seconds}s`;
        
        if (diffInSeconds === 0) {
          formattedTime = '0m 0s';
        }
        
        setFormattedRemainingTime(formattedTime + ' remaining');
        
        if (appointment) {
          const updatedStatus = determineQueueStatus(appointment, currentTime, diffInSeconds);
          if (updatedStatus !== appointment.queue_status) {
            setAppointment({
              ...appointment,
              queue_status: updatedStatus
            });
          }
        }
      };
      
      updateRemainingTime();
      timer = setInterval(updateRemainingTime, 1000);
    }
    return () => timer && clearInterval(timer);
  }, [appointment]);

  const canCancel = () => {
    if (!appointment || appointment.status !== 'pending') return false;
    
    const appointmentDateTime = createDateFromStrings(
      appointment.appointment_date,
      appointment.appointment_time
    );
    
    const now = new Date();
    
    const hoursDifference = getHoursDifference(appointmentDateTime, now);
    
    return hoursDifference > 24;
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getFormattedDate = (dateString: string) => {
    return formatIrishDate(dateString);
  };

  if (loading) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        backgroundColor: '#f5f7fb', 
        py: 4, 
        px: 2,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress />
        <Typography variant="body1">Loading appointment details...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      backgroundColor: '#f5f7fb', 
      py: isMobile ? 2 : 4, 
      px: isMobile ? 2 : 3,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Paper
        elevation={0}
        sx={{
          mb: 2,
          p: 3,
          borderRadius: 3,
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText
        }}
      >
        <Typography 
          variant={isMobile ? "h5" : "h4"} 
          fontWeight="bold" 
          align="center"
          sx={{ mb: 1 }}
        >
          {appointment?.appointment_title || 'Appointment Details'}
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: 0.5
        }}>
          <ConfirmationNumberIcon sx={{ fontSize: isMobile ? 16 : 20 }} />
          <Typography 
            variant={isMobile ? "body2" : "body1"}
            sx={{ 
              wordBreak: 'break-word',
              textAlign: 'center'
            }}
          >
            Appointment ID: {appointment?.order_id || ''}
          </Typography>
        </Box>
      </Paper>

      {cancelSuccess && (
        <Alert 
          severity="success" 
          sx={{ 
            mb: 2, 
            borderRadius: 2,
            width: '100%'
          }}
        >
          Your appointment has been successfully cancelled.
        </Alert>
      )}

      {appointment && (
        <Box sx={{ width: '100%', mb: 2 }}>
          <Paper
            elevation={isMobile ? 1 : 2}
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              transition: 'box-shadow 0.3s',
              boxShadow: theme.shadows[isMobile ? 1 : 2],
              '&:hover': {
                boxShadow: theme.shadows[isMobile ? 2 : 4],
              }
            }}
          >
            <Box 
              sx={{ 
                p: 2, 
                bgcolor: appointment.status === 'cancelled' 
                  ? theme.palette.error.light 
                  : appointment.queue_status === 'in_queue' 
                    ? theme.palette.warning.light
                    : appointment.status === 'completed'
                      ? theme.palette.success.light
                      : theme.palette.info.light,
                color: theme.palette.getContrastText(
                  appointment.status === 'cancelled' 
                    ? theme.palette.error.light 
                    : appointment.queue_status === 'in_queue' 
                      ? theme.palette.warning.light
                      : appointment.status === 'completed'
                        ? theme.palette.success.light
                        : theme.palette.info.light
                ),
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 1
              }}
            >
              <Typography variant="subtitle1" fontWeight="medium">
                Status: {formatStatus(appointment.status === 'cancelled' 
                  ? 'cancelled' 
                  : appointment.queue_status)}
              </Typography>
            </Box>

            <Box sx={{ p: isMobile ? 2 : 3 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                mb: 2.5,
                gap: 1
              }}>
                <StorefrontIcon color="primary" />
                <Typography variant="h6" component="h2">
                  {appointment.service_name}
                </Typography>
              </Box>
              
              <Grid container spacing={2} sx={{ mb: 2.5 }}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <EventIcon color="action" fontSize="small" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Appointment Date
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {getFormattedDate(appointment.appointment_date)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <AccessTimeIcon color="action" fontSize="small" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Appointment Time
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {formatTimeString(appointment.appointment_time)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <QueueIcon color="action" fontSize="small" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Queue Position
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        #{appointment.queue_position}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
              
              {renderDelayInfo()}
              
              {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    mb: 2.5,
                    borderRadius: 2,
                    bgcolor: appointment.queue_status === 'in_queue' 
                      ? theme.palette.warning.light + '20'
                      : theme.palette.primary.light + '20',
                  }}
                >
                  <Typography 
                    variant="subtitle1" 
                    fontWeight="medium" 
                    color={appointment.queue_status === 'in_queue' ? "warning.main" : "primary.main"}
                    sx={{ mb: 1.5 }}
                  >
                    {appointment.queue_status === 'in_queue' 
                      ? "Appointment In Progress" 
                      : "Time Remaining"}
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1
                  }}>
                    <AccessTimeIcon color={appointment.queue_status === 'in_queue' ? "warning" : "primary"} />
                    <Typography 
                      variant="h6" 
                      component="p"
                      color={appointment.queue_status === 'in_queue' ? "warning.main" : "primary.main"}
                      fontWeight="medium"
                    >
                      {appointment.queue_status === 'in_queue' 
                        ? "Currently In The Queue, Please Wait For Your Turn" 
                        : formattedRemainingTime}
                    </Typography>
                  </Box>
                </Paper>
              )}
            </Box>
          </Paper>
        </Box>
      )}

      <Box 
        sx={{ 
          mt: 'auto', 
          pt: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <Button
          variant="contained"
          startIcon={<ListAltIcon />}
          onClick={() => navigate('/appointments')}
          fullWidth
          size={isMobile ? "large" : "medium"}
          sx={{ 
            py: isMobile ? 1.5 : 1,
            borderRadius: 3,
            boxShadow: 2,
            bgcolor: theme.palette.primary.main,
            '&:hover': {
              bgcolor: theme.palette.primary.dark,
              boxShadow: 4,
            }
          }}
        >
          BACK TO APPOINTMENTS LIST
        </Button>

        {appointment && canCancel() && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<CancelIcon />}
            onClick={handleOpenCancelDialog}
            fullWidth
            size={isMobile ? "large" : "medium"}
            sx={{ 
              py: isMobile ? 1.5 : 1,
              borderRadius: 3,
              borderWidth: 2,
              '&:hover': { 
                bgcolor: theme.palette.error.light + '20',
                borderWidth: 2,
              }
            }}
          >
            CANCEL APPOINTMENT
          </Button>
        )}
      </Box>

      <Dialog
        open={openCancelDialog}
        onClose={handleCloseCancelDialog}
        aria-labelledby="cancel-dialog-title"
        aria-describedby="cancel-dialog-description"
        PaperProps={{
          sx: {
            borderRadius: 2,
            p: 1,
            width: '100%',
            maxWidth: 'sm'
          }
        }}
      >
        <DialogTitle 
          id="cancel-dialog-title"
          sx={{ 
            fontWeight: 'bold',
            color: theme.palette.error.main
          }}
        >
          Cancel Appointment
        </DialogTitle>
        
        <DialogContent>
          <DialogContentText id="cancel-dialog-description">
            Are you sure you want to cancel this appointment? This action cannot be undone.
          </DialogContentText>
          {cancelError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {cancelError}
            </Alert>
          )}
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={handleCloseCancelDialog} 
            variant="outlined"
          >
            KEEP APPOINTMENT
          </Button>
          <Button 
            onClick={handleCancelAppointment} 
            color="error" 
            variant="contained"
            sx={{ ml: 1 }}
          >
            YES, CANCEL
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AppointmentDetail;