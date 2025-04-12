import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from 'context/AuthContext';
import { API } from '../services/api';
import {
  Box, Container, Typography, Paper, Grid, FormControl, InputLabel, 
  Select, MenuItem, Alert, useTheme, CircularProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import PageHeader from '../components/common/PageHeader';
import ActionButton from '../components/common/ActionButton';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { 
  stripTimezoneDesignator, 
  formatToISODate 
} from '../utils/timezoneUtils';

const BookAppointment: React.FC = () => {
  const { authenticated, loading: authLoading } = useAuthGuard();
  
  const { serviceId } = useParams<{ serviceId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [service, setService] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Fetch service details only when authenticated
  useEffect(() => {
    // Only fetch data if user is authenticated and serviceId exists
    if (!authenticated || !serviceId) return;
    
    const fetchService = async () => {
      setLoading(true);
      setError('');
      
      try {
        const data = await API.services.getServiceDetails(Number(serviceId));
        
        // Validate service data
        if (!data || !data.name) {
          throw new Error('Invalid service data received');
        }
        
        // Check if service supports appointments
        if (data.service_type !== 'appointment') {
          throw new Error('This service does not support appointments');
        }
        
        setService(data);
      } catch (err) {
        console.error('Error fetching service details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load service details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchService();
  }, [authenticated, serviceId]);
  
  const fetchAvailableTimes = async (date: Date) => {
    if (!authenticated || !serviceId) return;
    
    try {
      setError('');
      // Format date to YYYY-MM-DD without timezone complications
      const formattedDate = formatToISODate(date);
      
      const data = await API.services.getAvailableTimes(Number(serviceId), formattedDate);
      
      // Check if we received a valid array of times
      if (!Array.isArray(data.available_times)) {
        throw new Error('Invalid time slot data received');
      }
      
      setAvailableTimes(data.available_times);
      
      // If no times available, show a user-friendly message
      if (data.available_times.length === 0) {
        setError('No available time slots for the selected date. Please choose another date.');
      }
    } catch (err) {
      console.error('Error fetching available times:', err);
      setError(err instanceof Error ? err.message : 'Failed to load available appointment times');
      setAvailableTimes([]);
    }
  };
  
  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    setSelectedTime(''); // Reset time selection when date changes
    
    if (date) {
      // Validate date is not in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (date < today) {
        setError('Please select a future date');
        setAvailableTimes([]);
        return;
      }
      
      fetchAvailableTimes(date);
    } else {
      setAvailableTimes([]);
    }
  };
  
  const handleSubmit = async () => {
    // Only proceed if authenticated and user exists
    if (!authenticated || !user?.id) {
      setError('You must be logged in to book an appointment');
      return;
    }
    
    if (!selectedDate || !selectedTime) {
      setError('Please select a date and time');
      return;
    }
    
    if (!serviceId) {
      setError('Service information is missing');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      // Validate date is not in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        throw new Error('Cannot book appointments for past dates');
      }
      
      // Format date properly without timezone suffix
      const formattedDate = formatToISODate(selectedDate);

      const appointmentData = {
        user_id: user.id,
        service_id: Number(serviceId),
        appointment_date: formattedDate,
        // Ensure the time doesn't have any timezone designator
        appointment_time: stripTimezoneDesignator(selectedTime),
      };
      
      const data = await API.appointments.createAppointment(appointmentData);
      
      if (!data || !data.order_id) {
        throw new Error('Failed to create appointment. Please try again.');
      }
      
      // Navigate to the appointment details page
      navigate(`/appointment/${data.order_id}`);
    } catch (err) {
      console.error('Booking error:', err);
      setError(err instanceof Error ? err.message : 'Failed to book appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Show loading state during auth check
  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress size={40} sx={{ color: theme.palette.primary.main }} />
      </Box>
    );
  }
  
  // Show loading state for service data
  if (loading && authenticated) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ bgcolor: '#f5f7fb', minHeight: '100vh', py: 4, px: 2 }}>
      <Container maxWidth="md">
        <PageHeader
          title="Book Appointment"
          backUrl="/services"
        />
        
        <Paper
          elevation={2}
          sx={{
            borderRadius: 3,
            p: 4,
            width: '100%',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)'
            }
          }}
        >
          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 3, borderRadius: 2 }}
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}
          
          {service ? (
            <>
              <Typography variant="h5" fontWeight={600} gutterBottom color={theme.palette.primary.main}>
                {service?.name}
              </Typography>
              
              <Typography variant="body1" paragraph color="text.secondary">
                {service?.description || 'No description available.'}
              </Typography>
              
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" fontWeight={500} gutterBottom>
                        Select Date
                      </Typography>
                      <DatePicker
                        label="Appointment Date"
                        value={selectedDate}
                        onChange={handleDateChange}
                        disablePast
                        slotProps={{ 
                          textField: { 
                            fullWidth: true,
                            sx: { 
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2
                              }
                            }
                          } 
                        }}
                      />
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" fontWeight={500} gutterBottom>
                        Select Time
                      </Typography>
                      <FormControl fullWidth>
                        <InputLabel id="time-select-label">Appointment Time</InputLabel>
                        <Select
                          labelId="time-select-label"
                          id="time-select"
                          value={selectedTime}
                          label="Appointment Time"
                          onChange={(e) => setSelectedTime(e.target.value as string)}
                          disabled={!selectedDate || availableTimes.length === 0}
                          sx={{ borderRadius: 2 }}
                        >
                          {availableTimes.length > 0 ? (
                            availableTimes.map((time) => (
                              <MenuItem key={time} value={time}>
                                {time}
                              </MenuItem>
                            ))
                          ) : (
                            <MenuItem disabled value="">
                              {selectedDate ? 'No time slots available' : 'Select a date first'}
                            </MenuItem>
                          )}
                        </Select>
                      </FormControl>
                      {selectedDate && availableTimes.length === 0 && (
                        <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                          No available time slots for the selected date. Please choose another date.
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </LocalizationProvider>
              
              <Box sx={{ mt: 4 }}>
                <ActionButton
                  fullWidth
                  disabled={!selectedDate || !selectedTime || submitting}
                  onClick={handleSubmit}
                >
                  {submitting ? (
                    <CircularProgress size={24} sx={{ color: '#fff' }} />
                  ) : (
                    "Book Appointment"
                  )}
                </ActionButton>
              </Box>
            </>
          ) : error ? (
            <Typography variant="body1" color="error" align="center" sx={{ py: 4 }}>
              {error}
            </Typography>
          ) : (
            <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
              Service information not available.
            </Typography>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default BookAppointment;