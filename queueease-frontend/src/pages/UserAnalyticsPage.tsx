import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../services/api';
import { useAuth } from './AuthContext';
import {
  Box, Container, Typography, Grid, Paper, FormControl,
  InputLabel, Select, MenuItem, Button, Alert,
  CircularProgress, Tabs, Tab, useTheme, alpha
} from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventIcon from '@mui/icons-material/Event';
import FeedbackIcon from '@mui/icons-material/Feedback';
import RefreshIcon from '@mui/icons-material/Refresh';
import InsightsIcon from '@mui/icons-material/Insights';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PageHeader from '../components/common/PageHeader';
import StyledCard from '../components/common/StyledCard';
import UserActivityChart from '../components/analytics/UserActivityChart';
import WaitTimeStats from '../components/analytics/WaitTimeStats';
import FrequentServicesChart from '../components/analytics/FrequentServicesChart';
import AnalyticsSummaryCard from '../components/analytics/AnalyticsSummaryCard';
import FeedbackAnalyticsSection from '../components/analytics/FeedbackAnalyticsSection';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';
import { 
  AnalyticsHistoryEntry, 
  ServiceVisit,
  WaitTimeStatsEntry,
  WaitTimeByHourEntry,
  BusyTimeEntry,
  UserFeedback,
  AnalyticsData,
  AnalyticsApiResponse 
} from '../types/userAnalyticsTypes';

const UserAnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">('month');
  const [activeTab, setActiveTab] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalQueues: 0,
    completedQueues: 0,
    canceledQueues: 0,
    appointmentCount: 0,
    averageWaitTime: 0,
    queueHistory: [],
    mostVisitedServices: [],
    waitTimeByDay: [],
    waitTimeByHour: [],
    busyTimes: [],
    averageRating: 0
  });
  const [feedbackData, setFeedbackData] = useState<UserFeedback[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    fetchAnalyticsData();
    fetchFeedbackData();
  }, [user, timeRange, refreshKey]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Fetch analytics data
      const analyticsRes = await API.queues.getUserAnalytics(user!.id, timeRange);
      
      if (!analyticsRes.ok) {
        console.log('Analytics API failed, falling back to raw queue data');
        // Fall back to processing raw queue data
        await fetchRawQueueData();
      } else {
        // Use the data from the analytics endpoint
        const responseData = await analyticsRes.json() as AnalyticsApiResponse;
        
        // Handle queue history data - with fallback if missing
        let normalizedQueueHistory: AnalyticsHistoryEntry[] = [];

        // If the API provides queue history, use it
        if (responseData.queueHistory && Array.isArray(responseData.queueHistory) && responseData.queueHistory.length > 0) {
          normalizedQueueHistory = responseData.queueHistory.map((item: AnalyticsHistoryEntry) => ({
            ...item,
            status: item.status?.toLowerCase() === 'cancelled' ? 'canceled' : item.status
          }));
        } 
        else {
          // Fetch raw queue data if not provided
          const historyRes = await API.queues.getUserQueues(user!.id);
          
          if (historyRes.ok) {
            const historyData = await historyRes.json() as AnalyticsHistoryEntry[];
            normalizedQueueHistory = historyData.map((item: AnalyticsHistoryEntry) => ({
              ...item,
              status: item.status?.toLowerCase() === 'cancelled' ? 'canceled' : item.status
            }));
          }
        }

        // Fetch appointments data
        const appointmentsRes = await API.appointments.getAll(user!.id);
        let appointmentCount = 0;
        
        if (appointmentsRes.ok) {
          const appointmentsData = await appointmentsRes.json();
          appointmentCount = Array.isArray(appointmentsData) ? appointmentsData.length : 0;
        }
        
        setAnalyticsData({
          totalQueues: responseData.totalQueues || 0,
          completedQueues: responseData.completedQueues || 0,
          canceledQueues: responseData.canceledQueues || 0,
          appointmentCount,
          averageWaitTime: responseData.averageWaitTime || 0,
          queueHistory: normalizedQueueHistory,
          mostVisitedServices: responseData.mostVisitedServices || [],
          waitTimeByDay: ensureAllDaysPresent(responseData.waitTimeByDay || []),
          waitTimeByHour: responseData.waitTimeByHour || [],
          busyTimes: responseData.busyTimes || []
        });
      }
    } catch (err) {
      console.error("Error fetching analytics data:", err);
      setError('Failed to load analytics data. Please try again later.');
      
      // On error, clear data 
      setAnalyticsData({
        totalQueues: 0,
        completedQueues: 0,
        canceledQueues: 0,
        appointmentCount: 0,
        averageWaitTime: 0,
        queueHistory: [],
        mostVisitedServices: [],
        waitTimeByDay: [],
        waitTimeByHour: [],
        busyTimes: []
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedbackData = async () => {
    if (!user) return;
    
    try {
      const feedbackRes = await API.feedback.getUserFeedbackHistory(user.id);
      
      if (feedbackRes.ok) {
        const feedback = await feedbackRes.json();
        setFeedbackData(feedback);
        
        // Calculate average rating if we have feedback data
        if (Array.isArray(feedback) && feedback.length > 0) {
          const totalRating = feedback.reduce((sum, item) => sum + item.rating, 0);
          const avgRating = Math.round((totalRating / feedback.length) * 10) / 10;
          
          setAnalyticsData(prev => ({
            ...prev,
            averageRating: avgRating,
            userFeedback: feedback
          }));
        }
      }
    } catch (err) {
      console.error("Error fetching feedback data:", err);
    }
  };

  const fetchRawQueueData = async () => {
    try {
      const historyRes = await API.queues.getUserQueues(user!.id);
      
      if (!historyRes.ok) {
        throw new Error('Failed to fetch queue history');
      }
      
      const historyData = await historyRes.json() as AnalyticsHistoryEntry[];
      
      // Ensure proper status field values
      const normalizedData = historyData.map((item: AnalyticsHistoryEntry) => ({
        ...item,
        status: item.status?.toLowerCase() === 'cancelled' ? 'canceled' : item.status
      }));
      
      // Fetch appointments data
      const appointmentsRes = await API.appointments.getAll(user!.id);
      let appointmentCount = 0;
      
      if (appointmentsRes.ok) {
        const appointmentsData = await appointmentsRes.json();
        appointmentCount = Array.isArray(appointmentsData) ? appointmentsData.length : 0;
      }
      
      const processedData = processAnalyticsData(normalizedData, timeRange);
      setAnalyticsData({
        ...processedData,
        appointmentCount,
        queueHistory: normalizedData
      });
    } catch (error) {
      console.error("Error in fetchRawQueueData:", error);
      throw error;
    }
  };

  const processAnalyticsData = (
    historyData: AnalyticsHistoryEntry[],
    timeRange: "week" | "month" | "year"
  ): AnalyticsData => {
    // Filter data based on time range
    const now: Date = new Date();
    let startDate: Date;
    
    switch(timeRange) {
      case 'week':
        startDate = new Date(now.getTime());
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getTime());
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date(now.getTime());
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate = new Date(now.getTime());
        startDate.setMonth(now.getMonth() - 1);
    }
    
    const filteredHistory = historyData.filter(entry => 
      new Date(entry.date_created) >= startDate
    );
    
    // Calculate statistics from filtered data
    const completedQueues = filteredHistory.filter(q => q.status === 'completed').length;
    const canceledQueues = filteredHistory.filter(q => q.status === 'canceled' || q.status === 'cancelled').length;
    
    // Calculate average wait time from completed queues
    const totalWaitTime = filteredHistory
      .filter(q => q.status === 'completed' && q.waiting_time)
      .reduce((sum, queue) => {
        const waitTime = typeof queue.waiting_time === 'string' 
          ? parseInt(queue.waiting_time) 
          : (queue.waiting_time || 0);
        return sum + waitTime;
      }, 0);
        
    const averageWaitTime = completedQueues > 0 ? Math.round(totalWaitTime / completedQueues) : 0;
    
    // Get most visited services
    const serviceVisits: { [key: string]: number } = {};
    filteredHistory.forEach(q => {
      if (!serviceVisits[q.service_name]) {
        serviceVisits[q.service_name] = 0;
      }
      serviceVisits[q.service_name]++;
    });
    
    const mostVisitedServices: ServiceVisit[] = Object.entries(serviceVisits)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
        
    // Calculate wait time by day of week and hour of day
    const waitTimeByDay: WaitTimeStatsEntry[] = ensureAllDaysPresent(calculateWaitTimeByDay(filteredHistory));
    const waitTimeByHour: WaitTimeByHourEntry[] = calculateWaitTimeByHour(filteredHistory);
    
    // Calculate busy times
    const busyTimes: BusyTimeEntry[] = calculateBusyTimes(filteredHistory);
    
    return {
      totalQueues: filteredHistory.length,
      completedQueues,
      canceledQueues,
      appointmentCount: 0, // Will be updated elsewhere
      averageWaitTime,
      queueHistory: filteredHistory,
      mostVisitedServices,
      waitTimeByDay,
      waitTimeByHour,
      busyTimes
    };
  };

  // Ensure all days of the week are present in wait time data
  const ensureAllDaysPresent = (dayStats: WaitTimeStatsEntry[]): WaitTimeStatsEntry[] => {
    const days: string[] = [
      'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
    ];
    
    const dayMap: {[key: string]: WaitTimeStatsEntry} = {};
    
    // Map existing data
    dayStats.forEach(stat => {
      dayMap[stat.day] = stat;
    });
    
    // Ensure all days exist
    const completeStats = days.map(day => {
      return dayMap[day] || { day, avgWait: 0, count: 0 };
    });
    
    return completeStats;
  };

  const calculateWaitTimeByDay = (
    history: AnalyticsHistoryEntry[]
  ): WaitTimeStatsEntry[] => {
    const days: string[] = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday'
    ];
    
    // Initialize all days with zero values
    const dayStats = days.map(day => ({ 
      day, 
      totalWait: 0, 
      count: 0 
    }));

    history.forEach(queue => {
      if (queue.waiting_time && queue.status === 'completed') {
        const waitTime = typeof queue.waiting_time === 'string' 
          ? parseInt(queue.waiting_time) 
          : (queue.waiting_time || 0);
          
        if (waitTime > 0) {
          const date: Date = new Date(queue.date_created);
          const dayIndex: number = date.getDay();
          dayStats[dayIndex].totalWait += waitTime;
          dayStats[dayIndex].count++;
        }
      }
    });

    return dayStats.map(stat => ({
      day: stat.day,
      avgWait: stat.count > 0 ? Math.round(stat.totalWait / stat.count) : 0,
      count: stat.count
    }));
  };

  const calculateWaitTimeByHour = (
    history: AnalyticsHistoryEntry[]
  ): WaitTimeByHourEntry[] => {
    const hourStats = Array.from({ length: 24 }, (_, i) => ({ 
      hour: i, 
      totalWait: 0, 
      count: 0 
    }));

    history.forEach(queue => {
      if (queue.waiting_time && queue.status === 'completed') {
        const waitTime = typeof queue.waiting_time === 'string' 
          ? parseInt(queue.waiting_time) 
          : (queue.waiting_time || 0);
          
        if (waitTime > 0) {
          const date: Date = new Date(queue.date_created);
          const hour: number = date.getHours();
          hourStats[hour].totalWait += waitTime;
          hourStats[hour].count++;
        }
      }
    });

    return hourStats
      .filter(stat => stat.count > 0)
      .map(stat => ({
        hour: stat.hour,
        avgWait: Math.round(stat.totalWait / stat.count),
        count: stat.count
      }));
  };

  const calculateBusyTimes = (
    history: AnalyticsHistoryEntry[]
  ): BusyTimeEntry[] => {
    const days: string[] = [
      'Sunday', 
      'Monday', 
      'Tuesday', 
      'Wednesday', 
      'Thursday', 
      'Friday', 
      'Saturday'
    ];
    const busyTimes: BusyTimeEntry[] = [];
    
    // Group by day and hour
    const dayHourMap: Record<string, { day: number; hour: number; count: number; }> = {};
    
    history.forEach(queue => {
      const date: Date = new Date(queue.date_created);
      const day: number = date.getDay();
      const hour: number = date.getHours();
      const key: string = `${day}-${hour}`;
      
      if (!dayHourMap[key]) {
        dayHourMap[key] = { day, hour, count: 0 };
      }
      
      dayHourMap[key].count++;
    });
    
    // Convert to array and sort by count
    Object.values(dayHourMap).forEach((item) => {
      busyTimes.push({
        dayName: days[item.day],
        hour: item.hour,
        count: item.count
      });
    });
    
    return busyTimes.sort((a, b) => b.count - a.count).slice(0, 5);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: 2,
        bgcolor: alpha(theme.palette.primary.main, 0.03)
      }}>
        <CircularProgress color="primary" size={50} />
        <Typography variant="subtitle1" color="text.secondary">
          Loading your analytics...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: alpha(theme.palette.primary.main, 0.03), 
      py: 4,
      backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.7), rgba(255,255,255,1))' 
    }}>
      <Container maxWidth="lg">
        <PageHeader title="Your Queue Analytics" backUrl="/usermainpage" />
        
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3, 
              borderRadius: 2, 
              boxShadow: '0 2px 10px rgba(0,0,0,0.08)' 
            }}
          >
            {error}
          </Alert>
        )}
        
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 3,
            bgcolor: 'white',
            p: 2,
            borderRadius: 3,
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            transition: 'transform 0.2s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControl size="small" sx={{ width: 150 }}>
              <InputLabel id="time-range-label">Time Period</InputLabel>
              <Select
                labelId="time-range-label"
                id="time-range"
                value={timeRange}
                label="Time Period"
                onChange={(e) => setTimeRange(e.target.value as "week" | "month" | "year")}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="week">Last Week</MenuItem>
                <MenuItem value="month">Last Month</MenuItem>
                <MenuItem value="year">Last Year</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            sx={{ 
              borderRadius: 2,
              bgcolor: theme.palette.primary.main,
              px: 3,
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              '&:hover': {
                bgcolor: theme.palette.primary.dark,
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 10px rgba(0,0,0,0.15)',
              }
            }}
          >
            Refresh
          </Button>
        </Box>
        
        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <AnalyticsSummaryCard
              title="Total Queues"
              value={analyticsData.totalQueues}
              icon={<BarChartIcon />}
              color="linear-gradient(135deg, #6f42c1 0%, #8551d9 100%)"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <AnalyticsSummaryCard
              title="Completed"
              value={analyticsData.completedQueues}
              icon={<EventIcon />}
              color="linear-gradient(135deg, #198754 0%, #28a745 100%)"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <AnalyticsSummaryCard
              title="Appointments"
              value={analyticsData.appointmentCount}
              icon={<CalendarMonthIcon />}
              color="linear-gradient(135deg, #0d6efd 0%, #3d8bfd 100%)"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <AnalyticsSummaryCard
              title="Avg. Wait Time"
              value={`${analyticsData.averageWaitTime} min`}
              icon={<AccessTimeIcon />}
              color="linear-gradient(135deg, #fd7e14 0%, #ffb34d 100%)"
            />
          </Grid>
        </Grid>
        
        {/* Tabs Navigation */}
        <Paper 
          elevation={0} 
          sx={{ 
            borderRadius: 3, 
            mb: 3, 
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            overflow: 'hidden',
            transition: 'transform 0.2s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
            }
          }}
        >
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider',
              '& .MuiTabs-indicator': {
                backgroundColor: theme.palette.primary.main,
                height: 3
              },
              '& .MuiTab-root': {
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.95rem',
                transition: 'all 0.2s ease',
                '&:hover': {
                  color: theme.palette.primary.main,
                  backgroundColor: alpha(theme.palette.primary.main, 0.04)
                }
              }
            }}
          >
            <Tab 
              label="Activity" 
              icon={<InsightsIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="Wait Times" 
              icon={<AccessTimeIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="Feedback" 
              icon={<FeedbackIcon />} 
              iconPosition="start"
            />
          </Tabs>
        </Paper>
        
        {/* Activity Tab Content */}
        {activeTab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <StyledCard sx={{ 
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)', 
                borderRadius: 4,
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.1)'
                }
              }}>
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    <InsightsIcon sx={{ mr: 1, verticalAlign: 'middle', color: theme.palette.primary.main }} />
                    Your Queue Activity
                  </Typography>
                  <UserActivityChart queueHistory={analyticsData.queueHistory} timeRange={timeRange} />
                </Box>
              </StyledCard>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <StyledCard sx={{ 
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)', 
                borderRadius: 4,
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.1)'
                },
                height: '100%'
              }}>
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Most Visited Services
                  </Typography>
                  <FrequentServicesChart services={analyticsData.mostVisitedServices} />
                </Box>
              </StyledCard>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                  height: '100%',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Summary
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={6} md={3}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Total Entries
                      </Typography>
                      <Typography variant="h5" fontWeight={700}>
                        {analyticsData.totalQueues}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Queue Entries
                      </Typography>
                      <Typography variant="h5" fontWeight={700}>
                        {analyticsData.totalQueues - analyticsData.appointmentCount}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Appointments
                      </Typography>
                      <Typography variant="h5" fontWeight={700}>
                        {analyticsData.appointmentCount}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Completed
                      </Typography>
                      <Typography variant="h5" fontWeight={700}>
                        {analyticsData.completedQueues}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        )}
        
        {/* Wait Times Tab Content */}
        {activeTab === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <StyledCard sx={{ 
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)', 
                borderRadius: 4,
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.1)'
                }
              }}>
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Wait Time by Day of Week
                  </Typography>
                  <WaitTimeStats data={analyticsData.waitTimeByDay} type="day" />
                </Box>
              </StyledCard>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <StyledCard sx={{ 
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)', 
                borderRadius: 4,
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.1)'
                }
              }}>
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Wait Time by Hour of Day
                  </Typography>
                  <WaitTimeStats data={analyticsData.waitTimeByHour} type="hour" />
                </Box>
              </StyledCard>
            </Grid>

            <Grid item xs={12}>
              <StyledCard sx={{ 
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)', 
                borderRadius: 4,
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.1)'
                }
              }}>
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Wait Time Trends
                  </Typography>
                  <Box sx={{ height: 300, mt: 2 }}>
                    {analyticsData.waitTimeByDay.some(day => day.avgWait > 0) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={analyticsData.waitTimeByDay}
                          margin={{ top: 10, right: 10, left: 10, bottom: 30 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={alpha('#000', 0.1)} />
                          <XAxis 
                            dataKey="day" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                            tickFormatter={(value) => value.substring(0, 3)}
                          />
                          <YAxis 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                            label={{ 
                              value: 'Minutes', 
                              angle: -90, 
                              position: 'insideLeft',
                              fill: theme.palette.text.secondary,
                              fontSize: 12
                            }}
                          />
                          <Tooltip
                            formatter={(value, name) => {
                              if (name === "avgWait") return [`${value} min`, 'Avg. Wait Time'];
                              if (name === "count") return [value, 'Visit Count'];
                              return [value, name];
                            }}
                            labelFormatter={(label) => `${label}`}
                            contentStyle={{ 
                              borderRadius: 8,
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                              border: 'none'
                            }}
                          />
                          <Legend verticalAlign="top" height={36} />
                          <Line 
                            type="monotone" 
                            dataKey="avgWait" 
                            name="Avg. Wait Time" 
                            stroke={theme.palette.primary.main} 
                            strokeWidth={3}
                            dot={{ 
                              fill: theme.palette.primary.main, 
                              strokeWidth: 2, 
                              r: 5,
                              strokeDasharray: '' 
                            }}
                            activeDot={{ r: 7, strokeWidth: 0 }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="count" 
                            name="Visit Count" 
                            stroke={theme.palette.secondary.main} 
                            strokeWidth={2}
                            dot={{ 
                              fill: theme.palette.secondary.main,  
                              r: 4,
                              strokeDasharray: '' 
                            }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        height: '100%',
                        flexDirection: 'column'
                      }}>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                          No wait time data available
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Try changing the time period or check back later
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </StyledCard>
            </Grid>
          </Grid>
        )}
        
        {/* Feedback Tab Content */}
        {activeTab === 2 && (
          <FeedbackAnalyticsSection 
            userFeedback={analyticsData.userFeedback || []} 
            averageRating={analyticsData.averageRating || 0}
            userId={user!.id}
          />
        )}
      </Container>
    </Box>
  );
};

export default UserAnalyticsPage;