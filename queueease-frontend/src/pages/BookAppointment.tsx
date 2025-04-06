import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
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

const BookAppointment: React.FC = () => {
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
  
  useEffect(() => {
    const fetchService = async () => {
      try {
        const response = await API.services.getServiceDetails(Number(serviceId));
        if (!response.ok) {
          throw new Error('Service not found');
        }
        const data = await response.json();
        setService(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load service details');
        setLoading(false);
      }
    };
    
    fetchService();
  }, [serviceId]);
  
  const fetchAvailableTimes = async (date: Date) => {
    try {
      const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const response = await API.services.getAvailableTimes(Number(serviceId), formattedDate);
      
      if (!response.ok) {
        throw new Error('Failed to fetch available times');
      }
      
      const data = await response.json();
      setAvailableTimes(data.available_times);
    } catch (err) {
      setError('Failed to load available appointment times');
    }
  };
  
  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      fetchAvailableTimes(date);
    } else {
      setAvailableTimes([]);
    }
    setSelectedTime('');
  };
  
  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime || !user?.id) {
      setError('Please select a date and time');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;

      const appointmentData = {
        user_id: user.id,
        service_id: Number(serviceId),
        appointment_date: formattedDate,
        appointment_time: selectedTime,
      };
      
      const response = await API.appointments.createAppointment(appointmentData);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', response.status, errorData);
        throw new Error(
          errorData.error || 
          `Failed to book appointment (Status: ${response.status})`
        );
      }
      
      const data = await response.json();
      navigate(`/appointment/${data.order_id}`);
    } catch (err: any) {
      console.error('Booking error:', err);
      setError(err.message || 'Failed to book appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
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
          
          <Typography variant="h5" fontWeight={600} gutterBottom color={theme.palette.primary.main}>
            {service?.name}
          </Typography>
          
          <Typography variant="body1" paragraph color="text.secondary">
            {service?.description}
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
                      {availableTimes.map((time) => (
                        <MenuItem key={time} value={time}>
                          {time}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
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
        </Paper>
      </Container>
    </Box>
  );
};

export default BookAppointment;