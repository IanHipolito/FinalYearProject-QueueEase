import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { API } from '../services/api';
import ErrorDisplay from '../components/common/ErrorDisplay';
import LoadingIndicator from '../components/common/LoadingIndicator';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Divider,
  Button,
  Paper,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import RefreshIcon from '@mui/icons-material/Refresh';

interface Order {
  id: number | string;
  customer_name: string;
  date: string;
  status: string;
  service_name?: string;
  time?: string;
  type?: 'immediate' | 'appointment';
}

interface DashboardData {
  customerCount: number;
  queueCount: number;
  orderCount: number;
  latestOrders: Order[];
  customerStats: number[];
  growth: number;
  service_type: 'immediate' | 'appointment';
}

const DashboardPage: React.FC = () => {
  const { user, managedServices, currentService, switchService } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    customerCount: 0,
    queueCount: 0,
    orderCount: 0,
    latestOrders: [],
    customerStats: [],
    growth: 0,
    service_type: currentService?.service_type || 'immediate'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('month');
  const [statsTimeRange, setStatsTimeRange] = useState('daily');
  const [timeLabels, setTimeLabels] = useState<string[]>([]);

  // Function to fetch dashboard data with time range parameters
  const fetchDashboardData = async (serviceId?: number, timeRangeParam = statsTimeRange) => {
    if (!serviceId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log(`Fetching dashboard data for service ID ${serviceId} with timeRange=${timeRangeParam}`);
      const response = await API.admin.getDashboardData(serviceId, timeRangeParam);
      const data = await API.handleResponse(response);
      
      console.log("Dashboard API response:", data);
      
      let processedCustomerStats = data.customer_stats || [];
      if (processedCustomerStats.length === 0) {
        // If no data, create empty placeholders based on time range
        const placeholderCount = timeRangeParam === 'daily' ? 7 : timeRangeParam === 'weekly' ? 5 : 12;
        processedCustomerStats = Array(placeholderCount).fill(0);
      } else {
        // Ensure we have numeric values
        processedCustomerStats = processedCustomerStats.map((val: any) => 
          typeof val === 'number' ? val : 0
        );
        
        // If we don't have enough data points, pad with zeros
        const expectedLength = timeRangeParam === 'daily' ? 7 : timeRangeParam === 'weekly' ? 5 : 12;
        if (processedCustomerStats.length < expectedLength) {
          const padding = Array(expectedLength - processedCustomerStats.length).fill(0);
          processedCustomerStats = [...padding, ...processedCustomerStats];
        } else if (processedCustomerStats.length > expectedLength) {
          // If we have too many data points, truncate to expected length
          processedCustomerStats = processedCustomerStats.slice(0, expectedLength);
        }
      }

      // Generate appropriate time labels
      const generatedTimeLabels = generateTimeLabels(timeRangeParam);
      setTimeLabels(generatedTimeLabels);
      
      setDashboardData({
        customerCount: data.customer_count || 0,
        queueCount: data.queue_count || 0,
        orderCount: data.order_count || 0,
        latestOrders: data.latest_orders || [],
        customerStats: processedCustomerStats,
        growth: data.growth_rate || 0,
        service_type: data.service_type || currentService?.service_type || 'immediate'
      });
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch dashboard data when service changes
  useEffect(() => {
    if (currentService?.id) {
      fetchDashboardData(currentService.id, statsTimeRange);
    } else {
      setLoading(false);
    }
  }, [currentService?.id, statsTimeRange]);

  // Handle service selection in the dropdown
  const handleServiceChange = (event: SelectChangeEvent<number>) => {
    const serviceId = event.target.value as number;
    switchService(serviceId);
  };

  // Handle time range change for stats
  const handleStatsTimeRangeChange = (event: SelectChangeEvent) => {
    const newTimeRange = event.target.value as string;
    setStatsTimeRange(newTimeRange);
    if (currentService?.id) {
      fetchDashboardData(currentService.id, newTimeRange);
    }
  };

  // Load service from localStorage if available
  useEffect(() => {
    if (managedServices && managedServices.length > 0) {
      const serviceFromStorage = localStorage.getItem('currentServiceId');
      if (serviceFromStorage) {
        const serviceId = parseInt(serviceFromStorage);
        switchService(serviceId);
      }
    }
  }, [managedServices, switchService]);

  // Generate appropriate time period labels based on selected time range
  const generateTimeLabels = (timeRange: string): string[] => {
    if (timeRange === 'daily') {
      // Get day names for the current week
      const today = new Date();
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const days = [];
      
      // Start from today and get previous 6 days
      for (let i = 6; i >= 0; i--) {
        const day = new Date();
        day.setDate(today.getDate() - i);
        days.push(dayNames[day.getDay()]);
      }
      return days;
    } else if (timeRange === 'weekly') {
      // Last 5 weeks
      const weeks = [];
      for (let i = 4; i >= 0; i--) {
        weeks.push(`Week ${i + 1}`);
      }
      return weeks;
    } else {
      // Last 12 months
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const today = new Date();
      const months = [];
      
      // Get last 12 months (including current month)
      for (let i = 11; i >= 0; i--) {
        const monthIndex = (today.getMonth() - i + 12) % 12;
        months.push(monthNames[monthIndex]);
      }
      return months;
    }
  };

  // Helper function to determine if service is immediate type
  const isImmediateService = () => {
    return currentService?.service_type === 'immediate' || dashboardData.service_type === 'immediate';
  };

  // If loading and no data available yet, show loading indicator
  if (loading && !dashboardData.customerStats.length) {
    return <LoadingIndicator open={true} />;
  }

  const getStatusColor = (status?: string): string => {
    if (!status) return 'grey.500';
    
    switch(status.toLowerCase()) {
      case 'completed':
      case 'served':
        return '#4caf50';
      case 'in progress':
        return '#2196f3';
      case 'pending':
      case 'waiting':
        return '#ff9800';
      case 'cancelled':
      case 'left':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };
  
  const handleOrderClick = (order: Order) => {
    // Implement different navigation based on service type
    if (isImmediateService()) {
      console.log('Queue customer clicked:', order);
      // For immediate services, we'd typically show customer queue details
      // navigate(`/admin/customer/${order.id}`);
    } else {
      console.log('Appointment clicked:', order);
      // For appointment services, we'd show appointment details
      // navigate(`/admin/appointment/${order.id}`);
    }
  };

  const handleViewAllOrders = () => {
    // Implement different navigation based on service type
    if (isImmediateService()) {
      console.log('View all queues clicked');
      // navigate('/admin/queues');
    } else {
      console.log('View all appointments clicked');
      // navigate('/admin/appointments');
    }
  };

  return (
    <Box sx={{ bgcolor: '#f5f7fb', minHeight: '100vh', p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="500">
          Dashboard {currentService && `- ${currentService.name}`}
        </Typography>

        {/* Service selection dropdown */}
        {managedServices && managedServices.length > 1 && (
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <Select
              value={currentService?.id || ''}
              onChange={handleServiceChange}
              displayEmpty
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="" disabled>Select a service</MenuItem>
              {managedServices.map((service) => (
                <MenuItem key={service.id} value={service.id}>
                  {service.name} {service.is_owner ? '(Owner)' : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      {/* Show any errors */}
      {error && (
        <ErrorDisplay 
          error={error} 
          onRetry={() => currentService?.id && fetchDashboardData(currentService.id, statsTimeRange)} 
        />
      )}

      {/* Top Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Customer Card */}
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
                  <ShoppingBagIcon />
                </Box>
                <IconButton sx={{ color: 'white' }}>
                  <MoreHorizIcon />
                </IconButton>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="h3" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center' }}>
                  {dashboardData.customerCount}
                  {dashboardData.growth !== undefined && (
                    <Box component="span" sx={{
                      bgcolor: dashboardData.growth >= 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,0,0,0.2)',
                      fontSize: '0.5em',
                      p: 0.5,
                      borderRadius: 1,
                      ml: 1
                    }}>
                      {dashboardData.growth >= 0 ? '+' : ''}{dashboardData.growth}%
                    </Box>
                  )}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                  Total Customers {isImmediateService() ? 'in Queue' : 'with Appointments'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Queues Card */}
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
                  <DashboardIcon />
                </Box>
                <Box sx={{ display: 'flex' }}>
                  <Button
                    size="small"
                    variant={timeRange === 'month' ? 'contained' : 'text'}
                    sx={{
                      bgcolor: timeRange === 'month' ? 'rgba(255,255,255,0.2)' : 'transparent',
                      mr: 1,
                      color: 'white',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                    }}
                    onClick={() => setTimeRange('month')}
                  >
                    Month
                  </Button>
                  <Button
                    size="small"
                    variant={timeRange === 'year' ? 'contained' : 'text'}
                    sx={{
                      color: 'white',
                      bgcolor: timeRange === 'year' ? 'rgba(255,255,255,0.2)' : 'transparent',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                    }}
                    onClick={() => setTimeRange('year')}
                  >
                    Year
                  </Button>
                </Box>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="h3" fontWeight="bold">
                  {dashboardData.queueCount}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                  {isImmediateService() ? 'No. of Queues' : 'No. of Schedules'}
                </Typography>
              </Box>
              <Box sx={{ mt: 2, height: 40 }}>
                {/* Simple line chart placeholder */}
                <svg width="100%" height="40" viewBox="0 0 200 40">
                  <path d="M0,30 Q40,10 80,25 T160,15 T200,20" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
                </svg>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Orders Card */}
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
                  <AccountBalanceWalletIcon />
                </Box>
                <IconButton sx={{ color: 'white' }}>
                  <MoreHorizIcon />
                </IconButton>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="h3" fontWeight="bold">
                  {dashboardData.orderCount}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                  {isImmediateService() ? 'Total Orders' : 'Total Appointments'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bottom Row */}
      <Grid container spacing={3}>
        {/* Latest Orders/Customers */}
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="500">
                  {isImmediateService() ? 'Latest Customers' : 'Latest Appointments'}
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={() => currentService?.id && fetchDashboardData(currentService.id, statsTimeRange)}
                  title="Refresh data"
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ mt: 2 }}>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                    <CircularProgress size={30} />
                  </Box>
                ) : dashboardData.latestOrders && dashboardData.latestOrders.length > 0 ? (
                  dashboardData.latestOrders.map((order, index) => (
                    <Box 
                      key={`order-${order.id || index}`}
                      sx={{ 
                        py: 1.5, 
                        px: 1,
                        borderBottom: index < dashboardData.latestOrders.length - 1 ? '1px solid #f0f0f0' : 'none',
                        borderRadius: 1,
                        transition: 'background-color 0.2s',
                        '&:hover': {
                          backgroundColor: 'rgba(0,0,0,0.02)',
                          cursor: 'pointer'
                        }
                      }}
                      onClick={() => handleOrderClick(order)}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={500}>
                            {isImmediateService() ? `Customer #${order.id}` : `Appointment #${order.id}`}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {order.customer_name || 'Unknown Customer'}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="body2" color="text.secondary">
                            {order.date || 'N/A'}{order.time && ` at ${order.time}`}
                          </Typography>
                          <Chip
                            label={order.status || 'N/A'}
                            size="small"
                            sx={{ 
                              fontSize: '0.7rem', 
                              height: 20,
                              bgcolor: getStatusColor(order.status),
                              color: 'white' 
                            }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  ))
                ) : (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      {isImmediateService() 
                        ? 'No recent customers found' 
                        : 'No recent appointments found'}
                    </Typography>
                  </Box>
                )}

                {dashboardData.latestOrders && dashboardData.latestOrders.length > 0 && (
                  <Button
                    variant="text"
                    onClick={handleViewAllOrders}
                    sx={{
                      mt: 2,
                      fontWeight: 'medium',
                      color: '#3d8bfd'
                    }}
                  >
                    {isImmediateService() ? 'View All Customers' : 'View All Appointments'}
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Improved Customer Trends Chart */}
        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', height: '100%', overflow: 'hidden' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="600" sx={{ color: '#2c3e50' }}>
                  Customer Trends
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <IconButton 
                    size="small" 
                    onClick={() => currentService?.id && fetchDashboardData(currentService.id, statsTimeRange)}
                    title="Refresh data"
                    sx={{ mr: 1 }}
                  >
                    <RefreshIcon fontSize="small" sx={{ color: '#64748b' }} />
                  </IconButton>
                  <FormControl size="small" sx={{ width: 120 }}>
                    <Select
                      value={statsTimeRange}
                      onChange={handleStatsTimeRangeChange}
                      sx={{ 
                        borderRadius: 2,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#e2e8f0'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#94a3b8'
                        }
                      }}
                    >
                      <MenuItem value="daily">Daily</MenuItem>
                      <MenuItem value="weekly">Weekly</MenuItem>
                      <MenuItem value="monthly">Monthly</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>
              
              <Divider sx={{ mb: 3 }} />
              
              <Box
                sx={{
                  height: 250,
                  bgcolor: '#f8fafc',
                  borderRadius: 3,
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Background grid lines */}
                <Box sx={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 0, pt: 2, pb: 3 }}>
                  {[0, 25, 50, 75, 100].map((level, i) => (
                    <Box 
                      key={i} 
                      sx={{ 
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: `${level}%`,
                        height: '1px',
                        bgcolor: level === 0 ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.05)',
                        zIndex: 1
                      }}
                    />
                  ))}
                </Box>
                
                {loading ? (
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    height: '100%',
                    width: '100%',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bgcolor: 'rgba(255,255,255,0.7)',
                    zIndex: 10,
                    borderRadius: 3 
                  }}>
                    <CircularProgress size={32} sx={{ color: '#3b82f6' }} />
                  </Box>
                ) : (
                  <>
                    <Box sx={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'space-around',
                      position: 'relative',
                      zIndex: 2,
                      mb: 2
                    }}>
                      {dashboardData.customerStats && dashboardData.customerStats.length > 0 ? (
                        dashboardData.customerStats.map((value, index) => {
                          // Find max value for scaling
                          const maxValue = Math.max(...dashboardData.customerStats, 1);
                          
                          // Calculate percentage height (normalize values)
                          const percentHeight = Math.round((value / maxValue) * 100);
                          const isMin = value === Math.min(...dashboardData.customerStats.filter(v => v > 0));
                          const isMax = value === Math.max(...dashboardData.customerStats);
                          
                          // If all values are 0, make a minimum height
                          const finalHeight = maxValue === 0 ? 5 : Math.max(percentHeight, 5);
                          
                          return (
                            <Box 
                              key={index} 
                              sx={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'center', 
                                position: 'relative',
                                height: '100%',
                                width: `${95 / Math.max(dashboardData.customerStats.length, 1)}%`,
                                maxWidth: '50px'
                              }}
                            >
                              <Box 
                                className="bar-container"
                                sx={{ 
                                  position: 'relative', 
                                  width: '100%', 
                                  height: '100%',
                                  display: 'flex',
                                  alignItems: 'flex-end',
                                  justifyContent: 'center'
                                }}
                              >
                                <Box
                                  className="trend-bar"
                                  sx={{
                                    position: 'relative',
                                    width: '80%',
                                    maxWidth: '28px',
                                    height: `${finalHeight}%`,
                                    minHeight: 4,
                                    bgcolor: value === 0 ? '#e0e7ff' : isMax ? '#3b82f6' : isMin ? '#93c5fd' : '#60a5fa',
                                    borderRadius: '4px 4px 0 0',
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer',
                                    '&:hover': {
                                      bgcolor: value === 0 ? '#c7d2fe' : '#2563eb',
                                      '& + .value-tooltip': {
                                        opacity: 1,
                                        visibility: 'visible'
                                      }
                                    }
                                  }}
                                />
                                
                                {/* Value tooltip - shows the real value from API */}
                                <Box 
                                  className="value-tooltip"
                                  sx={{
                                    position: 'absolute',
                                    left: '50%',
                                    bottom: `calc(${finalHeight}% + 10px)`,
                                    transform: 'translateX(-50%)',
                                    bgcolor: '#1e40af',
                                    color: 'white',
                                    py: 0.5,
                                    px: 1.5,
                                    borderRadius: 1,
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    opacity: 0,
                                    visibility: 'hidden',
                                    transition: 'all 0.2s ease',
                                    whiteSpace: 'nowrap',
                                    zIndex: 10,
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                                    '&::after': {
                                      content: '""',
                                      position: 'absolute',
                                      top: '100%',
                                      left: '50%',
                                      marginLeft: '-5px',
                                      borderWidth: '5px',
                                      borderStyle: 'solid',
                                      borderColor: '#1e40af transparent transparent transparent'
                                    }
                                  }}
                                >
                                  {`${timeLabels[index]}: ${value}`}
                                </Box>
                              </Box>
                            </Box>
                          );
                        })
                      ) : (
                        <Box sx={{ 
                          width: '100%', 
                          height: '100%', 
                          display: 'flex', 
                          flexDirection: 'column',
                          alignItems: 'center', 
                          justifyContent: 'center' 
                        }}>
                          <Typography variant="body2" color="text.secondary">
                            No trend data available
                          </Typography>
                          <Button 
                            variant="outlined" 
                            size="small" 
                            onClick={() => currentService?.id && fetchDashboardData(currentService.id, statsTimeRange)}
                            sx={{ 
                              mt: 1, 
                              borderRadius: 6,
                              textTransform: 'none',
                              px: 3
                            }}
                          >
                            Refresh Data
                          </Button>
                        </Box>
                      )}
                    </Box>
                    
                    {/* X-axis labels */}
                    {dashboardData.customerStats && dashboardData.customerStats.length > 0 && (
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-around', 
                        borderTop: '1px dashed rgba(0,0,0,0.09)',
                        pt: 1.5,
                        px: 1,
                        height: '24px'
                      }}>
                        {dashboardData.customerStats.map((_, index) => {
                          // Use correct label for each bar from our generated timeLabels
                          const label = timeLabels[index] || '';
                          return (
                            <Typography 
                              key={index} 
                              variant="caption" 
                              sx={{ 
                                width: `${95 / Math.max(dashboardData.customerStats.length, 1)}%`,
                                maxWidth: '50px',
                                textAlign: 'center',
                                fontSize: '0.75rem',
                                color: '#64748b',
                                fontWeight: '500'
                              }}
                            >
                              {label}
                            </Typography>
                          );
                        })}
                      </Box>
                    )}
                  </>
                )}
              </Box>
              
              {/* Legend */}
              {dashboardData.customerStats && dashboardData.customerStats.length > 0 && (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'flex-end', 
                  alignItems: 'center', 
                  mt: 2,
                  mr: 1
                }}>
                  <Box 
                    sx={{ 
                      width: 12, 
                      height: 12, 
                      bgcolor: '#3b82f6', 
                      borderRadius: 0.5, 
                      mr: 1 
                    }} 
                  />
                  <Typography variant="caption" sx={{ color: '#475569', fontWeight: '500' }}>
                    {isImmediateService() ? 'Queue volume' : 'Appointment volume'}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;