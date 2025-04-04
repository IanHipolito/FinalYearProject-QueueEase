import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { API } from '../services/api';
import { Box, Typography, Alert } from '@mui/material';
import ErrorDisplay from '../components/common/ErrorDisplay';
import LoadingIndicator from '../components/common/LoadingIndicator';
import QueueStatsOverview from '../components/queues/QueueStatsOverview';
import QueueManagement from '../components/queues/QueueManagement';
import { Queue } from '../types/queueTypes';

const QueuesPage: React.FC = () => {
  const { currentService } = useAuth();
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch queues for the current service
  useEffect(() => {
    const fetchQueues = async () => {
      if (!currentService?.id) return;
      
      setLoading(true);
      setError('');
      
      try {
        const response = await API.admin.getQueueDetails(currentService.id);
        const data = await API.handleResponse(response);
        
        const transformedData = data.map((queue: any) => ({
          id: queue.id,
          name: queue.name,
          department: queue.department || 'General',
          status: queue.is_active ? 'Active' : 'Inactive',
          customers: queue.current_customers || 0,
          max_capacity: queue.max_capacity || 50,
          is_active: queue.is_active
        }));
        
        setQueues(transformedData);
      } catch (err: any) {
        setError(err.message || 'Failed to load queue data');
        console.error('Error fetching queues:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchQueues();
  }, [currentService?.id]);

  // Filter queues based on search term
  const filteredQueues = queues.filter(queue => 
    queue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    queue.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate stats
  const totalQueues = queues.length;
  const activeQueues = queues.filter(q => q.is_active || q.status === 'Active').length;
  const inactiveQueues = totalQueues - activeQueues;
  
  const totalCustomersInActiveQueues = queues
    .filter(q => q.is_active || q.status === 'Active')
    .reduce((sum, q) => sum + (q.customers || 0), 0);

  // Handle queue status toggle
  const handleToggleQueueStatus = async (queueId: number, newStatus: boolean) => {
    if (!currentService?.id) return;
    
    setActionLoading(true);
    
    try {
      const response = await API.admin.updateQueueStatus(queueId, newStatus);
      
      if (response.ok) {
        // Update queue status in local state
        setQueues(queues.map(q => 
          q.id === queueId 
            ? { ...q, status: newStatus ? 'Active' : 'Inactive', is_active: newStatus } 
            : q
        ));
        
        setSuccessMessage(`Queue ${newStatus ? 'activated' : 'deactivated'} successfully`);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || `Failed to update queue status (status: ${response.status})`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Box sx={{ bgcolor: '#f5f7fb', minHeight: '100vh', p: 3 }}>
      <Typography variant="h5" fontWeight="500" gutterBottom>
        Queues {currentService && `- ${currentService.name}`}
      </Typography>
      
      <LoadingIndicator open={actionLoading} />
      
      {error && (
        <ErrorDisplay 
          error={error} 
          onRetry={() => setError('')} 
        />
      )}
      
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      {/* Queue Stats Overview */}
      <QueueStatsOverview
        totalQueues={totalQueues}
        activeQueues={activeQueues}
        inactiveQueues={inactiveQueues}
        totalCustomersInActiveQueues={totalCustomersInActiveQueues}
      />
      
      {/* Queue Management */}
      <QueueManagement
        queues={filteredQueues}
        loading={loading}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onToggleQueueStatus={handleToggleQueueStatus}
      />
    </Box>
  );
};

export default QueuesPage;