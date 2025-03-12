import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import {
  Box, Container, Typography, Paper, Grid, TextField, Button,
  FormControl, InputLabel, Select, MenuItem, Alert, IconButton,
  useTheme, CircularProgress, Stack
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

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
    // Fetch service details
    const fetchService = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/service/${serviceId}/`);
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
      const formattedDate = date.toISOString().split('T')[0];
      const response = await fetch(
        `http://127.0.0.1:8000/api/available-times/${serviceId}/?date=${formattedDate}`
      );
      
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
      const response = await fetch('http://127.0.0.1:8000/api/create-appointment/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          service_id: serviceId,
          appointment_date: selectedDate.toISOString().split('T')[0],
          appointment_time: selectedTime,
        }),
      });
      
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
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
          <IconButton 
            onClick={() => navigate('/services')} 
            sx={{ 
              mr: 2,
              color: theme.palette.primary.main,
              '&:hover': { bgcolor: 'rgba(111, 66, 193, 0.08)' }
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" fontWeight={700} color="text.primary">
            Book Appointment
          </Typography>
        </Box>
        
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
                      sx={{ 
                        borderRadius: 2
                      }}
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
            <Button
              variant="contained"
              size="large"
              fullWidth
              disabled={!selectedDate || !selectedTime || submitting}
              onClick={handleSubmit}
              sx={{
                py: 1.5,
                borderRadius: 2,
                bgcolor: theme.palette.primary.main,
                '&:hover': {
                  bgcolor: theme.palette.primary.dark,
                  transform: 'translateY(-2px)',
                  boxShadow: '0 5px 15px rgba(111, 66, 193, 0.3)'
                },
                transition: 'all 0.2s ease',
                fontWeight: 600
              }}
            >
              {submitting ? (
                <CircularProgress size={24} sx={{ color: '#fff' }} />
              ) : (
                "Book Appointment"
              )}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default BookAppointment;