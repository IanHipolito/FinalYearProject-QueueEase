import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { API } from '../services/api';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Skeleton,
  Snackbar,
  Alert,
  TableRow,
  TableCell,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';

// Import components
import ErrorDisplay from '../components/common/ErrorDisplay';
import CustomerStatsCard from '../components/customers/CustomerStatsCard';
import CustomerFilters from '../components/customers/CustomerFilters';
import CustomerTable from '../components/customers/CustomerTable';
import CustomerDetailsDialog from '../components/customers/CustomerDetailsDialog';
import CreateCustomerDialog from '../components/customers/CreateCustomerDialog';

// Import types
import { Customer, CustomerStats, CustomerFormData } from '../types/customerTypes';

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
  
  // Dialog states
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [createCustomerOpen, setCreateCustomerOpen] = useState(false);
  
  // Form states
  const [newCustomerForm, setNewCustomerForm] = useState<CustomerFormData>({
    name: '',
    email: '',
    phone: ''
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  
  // Notification state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });
  
  // Filter state
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
        
        if (!response.ok) {
          try {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to load customers: HTTP ${response.status}`);
          } catch (jsonError) {
            throw new Error(`Failed to load customers: HTTP ${response.status}`);
          }
        }
        
        const data = await response.json();
        
        // Check if data is array
        if (!Array.isArray(data)) {
          console.error('Expected array but got:', data);
          throw new Error('Invalid data format received from server');
        }
        
        const transformedCustomers: Customer[] = data.map((customer: any) => ({
          id: customer.id || Math.floor(Math.random() * 10000),
          name: customer.name || 'Unknown Customer',
          email: customer.email || 'no-email@example.com',
          phone: customer.phone || '',
          status: customer.is_active ? 'Active' : 'Inactive',
          orders: customer.order_count || 0,
          is_active: Boolean(customer.is_active),
          last_visit: customer.last_visit || null
        }));
        
        setCustomers(transformedCustomers);
        
        setCustomerStats({
          totalCustomers: transformedCustomers.length,
          activeCustomers: transformedCustomers.filter(c => c.is_active).length,
          totalOrders: transformedCustomers.reduce((sum, c) => sum + c.orders, 0)
        });
      } catch (err: any) {
        console.error('Error fetching customers:', err);
        setError(err.message || 'Failed to load customer data');
        setCustomers([]);
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
      const response = await API.admin.createCustomer(
        currentService?.id as number, 
        newCustomerForm
      );
      
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

  // Clear filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
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
  
  // Activity chart for active customers card
  const activityChart = (
    <svg width="100%" height="40" viewBox="0 0 200 40">
      <path d="M0,30 Q40,10 80,25 T160,15 T200,20" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
    </svg>
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
        <Grid item xs={12} md={4}>
          <CustomerStatsCard
            title="Total Customers"
            value={customerStats.totalCustomers}
            icon={<PersonIcon />}
            description="Total number of customers who have used this service"
            loading={loading}
            gradient="linear-gradient(135deg, #6f42c1 0%, #8551d9 100%)"
          />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <CustomerStatsCard
            title="Active Customers"
            value={customerStats.activeCustomers}
            icon={<PeopleAltIcon />}
            description="Customers who have used this service in the last 30 days"
            loading={loading}
            gradient="linear-gradient(135deg, #0d6efd 0%, #3d8bfd 100%)"
            chart={!loading && activityChart}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <CustomerStatsCard
            title="Retention Rate"
            value={`${customerStats.totalCustomers > 
              0 ? Math.round((customerStats.activeCustomers / customerStats.totalCustomers) * 100) : 0}%`}
            icon={<ShoppingBagIcon />}
            description="Percentage of customers who are still active"
            loading={loading}
            gradient="linear-gradient(135deg, #198754 0%, #28a745 100%)"
          />
        </Grid>
      </Grid>

      {/* Customer List Card */}
      <Card sx={{ borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <CardContent>
          {/* Search and Filter Controls */}
          <CustomerFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            onCreateCustomer={handleCreateCustomer}
          />

          {/* Customers Table */}
          <CustomerTable
            customers={filteredCustomers}
            loading={loading}
            renderSkeletons={renderSkeletons}
            onShowDetails={handleShowDetails}
            searchTerm={searchTerm}
            onClearFilter={handleClearFilters}
          />
        </CardContent>
      </Card>
      
      {/* Customer Details Dialog */}
      <CustomerDetailsDialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        customer={selectedCustomer}
      />
      
      {/* Create Customer Dialog */}
      <CreateCustomerDialog
        open={createCustomerOpen}
        onClose={() => setCreateCustomerOpen(false)}
        onSubmit={handleSubmitNewCustomer}
        formData={newCustomerForm}
        setFormData={setNewCustomerForm}
        formError={formError}
        formLoading={formLoading}
      />
      
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