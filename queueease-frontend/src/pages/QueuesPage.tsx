import React, { useState, useEffect } from 'react';
import { useAuth } from 'context/AuthContext';
import { API } from '../services/api';
import { Box, Typography, Alert, CircularProgress, Tabs, Tab } from '@mui/material';
import ErrorDisplay from '../components/common/ErrorDisplay';
import LoadingIndicator from '../components/common/LoadingIndicator';
import QueueStatsOverview from '../components/queues/QueueStatsOverview';
import QueueManagement from '../components/queues/QueueManagement';
import AppointmentManagement from '../components/appointments/AppointmentManagement';
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
  const [tabValue, setTabValue] = useState(0);
  
  // Determine if service is appointment-based
  const isAppointmentService = currentService?.service_type === 'appointment';
  
  console.log("Current service type:", currentService?.service_type);
  console.log("Is appointment service:", isAppointmentService);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // If service changes and is no longer appointment type, reset to first tab
  useEffect(() => {
    if (!isAppointmentService && tabValue === 1) {
      setTabValue(0);
    }
  }, [isAppointmentService, tabValue]);

  // Fetch queues for the current service
  useEffect(() => {
    // Only fetch if authenticated and on queue tab
    if (!authenticated || !currentService?.id || tabValue !== 0) return;
    
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
  }, [currentService?.id, authenticated, tabValue]);

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

  // Handle appointment refresh
  const handleAppointmentDataRefresh = () => {
    setSuccessMessage('Appointment data updated successfully');
    setTimeout(() => setSuccessMessage(''), 3000);
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

  // Filter queues based on search term
  const filteredQueues = queues.filter(queue => 
    queue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    queue.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ bgcolor: '#f5f7fb', minHeight: '100vh', p: 3 }}>
      <Typography variant="h5" fontWeight="500" gutterBottom>
        {currentService && `${currentService.name} - `}
        {tabValue === 0 ? 'Queue Management' : 'Appointment Management'}
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

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab label="Queue Management" />
          {isAppointmentService && <Tab label="Appointment Management" />}
        </Tabs>
      </Box>

      {/* Queue Stats Overview - only shown on Queue Management tab */}
      {tabValue === 0 && (
        <QueueStatsOverview
          totalQueues={queues.length}
          activeQueues={queues.filter(q => q.is_active || q.status === 'Active').length}
          inactiveQueues={queues.filter(q => !q.is_active || q.status !== 'Active').length}
          totalCustomersInActiveQueues={queues
            .filter(q => q.is_active || q.status === 'Active')
            .reduce((sum, q) => sum + (q.customers || 0), 0)}
        />
      )}
      
      {/* Conditional rendering based on tab value */}
      {tabValue === 0 ? (
        <QueueManagement
          queues={filteredQueues}
          loading={loading}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onToggleQueueStatus={handleToggleQueueStatus}
        />
      ) : (
        isAppointmentService && (
          <AppointmentManagement 
            serviceId={currentService?.id || 0} 
            onRefresh={handleAppointmentDataRefresh}
          />
        )
      )}
    </Box>
  );
};

export default QueuesPage;