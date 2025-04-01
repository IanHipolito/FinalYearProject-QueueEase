import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import QueueSearch from './QueueSearch';
import QueueTable from './QueueTable';

interface Queue {
  id: number;
  name: string;
  department: string;
  status: string;
  customers: number;
  description?: string;
  max_capacity?: number;
  sequence_number?: number;
  is_active?: boolean;
}

interface QueueManagementProps {
  queues: Queue[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onToggleQueueStatus: (queueId: number, newStatus: boolean) => void;
}

const QueueManagement: React.FC<QueueManagementProps> = ({
  queues,
  loading,
  searchTerm,
  setSearchTerm,
  onToggleQueueStatus
}) => {
  return (
    <Card sx={{ borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6" fontWeight="500">
            Queue Management
          </Typography>
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <QueueSearch
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        </Box>
        
        <QueueTable
          queues={queues}
          loading={loading}
          onToggleQueueStatus={onToggleQueueStatus}
        />
      </CardContent>
    </Card>
  );
};

export default QueueManagement;