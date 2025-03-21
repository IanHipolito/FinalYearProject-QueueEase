import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { API } from '../services/api';
import { Box, Typography, Alert } from '@mui/material';
import ErrorDisplay from '../components/common/ErrorDisplay';
import LoadingIndicator from '../components/common/LoadingIndicator';
import QueueStatsOverview from '../components/queues/QueueStatsOverview';
import QueueManagement from '../components/queues/QueueManagement';
import CreateQueueDialog from '../components/queues/CreateQueueDialog';
import { Queue, QueueFormData } from '../types/queueTypes';

const QueuesPage: React.FC = () => {
  const { currentService } = useAuth();
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [newQueue, setNewQueue] = useState<QueueFormData>({
    name: '',
    department: '',
    description: '',
    max_capacity: 50
  });
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
        setQueues(data);
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
  const activeQueues = queues.filter(q => q.status === 'Active').length;
  const totalCustomers = queues.reduce((sum, q) => sum + q.customers, 0);

  // Handle queue creation
  const handleCreateQueue = async () => {
    if (!currentService?.id) return;
    
    setActionLoading(true);
    
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/admin/queues/create/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_id: currentService.id,
            ...newQueue
          }),
        }
      );
      
      if (response.ok) {
        const newQueueData = await response.json();
        setQueues([...queues, {
          ...newQueueData,
          status: 'Active',
          customers: 0
        }]);
        setSuccessMessage('Queue created successfully');
        setOpenCreateDialog(false);
        setNewQueue({
          name: '',
          department: '',
          description: '',
          max_capacity: 50
        });
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || `Failed to create queue (status: ${response.status})`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle queue status
  const toggleQueueStatus = async (queueId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'Active' ? 'Paused' : 'Active';
    
    setActionLoading(true);
    
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/admin/queues/${queueId}/update-status/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: newStatus
          }),
        }
      );
      
      if (response.ok) {
        setQueues(queues.map(q => 
          q.id === queueId ? {...q, status: newStatus} : q
        ));
        setSuccessMessage(`Queue ${newStatus === 'Active' ? 'activated' : 'paused'} successfully`);
        
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
        totalCustomers={totalCustomers}
      />
      
      {/* Queue Management */}
      <QueueManagement
        queues={filteredQueues}
        loading={loading}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onCreateClick={() => setOpenCreateDialog(true)}
        onToggleStatus={toggleQueueStatus}
      />
      
      {/* Create Queue Dialog */}
      <CreateQueueDialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
        onCreate={handleCreateQueue}
        formData={newQueue}
        setFormData={setNewQueue}
      />
    </Box>
  );
};

export default QueuesPage;