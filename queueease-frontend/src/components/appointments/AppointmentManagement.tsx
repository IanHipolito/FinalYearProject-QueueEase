import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, Button, 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Chip, CircularProgress,
  Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions,
  Alert, TextField, InputAdornment
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SearchIcon from '@mui/icons-material/Search';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { API } from '../../services/api';
import { formatDate } from '../../utils/formatters';
import { stripTimezoneDesignator, formatTimeString, formatToISODate } from '../../utils/timezoneUtils';

interface Appointment {
  order_id: string;
  user_name: string;
  service_name: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  queue_status: string;
  actual_start_time: string | null;
  actual_end_time: string | null;
  last_delay_minutes: number | null;
}

interface AppointmentManagementProps {
  serviceId: number;
  onRefresh?: () => void;
}

const AppointmentManagement: React.FC<AppointmentManagementProps> = ({ serviceId, onRefresh }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(formatToISODate(new Date()));
  const [processingAppointment, setProcessingAppointment] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'start' | 'complete',
    appointmentId: string
  } | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch appointments for the given date and service
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Assuming you have an API endpoint to get appointments for a specific service and date
      const response = await API.admin.getTodaysAppointments(serviceId, selectedDate);
      
      if (Array.isArray(response)) {
        setAppointments(response);
      } else {
        setAppointments([]);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError(err instanceof Error ? err.message : 'Failed to load appointments');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (serviceId) {
      fetchAppointments();
    }
  }, [serviceId, selectedDate]);

  // Handle date change
  const handleDateChange = (date: string) => {
    setSelectedDate(stripTimezoneDesignator(date));
  };

  // Handle start appointment
  const handleStartAppointment = async (orderId: string) => {
    try {
      setProcessingAppointment(orderId);
      setActionSuccess(null);
      
      const result = await API.appointments.startAppointmentService(orderId);
      
      if (result && result.success) {
        // Update the local state to reflect the change
        setAppointments(appointments.map(appointment => 
          appointment.order_id === orderId 
            ? { 
                ...appointment, 
                queue_status: 'in_queue',
                actual_start_time: stripTimezoneDesignator(result.appointment.actual_start_time)
              } 
            : appointment
        ));
        
        setActionSuccess(`Appointment ${orderId} started successfully`);
        
        // Refresh parent component data if needed
        if (onRefresh) {
          onRefresh();
        }
      }
    } catch (err) {
      console.error('Error starting appointment:', err);
      setError(err instanceof Error ? err.message : 'Failed to start appointment');
    } finally {
      setProcessingAppointment(null);
      setConfirmDialogOpen(false);
      setConfirmAction(null);
    }
  };

  // Handle complete appointment
  const handleCompleteAppointment = async (orderId: string) => {
    try {
      setProcessingAppointment(orderId);
      setActionSuccess(null);
      
      const result = await API.appointments.completeAppointmentService(orderId);
      
      if (result && result.success) {
        // Update the local state to reflect the change
        setAppointments(appointments.map(appointment => 
          appointment.order_id === orderId 
            ? { 
                ...appointment, 
                status: 'completed',
                queue_status: 'completed',
                actual_end_time: stripTimezoneDesignator(result.appointment.actual_end_time)
              } 
            : appointment
        ));
        
        setActionSuccess(`Appointment ${orderId} completed successfully`);
        
        // Refresh parent component data if needed
        if (onRefresh) {
          onRefresh();
        }
        
        // Refresh appointment list to get updated positions
        fetchAppointments();
      }
    } catch (err) {
      console.error('Error completing appointment:', err);
      setError(err instanceof Error ? err.message : 'Failed to complete appointment');
    } finally {
      setProcessingAppointment(null);
      setConfirmDialogOpen(false);
      setConfirmAction(null);
    }
  };

  // Open confirmation dialog
  const openConfirmDialog = (type: 'start' | 'complete', appointmentId: string) => {
    setConfirmAction({ type, appointmentId });
    setConfirmDialogOpen(true);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_queue':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'primary';
    }
  };

  // Format time with Irish locale
  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    
    const cleanTimeString = stripTimezoneDesignator(timeString);
    
    // For time-only strings (HH:MM)
    if (cleanTimeString.length <= 5) {
      return formatTimeString(cleanTimeString);
    }
    
    // For full datetime ISO strings
    try {
      const date = new Date(cleanTimeString);
      return date.toLocaleTimeString('en-IE', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } catch (e) {
      console.error('Error formatting time:', e);
      return timeString;
    }
  };

  // Format delay info
  const formatDelayInfo = (appointment: Appointment) => {
    if (!appointment.last_delay_minutes) return 'On time';
    return `${appointment.last_delay_minutes} min delay`;
  };

  // Check if an appointment can be started
  const canStartAppointment = (appointment: Appointment) => {
    return appointment.status === 'pending' && appointment.queue_status !== 'in_queue' && !appointment.actual_start_time;
  };

  // Check if an appointment can be completed
  const canCompleteAppointment = (appointment: Appointment) => {
    return appointment.status === 'pending' && appointment.queue_status === 'in_queue' && appointment.actual_start_time && !appointment.actual_end_time;
  };

  // Filter appointments based on search term
  const filteredAppointments = appointments.filter(appt => 
    appt.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appt.order_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6">Today's Appointments</Typography>
          
          {/* Control Panel - Search & Date Selection */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder="Search appointments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 200 }}
            />
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CalendarTodayIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                style={{ 
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </Box>
            
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => fetchAppointments()}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Success message */}
        {actionSuccess && (
          <Alert 
            severity="success" 
            sx={{ mb: 2 }}
            onClose={() => setActionSuccess(null)}
          >
            {actionSuccess}
          </Alert>
        )}
        
        {/* Error message */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 2 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {/* Appointments table */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : filteredAppointments.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Time</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Delay</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAppointments.map((appointment) => (
                  <TableRow key={appointment.order_id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body2">
                          {formatTimeString(appointment.appointment_time)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(appointment.appointment_date)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{appointment.user_name}</TableCell>
                    <TableCell>
                      <Chip 
                        label={appointment.queue_status === 'not_started' ? 'Pending' : 
                               appointment.queue_status === 'in_queue' ? 'In Progress' : 
                               appointment.status}
                        color={getStatusColor(appointment.queue_status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        color: appointment.last_delay_minutes ? 'error.main' : 'success.main'
                      }}>
                        <AccessTimeIcon fontSize="small" sx={{ mr: 0.5 }} />
                        {formatDelayInfo(appointment)}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      {canStartAppointment(appointment) && (
                        <Button
                          variant="contained"
                          size="small"
                          color="primary"
                          startIcon={<PlayArrowIcon />}
                          disabled={processingAppointment === appointment.order_id}
                          onClick={() => openConfirmDialog('start', appointment.order_id)}
                          sx={{ mr: 1 }}
                        >
                          Start
                        </Button>
                      )}
                      
                      {canCompleteAppointment(appointment) && (
                        <Button
                          variant="contained"
                          size="small"
                          color="success"
                          startIcon={<CheckCircleIcon />}
                          disabled={processingAppointment === appointment.order_id}
                          onClick={() => openConfirmDialog('complete', appointment.order_id)}
                        >
                          Complete
                        </Button>
                      )}
                      
                      {processingAppointment === appointment.order_id && (
                        <CircularProgress size={24} sx={{ ml: 1 }} />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No appointments found for this date
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>
          {confirmAction?.type === 'start' ? 'Start Appointment' : 'Complete Appointment'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmAction?.type === 'start' 
              ? 'Are you sure you want to start this appointment? This will mark the service as in-progress.'
              : 'Are you sure you want to complete this appointment?'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => {
              if (!confirmAction) return;
              
              if (confirmAction.type === 'start') {
                handleStartAppointment(confirmAction.appointmentId);
              } else {
                handleCompleteAppointment(confirmAction.appointmentId);
              }
            }}
            color={confirmAction?.type === 'start' ? 'primary' : 'success'}
            variant="contained"
            autoFocus
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AppointmentManagement;