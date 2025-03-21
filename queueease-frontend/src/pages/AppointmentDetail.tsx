import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Divider,
  CardContent
} from '@mui/material';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';

// Custom components
import DetailCard from '../components/common/DetailCard';
import AppointmentInfoGrid from '../components/appointments/AppointmentInfoGrid';
import TimeProgress from '../components/common/TimeProgress';
import ActionButton from '../components/common/ActionButton';
import LoadingSkeleton from '../components/skeletons/LoadingSkeletons';

// Utils
import { formatDate } from '../utils/formatters';

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

  const progressPercentage = appointment 
    ? (remainingTime / (appointment.estimated_wait_time * 60)) * 100 
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
                remainingTime={remainingTime} 
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