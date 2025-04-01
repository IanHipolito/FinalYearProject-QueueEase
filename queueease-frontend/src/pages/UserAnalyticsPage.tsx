import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../services/api';
import { useAuth } from './AuthContext';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Tooltip
} from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventIcon from '@mui/icons-material/Event';
import DateRangeIcon from '@mui/icons-material/DateRange';
import RefreshIcon from '@mui/icons-material/Refresh';
import InsightsIcon from '@mui/icons-material/Insights';
import PageHeader from '../components/common/PageHeader';
import StyledCard from '../components/common/StyledCard';

// Analytics components
import UserActivityChart from '../components/analytics/UserActivityChart';
import WaitTimeStats from '../components/analytics/WaitTimeStats';
import FrequentServicesChart from '../components/analytics/FrequentServicesChart';
import AnalyticsSummaryCard from '../components/analytics/AnalyticsSummaryCard';

interface AnalyticsHistoryEntry {
  id: number;
  date_created: string;
  status: string;
  waiting_time?: string | number;
  service_name: string;
  service_type?: 'immediate' | 'appointment';
  category?: string;
}

// interface NormalizedQueueItem extends AnalyticsHistoryEntry {
// }

interface ServiceVisit {
  name: string;
  count: number;
}

interface WaitTimeStatsEntry {
  day: string;
  avgWait: number;
  count: number;
}

interface WaitTimeByHourEntry {
  hour: number;
  avgWait: number;
  count: number;
}

interface BusyTimeEntry {
  dayName: string;
  hour: number;
  count: number;
}

interface AnalyticsData {
  totalQueues: number;
  completedQueues: number;
  canceledQueues: number;
  averageWaitTime: number;
  queueHistory: AnalyticsHistoryEntry[];
  mostVisitedServices: ServiceVisit[];
  waitTimeByDay: WaitTimeStatsEntry[];
  waitTimeByHour: WaitTimeByHourEntry[];
  busyTimes: BusyTimeEntry[];
}

interface AnalyticsApiResponse {
  totalQueues?: number;
  completedQueues?: number;
  canceledQueues?: number;
  averageWaitTime?: number;
  queueHistory?: AnalyticsHistoryEntry[];
  mostVisitedServices?: ServiceVisit[];
  waitTimeByDay?: WaitTimeStatsEntry[];
  waitTimeByHour?: WaitTimeByHourEntry[];
  busyTimes?: BusyTimeEntry[];
}

const UserAnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">('month');
  const [debugMode, setDebugMode] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalQueues: 0,
    completedQueues: 0,
    canceledQueues: 0,
    averageWaitTime: 0,
    queueHistory: [],
    mostVisitedServices: [],
    waitTimeByDay: [],
    waitTimeByHour: [],
    busyTimes: []
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    fetchAnalyticsData();
  }, [user, timeRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Fetching analytics data for time range:', timeRange);
      const analyticsRes = await API.queues.getUserAnalytics(user!.id, timeRange);
      
      if (!analyticsRes.ok) {
        console.log('Analytics API failed, falling back to raw queue data');
        // Fall back to processing raw queue data if the dedicated endpoint fails
        const historyRes = await API.queues.getUserQueues(user!.id);
        
        if (!historyRes.ok) {
          throw new Error('Failed to fetch queue history');
        }
        
        const historyData = await historyRes.json() as AnalyticsHistoryEntry[];
        console.log('Raw queue history data:', historyData);
        
        // Ensure proper status field values
        const normalizedData = historyData.map((item: AnalyticsHistoryEntry) => ({
          ...item,
          // Normalize status values for consistency
          status: item.status?.toLowerCase() === 'cancelled' ? 'canceled' : item.status
        }));
        
        const processedData = processAnalyticsData(normalizedData, timeRange);
        setAnalyticsData({
          ...processedData,
          queueHistory: normalizedData
        });
      } else {
        // Use the data from the analytics endpoint
        const responseData = await analyticsRes.json() as AnalyticsApiResponse;
        console.log('Analytics API response:', responseData);
        
        // Log the API response structure to debug missing queue history
        console.log('API response data structure:', {
          responseKeys: Object.keys(responseData),
          hasQueueHistory: responseData.hasOwnProperty('queueHistory'),
          queueHistoryType: responseData.queueHistory ? typeof responseData.queueHistory : 'not present',
          queueHistoryLength: responseData.queueHistory ? responseData.queueHistory.length : 0
        });

        // Handle queue history data - with fallback if missing
        let normalizedQueueHistory: AnalyticsHistoryEntry[] = [];

        // If the API provides queue history, use it
        if (responseData.queueHistory && Array.isArray(responseData.queueHistory) && responseData.queueHistory.length > 0) {
          normalizedQueueHistory = responseData.queueHistory.map((item: AnalyticsHistoryEntry) => ({
            ...item,
            status: item.status?.toLowerCase() === 'cancelled' ? 'canceled' : item.status
          }));
          console.log('Using queue history from API response');
        } 
        else {
          console.log('Queue history not provided in API response, fetching raw queue data');
          try {
            const historyRes = await API.queues.getUserQueues(user!.id);
            
            if (historyRes.ok) {
              const historyData = await historyRes.json() as AnalyticsHistoryEntry[];
              normalizedQueueHistory = historyData.map((item: AnalyticsHistoryEntry) => ({
                ...item,
                status: item.status?.toLowerCase() === 'cancelled' ? 'canceled' : item.status
              }));
              console.log(`Fetched ${normalizedQueueHistory.length} queue history entries directly`);
            } else {
              console.error('Failed to fetch queue history');
            }
          } catch (err) {
            console.error('Error fetching queue history:', err);
          }
        }
        
        setAnalyticsData({
          totalQueues: responseData.totalQueues || 0,
          completedQueues: responseData.completedQueues || 0,
          canceledQueues: responseData.canceledQueues || 0,
          averageWaitTime: responseData.averageWaitTime || 0,
          queueHistory: normalizedQueueHistory,
          mostVisitedServices: responseData.mostVisitedServices || [],
          waitTimeByDay: responseData.waitTimeByDay || [],
          waitTimeByHour: responseData.waitTimeByHour || [],
          busyTimes: responseData.busyTimes || []
        });
        
        console.log('Final analytics data being set:', {
          totalCount: responseData.totalQueues,
          queueHistoryCount: normalizedQueueHistory?.length || 'N/A',
          hasCompletedItems: normalizedQueueHistory?.some(q => q.status === 'completed') || false,
          hasCanceledItems: normalizedQueueHistory?.some(q => q.status === 'canceled') || false,
          timeRange
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
    const waitTimeByDay: WaitTimeStatsEntry[] = calculateWaitTimeByDay(filteredHistory);
    const waitTimeByHour: WaitTimeByHourEntry[] = calculateWaitTimeByHour(filteredHistory);
    
    // Calculate busy times
    const busyTimes: BusyTimeEntry[] = calculateBusyTimes(filteredHistory);
    
    return {
      totalQueues: filteredHistory.length,
      completedQueues,
      canceledQueues,
      averageWaitTime,
      queueHistory: filteredHistory,
      mostVisitedServices,
      waitTimeByDay,
      waitTimeByHour,
      busyTimes
    };
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
    fetchAnalyticsData();
  };

  // Debug Panel component
  const DebugPanel = () => {
    if (!debugMode) return null;
    
    return (
      <Paper sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5', fontSize: '12px', maxHeight: '200px', overflow: 'auto' }}>
        <Typography variant="subtitle2">Debug Information</Typography>
        <Box component="pre" sx={{ fontSize: '11px' }}>
          {JSON.stringify({
            timeRange,
            queueHistory: analyticsData.queueHistory?.map(q => ({
              id: q.id,
              status: q.status,
              date: q.date_created?.substring(0, 10),
            })).slice(0, 5),
            counts: {
              total: analyticsData.totalQueues,
              completed: analyticsData.completedQueues,
              canceled: analyticsData.canceledQueues,
            },
            queueHistoryLength: analyticsData.queueHistory?.length || 0
          }, null, 2)}
        </Box>
        <Button 
          size="small" 
          variant="outlined" 
          onClick={() => console.log('Full analytics data:', analyticsData)}
          sx={{ mr: 1 }}
        >
          Log Data
        </Button>
        <Button 
          size="small" 
          variant="outlined" 
          onClick={() => setDebugMode(false)}
        >
          Close
        </Button>
      </Paper>
    );
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
        bgcolor: '#f8fafd'
      }}>
        <CircularProgress color="primary" size={50} />
        <Typography variant="subtitle1" color="text.secondary">
          Loading your analytics...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafd', py: 4 }}>
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
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
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
            
            <Button
              variant="outlined"
              size="small"
              onClick={() => setDebugMode(!debugMode)}
              sx={{ 
                ml: 2,
                borderRadius: 2
              }}
            >
              {debugMode ? 'Hide Debug' : 'Debug'}
            </Button>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            sx={{ 
              borderRadius: 2,
              bgcolor: '#6f42c1',
              '&:hover': {
                bgcolor: '#5e35b1',
              },
              px: 3
            }}
          >
            Refresh
          </Button>
        </Box>
        
        {/* Debug Panel */}
        <DebugPanel />
        
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
              title="Canceled"
              value={analyticsData.canceledQueues}
              icon={<DateRangeIcon />}
              color="linear-gradient(135deg, #dc3545 0%, #e35d6a 100%)"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <AnalyticsSummaryCard
              title="Avg. Wait Time"
              value={`${analyticsData.averageWaitTime} min`}
              icon={<AccessTimeIcon />}
              color="linear-gradient(135deg, #0d6efd 0%, #3d8bfd 100%)"
            />
          </Grid>
        </Grid>
        
        {/* Charts */}
        <Grid container spacing={3}>
          {/* Activity Chart - Full width */}
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
                  <InsightsIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#6f42c1' }} />
                  Your Queue Activity
                </Typography>
                <UserActivityChart queueHistory={analyticsData.queueHistory} timeRange={timeRange} />
              </Box>
            </StyledCard>
          </Grid>
          
          {/* Wait Time Stats and Most Visited Services - Side by side */}
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
          
          {/* Most Used Services - Moved beside Wait Time */}
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
        </Grid>
        
        {/* History Summary */}
        <Box sx={{ mt: 3 }}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
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
                    {analyticsData.totalQueues - 
                     (analyticsData.queueHistory.filter(q => 
                       q.service_type === 'appointment').length)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Appointments
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {analyticsData.queueHistory.filter(q => 
                      q.service_type === 'appointment').length}
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
        </Box>
      </Container>
    </Box>
  );
};

export default UserAnalyticsPage;