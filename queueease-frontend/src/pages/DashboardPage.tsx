import React, { useEffect, useState } from 'react';
import { useAuth } from 'context/AuthContext';
import { API } from '../services/api';
import { Box, Grid, Card, SelectChangeEvent } from '@mui/material';
import ErrorDisplay from '../components/common/ErrorDisplay';
import LoadingIndicator from '../components/common/LoadingIndicator';
import StatCard from '../components/dashboard/StatCard';
import LatestOrdersList from '../components/dashboard/LatestOrdersList';
import CustomerTrendsChart from '../components/dashboard/CustomerTrendsChart';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import { Order, DashboardData } from '../types/dashboardTypes';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

const DashboardPage: React.FC = () => {
  const { managedServices, currentService, switchService } = useAuth();
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
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('Dashboard API error:', errorText);
        throw new Error(`Failed to load dashboard data: ${response.status}`);
      }
      
      const data = await response.json();
      
      let processedCustomerStats = data.customer_stats || [];
      if (processedCustomerStats.length === 0) {
        const placeholderCount = timeRangeParam === 'daily' ? 7 : timeRangeParam === 'weekly' ? 5 : 12;
        processedCustomerStats = Array(placeholderCount).fill(0);
      } else {
        processedCustomerStats = processedCustomerStats.map((val: any) => 
          typeof val === 'number' ? val : 0
        );
        
        const expectedLength = timeRangeParam === 'daily' ? 7 : timeRangeParam === 'weekly' ? 5 : 12;
        if (processedCustomerStats.length < expectedLength) {
          const padding = Array(expectedLength - processedCustomerStats.length).fill(0);
          processedCustomerStats = [...padding, ...processedCustomerStats];
        } else if (processedCustomerStats.length > expectedLength) {
          processedCustomerStats = processedCustomerStats.slice(0, expectedLength);
        }
      }

      let processedLatestOrders = data.latest_orders || [];
      processedLatestOrders = processedLatestOrders.map((order: any) => ({
        id: order.id || 'unknown',
        customer_name: order.customer_name || 'Unknown Customer',
        date: order.date || 'N/A',
        time: order.time || null,
        status: order.status || 'unknown',
        service_name: order.service_name || currentService?.name || 'Unknown Service',
        type: order.type || (currentService?.service_type === 'appointment' ? 'appointment' : 'immediate')
      }));

      // Generate appropriate time labels
      const generatedTimeLabels = generateTimeLabels(timeRangeParam);
      setTimeLabels(generatedTimeLabels);
      
      setDashboardData({
        customerCount: data.customer_count || 0,
        queueCount: data.queue_count || 1, // Never show 0 queues
        orderCount: data.order_count || 0,
        latestOrders: processedLatestOrders,
        customerStats: processedCustomerStats,
        growth: data.growth || 0,
        service_type: data.service_type || currentService?.service_type || 'immediate'
      });
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
      
      // Set default values when API fails
      const placeholderCount = timeRangeParam === 'daily' ? 7 : timeRangeParam === 'weekly' ? 5 : 12;
      const generatedTimeLabels = generateTimeLabels(timeRangeParam);
      setTimeLabels(generatedTimeLabels);
      
      setDashboardData({
        ...dashboardData,
        customerStats: Array(placeholderCount).fill(0),
      });
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
    if (isImmediateService()) {
      console.log('Queue customer clicked:', order);
    } else {
      console.log('Appointment clicked:', order);
    }
  };

  const handleViewAllOrders = () => {
    if (isImmediateService()) {
      console.log('View all queues clicked');
    } else {
      console.log('View all appointments clicked');
    }
  };

  return (
    <Box sx={{ bgcolor: '#f5f7fb', minHeight: '100vh', p: 3 }}>
      <DashboardHeader 
        title="Dashboard" 
        serviceName={currentService?.name}
        services={managedServices}
        onServiceChange={handleServiceChange}
        currentServiceId={currentService?.id}
      />

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
          <StatCard
            title={`Total Customers ${isImmediateService() ? 'in Queue' : 'with Appointments'}`}
            value={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
              </Box>
            }
            icon={<ShoppingBagIcon />}
            color="linear-gradient(135deg, #6f42c1 0%, #8551d9 100%)"
          />
        </Grid>

        {/* Queues Card */}
        <Grid item xs={12} md={4}>
          <StatCard
            title={isImmediateService() ? 'No. of Queues' : 'No. of Schedules'}
            value={dashboardData.queueCount}
            icon={<DashboardIcon />}
            color="linear-gradient(135deg, #0d6efd 0%, #3d8bfd 100%)"
          >
            {/* Simple line chart placeholder */}
            <Box sx={{ mt: 2, height: 40 }}>
              <svg width="100%" height="40" viewBox="0 0 200 40">
                <path d="M0,30 Q40,10 80,25 T160,15 T200,20" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
              </svg>
            </Box>
          </StatCard>
        </Grid>

        {/* Orders Card */}
        <Grid item xs={12} md={4}>
          <StatCard
            title={isImmediateService() ? 'Total Orders' : 'Total Appointments'}
            value={dashboardData.orderCount}
            icon={<AccountBalanceWalletIcon />}
            color="linear-gradient(135deg, #198754 0%, #28a745 100%)"
          />
        </Grid>
      </Grid>

      {/* Bottom Row */}
      <Grid container spacing={3}>
        {/* Latest Orders/Customers */}
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <Box sx={{ p: 3 }}>
              <LatestOrdersList
                orders={dashboardData.latestOrders}
                loading={loading}
                isImmediateService={isImmediateService}
                onRefresh={() => currentService?.id && fetchDashboardData(currentService.id, statsTimeRange)}
                onOrderClick={handleOrderClick}
                onViewAll={handleViewAllOrders}
                getStatusColor={getStatusColor}
              />
            </Box>
          </Card>
        </Grid>

        {/* Customer Trends Chart */}
        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', height: '100%', overflow: 'hidden' }}>
            <CustomerTrendsChart 
              customerStats={dashboardData.customerStats}
              timeLabels={timeLabels}
              loading={loading}
              statsTimeRange={statsTimeRange}
              onTimeRangeChange={handleStatsTimeRangeChange}
              onRefresh={() => currentService?.id && fetchDashboardData(currentService.id, statsTimeRange)}
              isImmediateService={isImmediateService}
            />
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;