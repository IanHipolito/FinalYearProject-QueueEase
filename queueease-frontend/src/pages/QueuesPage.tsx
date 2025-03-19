import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { API } from '../services/api';
import ErrorDisplay from '../components/common/ErrorDisplay';
import { TableSkeleton } from '../components/skeletons/LoadingSkeletons';
import LoadingIndicator from '../components/common/LoadingIndicator';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Card,
  CardContent,
  IconButton,
  InputAdornment,
  Chip,
  Avatar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import QueueIcon from '@mui/icons-material/Queue';

interface Queue {
  id: number;
  name: string;
  department: string;
  status: string;
  customers: number;
  description?: string;
  max_capacity?: number;
}

const QueuesPage: React.FC = () => {
  const { currentService } = useAuth();
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [newQueue, setNewQueue] = useState({
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
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ 
                  bgcolor: '#e6f4ea', 
                  color: '#34a853', 
                  p: 1, 
                  borderRadius: 2, 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <QueueIcon />
                </Box>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="h4" fontWeight="bold">
                  {totalQueues}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                  Total Queues
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ 
                  bgcolor: '#e8f0fe', 
                  color: '#4285f4', 
                  p: 1, 
                  borderRadius: 2, 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <PlayArrowIcon />
                </Box>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="h4" fontWeight="bold">
                  {activeQueues}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                  Active Queues
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ 
                  bgcolor: '#fce8e6', 
                  color: '#ea4335', 
                  p: 1, 
                  borderRadius: 2, 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <PersonIcon />
                </Box>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="h4" fontWeight="bold">
                  {totalCustomers}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                  Total Customers
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Queue Management */}
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
                onClick={() => setOpenCreateDialog(true)}
              >
                Create Queue
              </Button>
            </Box>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <TextField
              placeholder="Search queues..."
              variant="outlined"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2 }
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
            />
          </Box>
          
          {loading ? (
            <TableSkeleton rows={3} />
          ) : (
            <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f7fb' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>Queue Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Department</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Customers</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredQueues.length > 0 ? (
                    filteredQueues.map((queue) => (
                      <TableRow key={queue.id} hover>
                        <TableCell>{queue.name}</TableCell>
                        <TableCell>{queue.department}</TableCell>
                        <TableCell>
                          <Chip 
                            label={queue.status}
                            color={queue.status === 'Active' ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{queue.customers}</TableCell>
                        <TableCell>
                          <IconButton 
                            size="small" 
                            color={queue.status === 'Active' ? 'warning' : 'success'}
                            onClick={() => toggleQueueStatus(queue.id, queue.status)}
                          >
                            {queue.status === 'Active' ? <PauseIcon /> : <PlayArrowIcon />}
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No queues found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
      
      {/* Create Queue Dialog */}
      <Dialog 
        open={openCreateDialog} 
        onClose={() => setOpenCreateDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Create New Queue</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Fill in the details to create a new queue for your service.
          </DialogContentText>
          
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              margin="dense"
              label="Queue Name"
              fullWidth
              required
              value={newQueue.name}
              onChange={(e) => setNewQueue({...newQueue, name: e.target.value})}
              variant="outlined"
            />
            
            <TextField
              margin="dense"
              label="Department"
              fullWidth
              required
              value={newQueue.department}
              onChange={(e) => setNewQueue({...newQueue, department: e.target.value})}
              variant="outlined"
            />
            
            <TextField
              margin="dense"
              label="Description"
              fullWidth
              multiline
              rows={2}
              value={newQueue.description}
              onChange={(e) => setNewQueue({...newQueue, description: e.target.value})}
              variant="outlined"
            />
            
            <TextField
              margin="dense"
              label="Maximum Capacity"
              type="number"
              fullWidth
              value={newQueue.max_capacity}
              onChange={(e) => setNewQueue({...newQueue, max_capacity: parseInt(e.target.value)})}
              inputProps={{ min: 1 }}
              variant="outlined"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateQueue} 
            variant="contained"
            disabled={!newQueue.name || !newQueue.department}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QueuesPage;