import React from 'react';
import { Box, Typography, Button, Card, CardContent } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
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
}

interface QueueManagementProps {
  queues: Queue[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onCreateClick: () => void;
  onToggleStatus: (queueId: number, currentStatus: string) => void;
}

const QueueManagement: React.FC<QueueManagementProps> = ({
  queues,
  loading,
  searchTerm,
  setSearchTerm,
  onCreateClick,
  onToggleStatus
}) => {
  return (
    <Card sx={{ borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6" fontWeight="500">
            Queue Management
          </Typography>
          <Box>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              sx={{ borderRadius: 2 }}
              onClick={onCreateClick}
            >
              Create Queue
            </Button>
          </Box>
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
          onToggleStatus={onToggleStatus}
        />
      </CardContent>
    </Card>
  );
};

export default QueueManagement;