import React from 'react';
import { Grid } from '@mui/material';
import QueueStatCard from './QueueStatCard';
import QueueIcon from '@mui/icons-material/Queue';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PersonIcon from '@mui/icons-material/Person';

interface QueueStatsOverviewProps {
  totalQueues: number;
  activeQueues: number;
  totalCustomers: number;
}

const QueueStatsOverview: React.FC<QueueStatsOverviewProps> = ({
  totalQueues,
  activeQueues,
  totalCustomers
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
        <QueueStatCard
          title="Active Queues"
          value={activeQueues}
          icon={<PlayArrowIcon />}
          bgColor="#e8f0fe"
          iconColor="#4285f4"
        />
      </Grid>
      
      <Grid item xs={12} md={4}>
        <QueueStatCard
          title="Total Customers"
          value={totalCustomers}
          icon={<PersonIcon />}
          bgColor="#fce8e6"
          iconColor="#ea4335"
        />
      </Grid>
    </Grid>
  );
};

export default QueueStatsOverview;