import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API } from '../services/api';
import { Box, Container, Typography, Divider, CardContent } from '@mui/material';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import DetailCard from '../components/common/DetailCard';
import AppointmentInfoGrid from '../components/appointments/AppointmentInfoGrid';
import TimeProgress from '../components/common/TimeProgress';
import ActionButton from '../components/common/ActionButton';
import LoadingSkeleton from '../components/skeletons/LoadingSkeletons';
import { formatDate } from '../utils/formatters';

interface AppointmentDetail {
  order_id: string;
  appointment_date: string;
  appointment_time: string;
  service_name: string;
  queue_status: string;
  status: string;
  estimated_wait_time: number;
  queue_position: number;
  appointment_title: string;
  expected_start_time: string;
}

const AppointmentDetail: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [formattedRemainingTime, setFormattedRemainingTime] = useState<string>('');
  const navigate = useNavigate();

  // Function to update queue status based on time and other factors
  const determineQueueStatus = (appointment: AppointmentDetail, currentTime: Date, timeRemaining: number): string => {
    const expectedStartTime = new Date(appointment.expected_start_time);
    const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}Z`);
    
    // If the appointment is marked as completed in the backend
    if (appointment.status === 'completed') {
      return 'completed';
    }
    
    // If appointment is cancelled in the backend
    if (appointment.status === 'cancelled') {
      return 'cancelled';
    }

    // If time remaining is zero or negative and we're past the appointment time
    if (timeRemaining <= 0 && currentTime > appointmentDateTime) {
      return 'completed';
    }
    
    // If current time is past the expected start time but not yet completed
    if (currentTime > expectedStartTime && currentTime > appointmentDateTime) {
      return 'in_queue';
    }
    
    // If we're within 300 minutes or 5 hours of the appointment time
    const TimeBeforeQueueStart = new Date(appointmentDateTime);
    TimeBeforeQueueStart.setMinutes(TimeBeforeQueueStart.getMinutes() - 300);
    
    if (currentTime >= TimeBeforeQueueStart && currentTime < appointmentDateTime) {
      return 'in_queue';
    }
    
    // Default state if none of the above conditions are met
    return 'not_started';
  };

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const response = await API.appointments.getAppointmentDetails(orderId || '');
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          console.error(`API error (${response.status}):`, errorText);
          throw new Error(`Failed to fetch appointment: ${response.status} error`);
        }
        
        const data = await response.json();
        
        // Defensive data handling
        if (data && data.appointment_date) {
          setAppointment(data);
        } else {
          throw new Error('Invalid appointment data received');
        }
      } catch (error) {
        console.error('Error fetching appointment details:', error);
      }
    };
  
    fetchAppointment();
    const pollingInterval = setInterval(fetchAppointment, 60000);
    return () => clearInterval(pollingInterval);
  }, [orderId]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (appointment) {
      const updateRemainingTime = () => {
        const currentTime = new Date();
        const expectedTime = new Date(appointment.expected_start_time).getTime();
        const diffInSeconds = Math.max(0, Math.floor((expectedTime - currentTime.getTime()) / 1000));
        
        setRemainingTime(diffInSeconds);
        
        // Format the remaining time as days, hours, minutes, seconds
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
        
        // Dynamically update the queue status based on time and remaining time
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

  const progressPercentage = appointment 
    ? Math.min(100, (1 - remainingTime / (appointment.estimated_wait_time * 60)) * 100)
    : 0;

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f7fb', py: 4, px: 2 }}>
      <Container maxWidth="md">
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
          <Typography variant="h4" fontWeight={700} color="text.primary" align="center">
            Appointment Details
          </Typography>
        </Box>

        {appointment ? (
          <DetailCard 
            title={appointment.appointment_title} 
            subtitle={`Order ID: ${appointment.order_id}`}
            subtitleIcon={<ConfirmationNumberIcon />}
          >
            <CardContent sx={{ p: 3 }}>
              <AppointmentInfoGrid appointment={appointment} formatDate={formatDate} />
              
              <Divider sx={{ my: 3 }} />
              
              <TimeProgress 
                remainingTime={formattedRemainingTime || remainingTime}
                progressPercentage={progressPercentage} 
              />
              
              <Divider sx={{ my: 3 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <ActionButton
                  startIcon={<ListAltIcon />}
                  onClick={() => navigate('/appointments')}
                >
                  Back to Appointments List
                </ActionButton>
              </Box>
            </CardContent>
          </DetailCard>
        ) : (
          <LoadingSkeleton variant="detail" />
        )}
      </Container>
    </Box>
  );
};

export default AppointmentDetail;