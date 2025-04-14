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
import { AppointmentDetail as AppointmentDetailType, APPOINTMENT_STATUS_DISPLAY } from 'types/appointmentTypes';
import {
  createDateFromStrings,
  getHoursDifference,
  formatIrishDate,
  formatTimeString
} from '../utils/timezoneUtils';

const AppointmentDetail: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [appointment, setAppointment] = useState<AppointmentDetailType | null>(null);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  type PaletteColor = 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  const statusPaperStyles = (color: PaletteColor) => ({
    p: 2.5,
    mb: 2.5,
    borderRadius: 2,
    bgcolor: theme.palette[color].light + '20',
  });

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
          status: 'cancelled'
        });
      }
      
      // No need for setTimeout here
      fetchAppointment();

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
    
    // Set up interval for regular updates
    const dataInterval = setInterval(fetchAppointment, 30000);
    
    // Clean up on unmount
    return () => {
      clearInterval(dataInterval);
    };
  }, [orderId]);

  const canCancel = () => {
    if (!appointment) return false;

    const appointmentDateTime = createDateFromStrings(
      appointment.appointment_date,
      appointment.appointment_time
    );

    const now = new Date();
    const hoursDifference = getHoursDifference(appointmentDateTime, now);

    return hoursDifference > 24;
  };

  const renderDelayInfo = () => {
    // Check if we have explicit delay information from the server
    if (appointment && appointment.delay_minutes && appointment.delay_minutes > 0) {
      // Calculate the new expected time based on original time + delay
      const [hours, minutes] = appointment.appointment_time.split(':').map(Number);
      const originalTime = new Date();
      originalTime.setHours(hours, minutes, 0, 0);

      // Calculate delayed time
      const delayedTime = new Date(originalTime.getTime());
      delayedTime.setMinutes(delayedTime.getMinutes() + appointment.delay_minutes);

      // Format for display
      const formattedOriginalTime = formatTimeString(appointment.appointment_time);
      const formattedDelayedTime = formatTimeString(
        `${delayedTime.getHours().toString().padStart(2, '0')}:${delayedTime.getMinutes().toString().padStart(2, '0')}`
      );

      return (
        <Paper
          elevation={0}
          sx={statusPaperStyles('warning')}
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
            Your appointment has been delayed by {appointment.delay_minutes} minutes due to
            longer service times today.
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Original Time
              </Typography>
              <Typography variant="body2" sx={{ textDecoration: 'line-through' }}>
                {formattedOriginalTime}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                New Expected Time
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {formattedDelayedTime}
              </Typography>
            </Box>
          </Box>
        </Paper>
      );
    }    
    return null;
  };

  const getStatusColor = (status: string): 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    const colorMap: Record<string, 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
      scheduled: 'primary',
      checked_in: 'info',
      in_progress: 'warning',
      completed: 'success',
      cancelled: 'error',
      missed: 'error',
    };

    return colorMap[status] || 'primary';
  };

  const getStatusDisplay = (status: string) => {
    return APPOINTMENT_STATUS_DISPLAY[status as keyof typeof APPOINTMENT_STATUS_DISPLAY] || status;
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
                bgcolor: theme.palette[getStatusColor(appointment.status)].light,
                color: theme.palette.getContrastText(theme.palette[getStatusColor(appointment.status)].light),
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 1
              }}
            >
              <Typography variant="subtitle1" fontWeight="medium">
                Status: {getStatusDisplay(appointment.status)}
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
                        {formatIrishDate(appointment.appointment_date)}
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

                {appointment.queue_position > 0 && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <QueueIcon color="action" fontSize="small" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Position in Queue
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {appointment.status === 'scheduled'
                            ? `#${appointment.queue_position}`
                            : (appointment.status === 'in_progress'
                              ? 'Currently being served'
                              : '-')}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
              </Grid>

              {renderDelayInfo()}

              {appointment.status === 'scheduled' && (
                <Paper
                  elevation={0}
                  sx={statusPaperStyles('primary')}
                >
                  <Typography
                    variant="subtitle1"
                    fontWeight="medium"
                    color="primary.main"
                    sx={{ mb: 1.5 }}
                  >
                    Time Until Appointment
                  </Typography>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1
                  }}>
                    <AccessTimeIcon color="primary" />
                    <Typography
                      variant="h6"
                      component="p"
                      color="primary.main"
                      fontWeight="medium"
                    >
                      {appointment.time_until_formatted || '--'}
                    </Typography>
                  </Box>
                </Paper>
              )}

              {appointment.status === 'in_progress' && (
                <Paper
                  elevation={0}
                  sx={statusPaperStyles('warning')}
                >
                  <Typography
                    variant="subtitle1"
                    fontWeight="medium"
                    color="warning.main"
                    sx={{ mb: 1.5 }}
                  >
                    Appointment In Progress
                  </Typography>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1
                  }}>
                    <AccessTimeIcon color="warning" />
                    <Typography
                      variant="h6"
                      component="p"
                      color="warning.main"
                      fontWeight="medium"
                    >
                      Currently Being Served
                    </Typography>
                  </Box>
                </Paper>
              )}

              {appointment.status === 'checked_in' && (
                <Paper
                  elevation={0}
                  sx={statusPaperStyles('info')}
                >
                  <Typography
                    variant="subtitle1"
                    fontWeight="medium"
                    color="info.main"
                    sx={{ mb: 1.5 }}
                  >
                    Checked In
                  </Typography>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1
                  }}>
                    <AccessTimeIcon color="info" />
                    <Typography
                      variant="h6"
                      component="p"
                      color="info.main"
                      fontWeight="medium"
                    >
                      Waiting to be called
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