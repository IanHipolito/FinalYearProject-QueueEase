import React from 'react';
import { Grid } from '@mui/material';
import QueueStatCard from './QueueStatCard';
import QueueStatusToggle from './QueueStatusToggle';
import QueueIcon from '@mui/icons-material/Queue';
import PersonIcon from '@mui/icons-material/Person';

interface QueueStatsOverviewProps {
  totalQueues: number;
  activeQueues: number;
  inactiveQueues: number;
  totalCustomersInActiveQueues: number;
}

const QueueStatsOverview: React.FC<QueueStatsOverviewProps> = ({
  totalQueues,
  activeQueues,
  inactiveQueues,
  totalCustomersInActiveQueues
}) => {
  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} md={4}>
        <QueueStatCard
          title="Total Queues"
          value={totalQueues}
          icon={<QueueIcon />}
          bgColor="#e6f4ea"
          iconColor="#34a853"
        />
      </Grid>
      
      <Grid item xs={12} md={4}>
        <QueueStatusToggle
          activeQueues={activeQueues}
          inactiveQueues={inactiveQueues}
          bgColor="#e8f0fe"
          iconColor="#4285f4"
        />
      </Grid>
      
      <Grid item xs={12} md={4}>
        <QueueStatCard
          title="Customers in Active Queues"
          value={totalCustomersInActiveQueues}
          icon={<PersonIcon />}
          bgColor="#fce8e6"
          iconColor="#ea4335"
        />
      </Grid>
    </Grid>
  );
};

export default QueueStatsOverview;