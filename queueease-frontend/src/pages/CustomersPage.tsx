import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { API } from '../services/api';
import ErrorDisplay from '../components/common/ErrorDisplay';
import LoadingIndicator from '../components/common/LoadingIndicator';
import {
  Box,
  Typography,
  Grid,
  Paper,
  TableContainer,
  Table,
  TableBody,
  TableCell,
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
  Alert,
  Tooltip,
  CircularProgress,
  Skeleton,
  Snackbar
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DeleteIcon from '@mui/icons-material/Delete';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import FilterListIcon from '@mui/icons-material/FilterList';
import InfoIcon from '@mui/icons-material/Info';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  status: string;
  orders: number;
  avatar?: string;
  is_active: boolean;
  last_visit?: string;
}

interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  totalOrders: number;
}

const CustomersPage: React.FC = () => {
  const { currentService } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [customerStats, setCustomerStats] = useState<CustomerStats>({
    totalCustomers: 0,
    activeCustomers: 0,
    totalOrders: 0
  });
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [createCustomerOpen, setCreateCustomerOpen] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Fetch customer data for the current service
  useEffect(() => {
    const fetchCustomers = async () => {
      if (!currentService?.id) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError('');
      
      try {
        const response = await API.admin.getCustomers(currentService.id);
        const data = await API.handleResponse(response);
        
        // Transform the data to match our interface
        const transformedCustomers: Customer[] = data.map((customer: any) => ({
          id: customer.id,
          name: customer.name || 'Unknown Customer',
          email: customer.email || '',
          phone: customer.phone || '',
          status: customer.is_active ? 'Active' : 'Inactive',
          orders: customer.order_count || 0,
          is_active: customer.is_active,
          last_visit: customer.last_visit || null
        }));
        
        setCustomers(transformedCustomers);
        
        // Calculate stats
        setCustomerStats({
          totalCustomers: transformedCustomers.length,
          activeCustomers: transformedCustomers.filter(c => c.is_active).length,
          totalOrders: transformedCustomers.reduce((sum, c) => sum + c.orders, 0)
        });
      } catch (err: any) {
        console.error('Error fetching customers:', err);
        setError(err.message || 'Failed to load customer data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCustomers();
  }, [currentService?.id]);
  
  // Filter customers based on search term and status filter
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = (
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const matchesFilter = 
      filterStatus === 'all' || 
      (filterStatus === 'active' && customer.is_active) ||
      (filterStatus === 'inactive' && !customer.is_active);
    
    return matchesSearch && matchesFilter;
  });

  // Show customer details
  const handleShowDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDetailsOpen(true);
  };

  // Open the create customer dialog
  const handleCreateCustomer = () => {
    setNewCustomerForm({
      name: '',
      email: '',
      phone: ''
    });
    setFormError('');
    setCreateCustomerOpen(true);
  };

  // Submit new customer form
  const handleSubmitNewCustomer = async () => {
    // Form validation
    if (!newCustomerForm.name || !newCustomerForm.email) {
      setFormError('Name and email are required');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newCustomerForm.email)) {
      setFormError('Please enter a valid email address');
      return;
    }
    
    setFormLoading(true);
    setFormError('');
    
    try {
      // This would be replaced with actual API call to create customer
      const response = await fetch(`http://127.0.0.1:8000/api/admin/customers/create/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCustomerForm,
          service_id: currentService?.id
        }),
      });
      
      if (response.ok) {
        const newCustomer = await response.json();
        
        // Add the new customer to our list
        setCustomers([...customers, {
          id: newCustomer.id,
          name: newCustomer.name,
          email: newCustomer.email,
          phone: newCustomer.phone || '',
          status: 'Active',
          orders: 0,
          is_active: true
        }]);
        
        // Update stats
        setCustomerStats({
          ...customerStats,
          totalCustomers: customerStats.totalCustomers + 1,
          activeCustomers: customerStats.activeCustomers + 1
        });
        
        setCreateCustomerOpen(false);
        setSnackbar({
          open: true,
          message: 'Customer created successfully',
          severity: 'success'
        });
      } else {
        const errorData = await response.json();
        setFormError(errorData.error || 'Failed to create customer');
      }
    } catch (error: any) {
      setFormError(error.message || 'An error occurred');
    } finally {
      setFormLoading(false);
    }
  };

  // Close the snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  // Skeleton for loading state
  const renderSkeletons = () => (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <TableRow key={`skeleton-${i}`}>
          <TableCell>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
              <Skeleton variant="text" width={120} />
            </Box>
          </TableCell>
          <TableCell><Skeleton variant="text" width={180} /></TableCell>
          <TableCell><Skeleton variant="text" width={80} /></TableCell>
          <TableCell><Skeleton variant="text" width={50} /></TableCell>
          <TableCell><Skeleton variant="text" width={40} /></TableCell>
        </TableRow>
      ))}
    </>
  );

  return (
    <Box sx={{ bgcolor: '#f5f7fb', minHeight: '100vh', p: 3 }}>
      <Typography variant="h5" fontWeight="500" gutterBottom>
        Customers {currentService && `- ${currentService.name}`}
      </Typography>
      
      {error && (
        <ErrorDisplay 
          error={error} 
          onRetry={() => {
            if (currentService?.id) {
              setLoading(true);
              setError('');
              API.admin.getCustomers(currentService.id)
                .then(response => API.handleResponse(response))
                .then(data => {
                  const transformedCustomers = data.map((customer: any) => ({
                    id: customer.id,
                    name: customer.name || 'Unknown Customer',
                    email: customer.email || '',
                    phone: customer.phone || '',
                    status: customer.is_active ? 'Active' : 'Inactive',
                    orders: customer.order_count || 0,
                    is_active: customer.is_active,
                    last_visit: customer.last_visit || null
                  }));
                  setCustomers(transformedCustomers);
                  setCustomerStats({
                    totalCustomers: transformedCustomers.length,
                    activeCustomers: transformedCustomers.filter((c: any) => c.is_active).length,
                    totalOrders: transformedCustomers.reduce((sum: number, c: any) => sum + c.orders, 0)
                  });
                  setLoading(false);
                })
                .catch(err => {
                  setError(err.message || 'Failed to load customer data');
                  setLoading(false);
                });
            }
          }}
        />
      )}

      {/* Top Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Total Users Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            borderRadius: 4, 
            background: 'linear-gradient(135deg, #6f42c1 0%, #8551d9 100%)',
            color: '#fff',
            overflow: 'visible',
            position: 'relative',
            height: '100%'
          }}>
            <CardContent sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ bgcolor: 'rgba(255,255,255,0.1)', p: 1, borderRadius: 2 }}>
                  <PersonIcon />
                </Box>
                <Tooltip title="Total number of customers who have used this service">
                  <IconButton sx={{ color: 'white' }}>
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box sx={{ mt: 2 }}>
                {loading ? (
                  <Skeleton variant="text" width={100} height={60} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                ) : (
                  <Typography variant="h3" fontWeight="bold">
                    {customerStats.totalCustomers}
                  </Typography>
                )}
                <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                  Total Customers
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Active Members Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            borderRadius: 4, 
            background: 'linear-gradient(135deg, #0d6efd 0%, #3d8bfd 100%)',
            color: '#fff',
            height: '100%',
            position: 'relative',
          }}>
            <CardContent sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ bgcolor: 'rgba(255,255,255,0.1)', p: 1, borderRadius: 2 }}>
                  <PeopleAltIcon />
                </Box>
                <Tooltip title="Customers who have used this service in the last 30 days">
                  <IconButton sx={{ color: 'white' }}>
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box sx={{ mt: 2 }}>
                {loading ? (
                  <Skeleton variant="text" width={100} height={60} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                ) : (
                  <Typography variant="h3" fontWeight="bold">
                    {customerStats.activeCustomers}
                  </Typography>
                )}
                <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                  Active Customers
                </Typography>
              </Box>
              <Box sx={{ mt: 2, height: 40 }}>
                {/* Activity chart */}
                {!loading && (
                  <svg width="100%" height="40" viewBox="0 0 200 40">
                    <path d="M0,30 Q40,10 80,25 T160,15 T200,20" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
                  </svg>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Orders Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            borderRadius: 4, 
            background: 'linear-gradient(135deg, #198754 0%, #28a745 100%)',
            color: '#fff',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ bgcolor: 'rgba(255,255,255,0.1)', p: 1, borderRadius: 2 }}>
                  <ShoppingBagIcon />
                </Box>
                <Tooltip title="Total number of orders placed with this service">
                  <IconButton sx={{ color: 'white' }}>
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box sx={{ mt: 2 }}>
                {loading ? (
                  <Skeleton variant="text" width={100} height={60} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                ) : (
                  <Typography variant="h3" fontWeight="bold">
                    {customerStats.totalOrders}
                  </Typography>
                )}
                <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                  Total Orders
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Customer List Card */}
      <Card sx={{ borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <CardContent>
          {/* Search and Add Button Row */}
          <Box sx={{ 
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between', 
            alignItems: { xs: 'stretch', sm: 'center' }, 
            mb: 3,
            gap: 2
          }}>
            <Box sx={{ 
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'flex-start',
              gap: 2,
              flexGrow: 1
            }}>
              <TextField 
                placeholder="Search by name or email"
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ 
                  width: { xs: '100%', sm: '350px' },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
              />
              
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  id="status-filter"
                  value={filterStatus}
                  label="Status"
                  onChange={(e) => setFilterStatus(e.target.value)}
                  startAdornment={
                    <InputAdornment position="start">
                      <FilterListIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="all">All Customers</MenuItem>
                  <MenuItem value="active">Active Only</MenuItem>
                  <MenuItem value="inactive">Inactive Only</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={handleCreateCustomer}
              sx={{ 
                borderRadius: 2, 
                bgcolor: '#6f42c1', 
                '&:hover': { bgcolor: '#8551d9' },
                alignSelf: { xs: 'stretch', sm: 'auto' }
              }}
            >
              Add New Customer
            </Button>
          </Box>

          {/* Customers Table */}
          <TableContainer component={Paper} sx={{ boxShadow: 'none', borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f7fb' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Orders</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  renderSkeletons()
                ) : filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ 
                            mr: 2, 
                            bgcolor: customer.is_active ? '#6f42c1' : '#9e9e9e'
                          }}>
                            {customer.name.charAt(0)}
                          </Avatar>
                          {customer.name}
                        </Box>
                      </TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>
                        <Chip 
                          label={customer.status} 
                          size="small"
                          sx={{ 
                            bgcolor: customer.status === 'Active' ? '#e8f5e9' : '#ffebee',
                            color: customer.status === 'Active' ? '#2e7d32' : '#c62828',
                            fontWeight: 500
                          }} 
                        />
                      </TableCell>
                      <TableCell>{customer.orders}</TableCell>
                      <TableCell>
                        <IconButton 
                          size="small"
                          onClick={() => handleShowDetails(customer)}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      <Typography variant="body1" color="text.secondary">
                        No customers found matching your criteria
                      </Typography>
                      {searchTerm && (
                        <Button 
                          variant="text" 
                          color="primary" 
                          sx={{ mt: 1 }}
                          onClick={() => {
                            setSearchTerm('');
                            setFilterStatus('all');
                          }}
                        >
                          Clear filters
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
      
      {/* Customer Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedCustomer && (
          <>
            <DialogTitle>
              Customer Details
              <IconButton
                aria-label="close"
                onClick={() => setDetailsOpen(false)}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                  color: (theme) => theme.palette.grey[500],
                }}
              >
                <MoreVertIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                <Avatar 
                  sx={{ 
                    width: 64, 
                    height: 64, 
                    bgcolor: selectedCustomer.is_active ? '#6f42c1' : '#9e9e9e',
                    mr: 2
                  }}
                >
                  {selectedCustomer.name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedCustomer.name}</Typography>
                  <Chip 
                    label={selectedCustomer.status} 
                    size="small"
                    sx={{ 
                      mt: 0.5,
                      bgcolor: selectedCustomer.status === 'Active' ? '#e8f5e9' : '#ffebee',
                      color: selectedCustomer.status === 'Active' ? '#2e7d32' : '#c62828',
                      fontWeight: 500
                    }} 
                  />
                </Box>
              </Box>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Email</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <EmailIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                    <Typography variant="body1">{selectedCustomer.email}</Typography>
                  </Box>
                </Grid>
                
                {selectedCustomer.phone && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Phone</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      <PhoneIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                      <Typography variant="body1">{selectedCustomer.phone}</Typography>
                    </Box>
                  </Grid>
                )}
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Total Orders</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <ShoppingBagIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                    <Typography variant="body1">{selectedCustomer.orders}</Typography>
                  </Box>
                </Grid>
                
                {selectedCustomer.last_visit && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Last Visit</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      <CalendarTodayIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                      <Typography variant="body1">
                        {new Date(selectedCustomer.last_visit).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
              
              <Typography variant="subtitle1" gutterBottom>
                Customer Actions
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button 
                  variant="outlined" 
                  startIcon={<EmailIcon />}
                  onClick={() => window.location.href = `mailto:${selectedCustomer.email}`}
                >
                  Send Email
                </Button>
                
                <Button 
                  variant="outlined" 
                  color="error" 
                  startIcon={<DeleteIcon />}
                >
                  Remove
                </Button>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
      
      {/* Create Customer Dialog */}
      <Dialog
        open={createCustomerOpen}
        onClose={() => !formLoading && setCreateCustomerOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Customer</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Enter the new customer's details below.
          </DialogContentText>
          
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          
          <Box component="form" sx={{ '& .MuiTextField-root': { my: 1 } }}>
            <TextField
              autoFocus
              margin="dense"
              id="name"
              label="Full Name"
              type="text"
              fullWidth
              variant="outlined"
              value={newCustomerForm.name}
              onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
              required
              disabled={formLoading}
            />
            <TextField
              margin="dense"
              id="email"
              label="Email Address"
              type="email"
              fullWidth
              variant="outlined"
              value={newCustomerForm.email}
              onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
              required
              disabled={formLoading}
            />
            <TextField
              margin="dense"
              id="phone"
              label="Phone Number"
              type="tel"
              fullWidth
              variant="outlined"
              value={newCustomerForm.phone}
              onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
              disabled={formLoading}/>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setCreateCustomerOpen(false)} disabled={formLoading}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitNewCustomer} 
                variant="contained" 
                disabled={formLoading}
                startIcon={formLoading ? <CircularProgress size={20} /> : <AddIcon />}
              >
                {formLoading ? 'Creating...' : 'Add Customer'}
              </Button>
            </DialogActions>
          </Dialog>
          
          {/* Success/Error Snackbar */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={handleCloseSnackbar}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert 
              onClose={handleCloseSnackbar} 
              severity={snackbar.severity} 
              variant="filled"
              sx={{ width: '100%' }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Box>
      );
    };
    
    export default CustomersPage;