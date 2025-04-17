import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Button, 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Chip, CircularProgress,
  Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions,
  Alert, TextField, InputAdornment, Tabs, Tab
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SearchIcon from '@mui/icons-material/Search';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import AlarmIcon from '@mui/icons-material/Alarm';
import { useSnackbar } from 'notistack';
import { API } from '../../services/api';
import { formatDate } from '../../utils/formatters';
import { stripTimezoneDesignator, formatTimeString, formatToISODate } from '../../utils/timezoneUtils';
import { ManageAppointment, AppointmentManagementProps, APPOINTMENT_STATUS_COLORS, APPOINTMENT_STATUS_DISPLAY } from 'types/appointmentTypes';

const AppointmentManagement: React.FC<AppointmentManagementProps> = ({ serviceId, onRefresh }) => {
  const { enqueueSnackbar } = useSnackbar();
  
  // State for appointments data and UI
  const [appointments, setAppointments] = useState<ManageAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(formatToISODate(new Date()));
  const [processingAppointment, setProcessingAppointment] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  
  // Dialog states
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'check_in' | 'start' | 'complete',
    appointmentId: string
  } | null>(null);
  const [delayDialogOpen, setDelayDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<string | null>(null);
  const [delayMinutes, setDelayMinutes] = useState<string>('');
  const [delayReason, setDelayReason] = useState<string>('');

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Fetch appointments for the given date and service
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await API.admin.getTodaysAppointments(serviceId, selectedDate);
      
      // Handle API response ensure we always have an array
      setAppointments(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError(err instanceof Error ? err.message : 'Failed to load appointments');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial data load and when date/service changes
  useEffect(() => {
    if (serviceId) {
      fetchAppointments();
    }
  }, [serviceId, selectedDate]);

  // Handle date change
  const handleDateChange = (date: string) => {
    setSelectedDate(stripTimezoneDesignator(date));
  };

  // Update appointment status in local state
  const updateAppointmentStatus = (
    orderId: string, 
    status: string, 
    updates: Partial<ManageAppointment>
  ) => {
    setAppointments(appointments.map(appointment => 
      appointment.order_id === orderId 
        ? { ...appointment, status, ...updates } 
        : appointment
    ));
  };

  // Common error handler for appointment actions
  const handleActionError = (
    err: unknown, 
    actionName: string
  ) => {
    console.error(`Error ${actionName}:`, err);
    setError(err instanceof Error ? err.message : `Failed to ${actionName}`);
    return false;
  };

  // Common success handler for appointment actions
  const handleActionSuccess = (
    orderId: string, 
    actionName: string
  ) => {
    setActionSuccess(`Appointment ${orderId} ${actionName} successfully`);
    
    // Refresh parent component data if needed
    if (onRefresh) {
      onRefresh();
    }
    
    return true;
  };

  // Handle check-in appointment
  const handleCheckInAppointment = async (orderId: string) => {
    try {
      setProcessingAppointment(orderId);
      setActionSuccess(null);
      
      const result = await API.appointments.checkInAppointment(orderId);
      
      if (result && result.success) {
        updateAppointmentStatus(orderId, 'checked_in', {
          check_in_time: stripTimezoneDesignator(result.appointment.check_in_time),
          delay_minutes: result.appointment.delay_minutes
        });
        
        return handleActionSuccess(orderId, 'checked in');
      }
    } catch (err) {
      return handleActionError(err, 'checking in appointment');
    } finally {
      setProcessingAppointment(null);
      setConfirmDialogOpen(false);
      setConfirmAction(null);
    }
  };

  // Handle start appointment
  const handleStartAppointment = async (orderId: string) => {
    try {
      setProcessingAppointment(orderId);
      setActionSuccess(null);
      
      const result = await API.appointments.startAppointmentService(orderId);
      
      if (result && result.success) {
        updateAppointmentStatus(orderId, 'in_progress', {
          actual_start_time: stripTimezoneDesignator(result.appointment.actual_start_time),
          delay_minutes: result.appointment.delay_minutes
        });
        
        return handleActionSuccess(orderId, 'started');
      }
    } catch (err) {
      return handleActionError(err, 'starting appointment');
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
        updateAppointmentStatus(orderId, 'completed', {
          actual_end_time: stripTimezoneDesignator(result.appointment.actual_end_time),
          delay_minutes: result.appointment.delay_minutes
        });
        
        handleActionSuccess(orderId, 'completed');
        
        // Refresh appointment list to get updated positions and propagated delays
        fetchAppointments();
        return true;
      }
    } catch (err) {
      return handleActionError(err, 'completing appointment');
    } finally {
      setProcessingAppointment(null);
      setConfirmDialogOpen(false);
      setConfirmAction(null);
    }
  };

  // Handle set delay
  const handleSetDelay = async () => {
    if (!selectedAppointment || !delayMinutes) return;
    
    try {
      setProcessingAppointment(selectedAppointment);
      setActionSuccess(null);
      
      // Convert delayMinutes string to number
      const delayValue = parseInt(delayMinutes, 10);
      
      if (isNaN(delayValue) || delayValue < 0) {
        setError('Please enter a valid delay time (0 or more minutes)');
        return;
      }
      
      // API call to set the delay
      const result = await API.appointments.setAppointmentDelay(
        selectedAppointment,
        delayValue,
        delayReason || undefined
      );
      
      if (result && result.success) {
        // Update appointments with delay value
        setAppointments(appointments.map(appointment => 
          appointment.order_id === selectedAppointment 
            ? { ...appointment, delay_minutes: delayValue } 
            : appointment
        ));
        
        setActionSuccess(`Set ${delayValue} minute delay for appointment ${selectedAppointment}`);
        enqueueSnackbar(`Delay set successfully: ${delayValue} minutes`, { variant: 'success' });
        
        // Refresh appointments list to get all propagated delays
        fetchAppointments();
        
        // Refresh parent component data if needed
        if (onRefresh) {
          onRefresh();
        }
      } else {
        throw new Error(result.error || 'Failed to set delay');
      }
    } catch (err) {
      handleActionError(err, 'setting appointment delay');
      enqueueSnackbar('Failed to set delay', { variant: 'error' });
    } finally {
      // Reset delay dialog state
      setProcessingAppointment(null);
      setDelayDialogOpen(false);
      setSelectedAppointment(null);
      setDelayMinutes('');
      setDelayReason('');
    }
  };

  // Open confirmation dialog
  const openConfirmDialog = (type: 'check_in' | 'start' | 'complete', appointmentId: string) => {
    setConfirmAction({ type, appointmentId });
    setConfirmDialogOpen(true);
  };

  // Open delay dialog
  const openDelayDialog = (appointmentId: string, currentDelay: number = 0) => {
    setSelectedAppointment(appointmentId);
    setDelayMinutes(currentDelay.toString());
    setDelayReason('');
    setDelayDialogOpen(true);
  };

  // Get status color from constants
  const getStatusColor = (status: string) => 
    APPOINTMENT_STATUS_COLORS[status as keyof typeof APPOINTMENT_STATUS_COLORS] || 'primary';

  // Get status display from constants
  const getStatusDisplay = (status: string) => 
    APPOINTMENT_STATUS_DISPLAY[status as keyof typeof APPOINTMENT_STATUS_DISPLAY] || status;

  // Display delay info with proper formatting
  const formatDelayInfo = (appointment: ManageAppointment) => {
    // Display a delay warning when applicable
    const hasDelay = appointment.delay_minutes && appointment.delay_minutes > 0;
    
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        color: hasDelay ? 'error.main' : 'success.main'
      }}>
        <AccessTimeIcon fontSize="small" sx={{ mr: 0.5 }} />
        {hasDelay ? `${appointment.delay_minutes} min delay` : 'On time'}
      </Box>
    );
  };

  // Check if an appointment can be checked in
  const canCheckInAppointment = (appointment: ManageAppointment) => 
    appointment.status === 'scheduled' && !appointment.check_in_time;

  // Check if an appointment can be started
  const canStartAppointment = (appointment: ManageAppointment) => 
    (appointment.status === 'scheduled' || appointment.status === 'checked_in') && 
    !appointment.actual_start_time;

  // Check if an appointment can be completed
  const canCompleteAppointment = (appointment: ManageAppointment) => 
    appointment.status === 'in_progress' && 
    appointment.actual_start_time && 
    !appointment.actual_end_time;

  // Check if delay can be set
  const canSetDelay = (appointment: ManageAppointment) => 
    ['scheduled', 'checked_in', 'in_progress'].includes(appointment.status);

  // Filter appointments based on search term and tab
  const filteredAppointments = appointments.filter(appt => {
    // First apply search filter
    const matchesSearch = 
      appt.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appt.order_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    // Apply tab filter
    switch (tabValue) {
      case 0:
        return true;
      case 1:
        return ['scheduled', 'checked_in'].includes(appt.status);
      case 2:
        return appt.status === 'in_progress';
      case 3:
        return appt.status === 'completed';
      default:
        return true;
    }
  });

  // Action button component
  const ActionButton = ({ 
    condition, 
    color, 
    icon, 
    label, 
    onClick, 
    margin = { mr: 1 }
  }: { 
    condition: boolean, 
    color: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning',
    icon: React.ReactNode, 
    label: string, 
    onClick: () => void,
    margin?: Record<string, number>
  }) => {
    if (!condition) return null;
    
    return (
      <Button
        variant="contained"
        size="small"
        color={color}
        startIcon={icon}
        disabled={processingAppointment === selectedAppointment}
        onClick={onClick}
        sx={margin}
      >
        {label}
      </Button>
    );
  };

  // Determine dialog title based on action type
  const getDialogTitle = () => {
    if (!confirmAction) return '';
    
    switch (confirmAction.type) {
      case 'check_in': return 'Check In Appointment';
      case 'start': return 'Start Appointment';
      case 'complete': return 'Complete Appointment';
      default: return 'Confirm Action';
    }
  };

  // Get dialog message based on action type
  const getDialogMessage = () => {
    if (!confirmAction) return '';
    
    switch (confirmAction.type) {
      case 'check_in': 
        return 'Are you sure you want to check in this appointment? This will mark the customer as present.';
      case 'start': 
        return 'Are you sure you want to start this appointment? This will mark the service as in-progress.';
      case 'complete': 
        return 'Are you sure you want to complete this appointment?';
      default: 
        return 'Are you sure you want to proceed with this action?';
    }
  };

  // Handle confirmation action
  const handleConfirmAction = () => {
    if (!confirmAction) return;
    
    switch (confirmAction.type) {
      case 'check_in':
        handleCheckInAppointment(confirmAction.appointmentId);
        break;
      case 'start':
        handleStartAppointment(confirmAction.appointmentId);
        break;
      case 'complete':
        handleCompleteAppointment(confirmAction.appointmentId);
        break;
    }
  };

  return (
    <Box>
      {/* Main content card */}
      <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        {/* Header section with controls */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6">Appointments Management</Typography>
          
          {/* Control Panel - Search & Date Selection */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            {/* Search field */}
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
            
            {/* Date picker */}
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
            
            {/* Refresh button */}
            <Button 
              variant="outlined" 
              size="small"
              onClick={fetchAppointments}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Filtering tabs */}
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="All Appointments" />
          <Tab label="Upcoming" />
          <Tab label="In Progress" />
          <Tab label="Completed" />
        </Tabs>

        {/* Notification alerts */}
        {actionSuccess && (
          <Alert 
            severity="success" 
            sx={{ mb: 2 }}
            onClose={() => setActionSuccess(null)}
          >
            {actionSuccess}
          </Alert>
        )}
        
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 2 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {/* Appointments table content */}
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
                    {/* Time cell */}
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
                    
                    {/* Customer name */}
                    <TableCell>{appointment.user_name}</TableCell>
                    
                    {/* Status chip */}
                    <TableCell>
                      <Chip 
                        label={getStatusDisplay(appointment.status)}
                        color={getStatusColor(appointment.status)}
                        size="small"
                      />
                    </TableCell>
                    
                    {/* Delay information */}
                    <TableCell>
                      {formatDelayInfo(appointment)}
                    </TableCell>
                    
                    {/* Action buttons */}
                    <TableCell align="right">
                      {/* Check-in button */}
                      {canCheckInAppointment(appointment) && (
                        <Button
                          variant="contained"
                          size="small"
                          color="info"
                          startIcon={<HowToRegIcon />}
                          disabled={processingAppointment === appointment.order_id}
                          onClick={() => openConfirmDialog('check_in', appointment.order_id)}
                          sx={{ mr: 1 }}
                        >
                          Check In
                        </Button>
                      )}
                      
                      {/* Start button */}
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
                      
                      {/* Complete button */}
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

                      {/* Set delay button */}
                      {canSetDelay(appointment) && (
                        <Button
                          variant="contained"
                          size="small"
                          color="warning"
                          startIcon={<AlarmIcon />}
                          disabled={processingAppointment === appointment.order_id}
                          onClick={() => openDelayDialog(appointment.order_id, appointment.delay_minutes || 0)}
                          sx={{ ml: 1 }}
                        >
                          Set Delay
                        </Button>
                      )}
                      
                      {/* Loading indicator while action is processing */}
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
          // Empty state
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No appointments found for the selected filters
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>{getDialogTitle()}</DialogTitle>
        <DialogContent>
          <DialogContentText>{getDialogMessage()}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleConfirmAction}
            color={
              confirmAction?.type === 'check_in' ? 'info' : 
              confirmAction?.type === 'start' ? 'primary' : 
              'success'
            }
            variant="contained"
            autoFocus
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delay Dialog */}
      <Dialog
        open={delayDialogOpen}
        onClose={() => setDelayDialogOpen(false)}
      >
        <DialogTitle>Set Appointment Delay</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Specify the delay time in minutes for this appointment. 
            This will notify the customer about the expected delay.
          </DialogContentText>
          <TextField
            autoFocus
            label="Delay (minutes)"
            type="number"
            fullWidth
            variant="outlined"
            margin="dense"
            InputProps={{ inputProps: { min: 0 } }}
            value={delayMinutes}
            onChange={(e) => setDelayMinutes(e.target.value)}
          />
          <TextField
            label="Reason for delay (optional)"
            fullWidth
            variant="outlined"
            margin="dense"
            multiline
            rows={2}
            value={delayReason}
            onChange={(e) => setDelayReason(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDelayDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSetDelay}
            color="warning"
            variant="contained"
          >
            Set Delay
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AppointmentManagement;