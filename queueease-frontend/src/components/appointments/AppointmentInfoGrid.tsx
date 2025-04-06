import React from 'react';
import { Grid } from '@mui/material';
import InfoItem from '../common/InfoItem';
import StatusChip from '../common/StatusChip';
import StorefrontIcon from '@mui/icons-material/Storefront';
import QueueIcon from '@mui/icons-material/Queue';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { AppointmentInfoGridProps } from 'types/appointmentTypes';

const AppointmentInfoGrid: React.FC<AppointmentInfoGridProps> = ({ appointment, formatDate }) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6}>
        <InfoItem 
          icon={<StorefrontIcon />} 
          label="Service" 
          value={appointment.service_name} 
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <InfoItem 
          icon={<QueueIcon />} 
          label="Queue Status" 
          value={<StatusChip status={appointment.queue_status} sx={{ mt: 0.5 }} />} 
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <InfoItem 
          icon={<EventIcon />} 
          label="Appointment Date" 
          value={formatDate(appointment.appointment_date)} 
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <InfoItem 
          icon={<AccessTimeIcon />} 
          label="Appointment Time" 
          value={appointment.appointment_time} 
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <InfoItem 
          icon={<QueueIcon />} 
          label="Queue Position" 
          value={`#${appointment.queue_position}`} 
        />
      </Grid>
    </Grid>
  );
};

export default AppointmentInfoGrid;