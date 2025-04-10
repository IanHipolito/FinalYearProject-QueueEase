import React, { useState, useEffect } from 'react';
import { useAuth } from 'context/AuthContext';
import { API } from '../services/api';
import { Box, Typography, Alert, CircularProgress } from '@mui/material';
import ErrorDisplay from '../components/common/ErrorDisplay';
import LoadingIndicator from '../components/common/LoadingIndicator';
import QueueStatsOverview from '../components/queues/QueueStatsOverview';
import QueueManagement from '../components/queues/QueueManagement';
import { Queue } from '../types/queueTypes';
import { useAuthGuard } from '../hooks/useAuthGuard';

const QueuesPage: React.FC = () => {
  const { authenticated, loading: authLoading } = useAuthGuard({});
  
  const { currentService } = useAuth();
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch queues for the current service
  useEffect(() => {
    // Only fetch if authenticated
    if (!authenticated || !currentService?.id) return;
    
    const fetchQueues = async () => {
      setLoading(true);
      setError('');
      
      try {
        const data = await API.admin.getQueueDetails(currentService.id);
        
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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load queue data');
        console.error('Error fetching queues:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchQueues();
  }, [currentService?.id, authenticated]);

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
    if (!authenticated || !currentService?.id) return;
    
    setActionLoading(true);
    
    try {
      const result = await API.admin.updateQueueStatus(queueId, newStatus);
      
      // Update queue status in local state
      setQueues(queues.map(q => 
        q.id === queueId 
          ? { ...q, status: newStatus ? 'Active' : 'Inactive', is_active: newStatus } 
          : q
      ));
      
      setSuccessMessage(`Queue ${newStatus ? 'activated' : 'deactivated'} successfully`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update queue status');
      console.error('Error updating queue status:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Show loading state during auth check
  if (authLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress size={40} />
        <Typography variant="body1" color="text.secondary">
          Loading queue management...
        </Typography>
      </Box>
    );
  }

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