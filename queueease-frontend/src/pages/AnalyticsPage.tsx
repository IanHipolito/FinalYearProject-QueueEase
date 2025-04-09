import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from 'context/AuthContext';
import { API } from '../services/api';
import ErrorDisplay from '../components/common/ErrorDisplay';
import LoadingIndicator from '../components/common/LoadingIndicator';
import { Box, Grid, Typography, SelectChangeEvent, Tabs, Tab, Paper } from '@mui/material';
import InsightsIcon from '@mui/icons-material/Insights';
import AssessmentIcon from '@mui/icons-material/Assessment';
import FeedbackIcon from '@mui/icons-material/Feedback';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import { AnalyticsData, TabPanelProps } from 'types/analyticsTypes';
import StatisticCard from '../components/analytics/StatisticCard';
import FeedbackDistributionChart from '../components/analytics/FeedbackDistributionChart';
import SatisfactionDonutChart from '../components/analytics/SatisfactionDonutChart';
import FeedbackTable from '../components/analytics/FeedbackTable';
import CustomerComments from '../components/analytics/CustomerComments';
import SentimentTrendChart from '../components/analytics/SentimentTrendChart';
import FeedbackKeywordCloud from '../components/analytics/FeedbackKeywordCloud';
import InsightsSection from '../components/analytics/InsightsSection';

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
      style={{ paddingTop: '16px' }}
    >
      {value === index && (
        <Box>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `analytics-tab-${index}`,
    'aria-controls': `analytics-tabpanel-${index}`,
  };
}

const AnalyticsPage: React.FC = () => {
  const { currentService } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analyticsTimeRange, setAnalyticsTimeRange] = useState('month');
  const [commentFilter, setCommentFilter] = useState('recent');
  const [activeTab, setActiveTab] = useState(0);
  
  // Separate state for sentiment trend
  const [sentimentTrendData, setSentimentTrendData] = useState<number[]>([]);

  // analyticsData initial state
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    feedback_distribution: [],
    customer_comments: [],
    total_reports: 0,
    satisfied_pct: 0,
    neutral_pct: 0,
    dissatisfied_pct: 0,
    average_wait_time: 0,
    wait_time_trend: [],
    satisfaction_trend: [],
    feedback_keywords: []
  });

  // Destructure with our new fields
  const {
    feedback_distribution: feedbackData,
    customer_comments: customerFeedback,
    total_reports: totalReports,
    satisfied_pct,
    average_wait_time: averageWaitTime,
    feedback_keywords: keywordData
  } = analyticsData;

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Separate fetch for sentiment trend
  const fetchSentimentTrend = useCallback(async () => {
    if (!currentService?.id) return;

    try {
      const data = await API.admin.getAnalytics(currentService.id, analyticsTimeRange);
      setSentimentTrendData(data.satisfaction_trend || []);
    } catch (err) {
      console.error('Error fetching sentiment trend:', err);
      setSentimentTrendData([]);
    }
  }, [currentService?.id, analyticsTimeRange]);

  // Main analytics data fetch
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!currentService?.id) return;

      setLoading(true);
      setError('');

      try {
        const data = await API.admin.getAnalytics(currentService.id, analyticsTimeRange);

        setAnalyticsData({
          feedback_distribution: data.feedback_distribution || [],
          customer_comments: data.customer_comments || [],
          total_reports: data.total_reports || 0,
          satisfied_pct: data.satisfied_pct || 0,
          neutral_pct: data.neutral_pct || 0,
          dissatisfied_pct: data.dissatisfied_pct || 0,
          average_wait_time: data.average_wait_time || 0,
          wait_time_trend: data.wait_time_trend || [],
          satisfaction_trend: data.satisfaction_trend || [],
          feedback_keywords: data.feedback_keywords || []
        });

        // Also fetch sentiment trend separately
        fetchSentimentTrend();
      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [currentService?.id, analyticsTimeRange, fetchSentimentTrend]);

  // Time range change handler
  const handleTimeRangeChange = (event: SelectChangeEvent) => {
    setAnalyticsTimeRange(event.target.value);
  };

  // Comment filter change handler
  const handleCommentFilterChange = (event: SelectChangeEvent) => {
    setCommentFilter(event.target.value);
  };

  // Filter comments based on selected filter
  const filteredComments = customerFeedback.filter(comment => {
    if (commentFilter === 'recent') return true;
    if (commentFilter === 'positive' && comment.rating >= 4) return true;
    if (commentFilter === 'negative' && comment.rating <= 2) return true;
    return false;
  });

  // Retry function for the error display component
  const handleRetry = () => {
    if (!currentService?.id) return;
    setLoading(true);
    setError('');
    
    // Using the same time range to retry
    fetchAnalytics();
  };
  
  // Fetch analytics helper function (extracted for reuse)
  const fetchAnalytics = async () => {
    if (!currentService?.id) return;
    
    try {
      const data = await API.admin.getAnalytics(currentService.id, analyticsTimeRange);
      
      setAnalyticsData({
        feedback_distribution: data.feedback_distribution || [],
        customer_comments: data.customer_comments || [],
        total_reports: data.total_reports || 0,
        satisfied_pct: data.satisfied_pct || 0,
        neutral_pct: data.neutral_pct || 0,
        dissatisfied_pct: data.dissatisfied_pct || 0,
        average_wait_time: data.average_wait_time || 0,
        wait_time_trend: data.wait_time_trend || [],
        satisfaction_trend: data.satisfaction_trend || [],
        feedback_keywords: data.feedback_keywords || []
      });
      
      // Also update sentiment trend
      setSentimentTrendData(data.satisfaction_trend || []);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading && !feedbackData.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <LoadingIndicator open={true} />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f5f7fb', minHeight: '100vh', p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="500">
          Analytics
        </Typography>
      </Box>

      {error && <ErrorDisplay error={error} onRetry={handleRetry} />}

      <Paper sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          aria-label="analytics tabs"
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            '& .MuiTab-root': { 
              minHeight: 64,
              fontWeight: 500
            },
            '& .Mui-selected': {
              color: theme => theme.palette.primary.main
            }
          }}
        >
          <Tab 
            icon={<AssessmentIcon />} 
            label="Overview" 
            iconPosition="start"
            sx={{ '& .MuiTab-iconWrapper': { mr: 1 } }}
            {...a11yProps(0)} 
          />
          <Tab 
            icon={<LightbulbIcon />} 
            label="Insights" 
            iconPosition="start"
            sx={{ '& .MuiTab-iconWrapper': { mr: 1 } }}
            {...a11yProps(1)} 
          />
        </Tabs>
      </Paper>

      <TabPanel value={activeTab} index={0}>
        {/* Top Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <StatisticCard
              title="Total Feedback Reports"
              value={totalReports}
              icon={<FeedbackIcon />}
              bgGradient="linear-gradient(135deg, #6f42c1 0%, #8551d9 100%)"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <StatisticCard
              title="Customer Satisfaction"
              value={`${satisfied_pct}%`}
              icon={<InsightsIcon />}
              bgGradient="linear-gradient(135deg, #0d6efd 0%, #3d8bfd 100%)"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <StatisticCard
              title="Average Wait Time"
              value={`${averageWaitTime} min`}
              icon={<AssessmentIcon />}
              bgGradient="linear-gradient(135deg, #198754 0%, #28a745 100%)"
            />
          </Grid>
        </Grid>

        {/* Charts Row */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={8}>
            <SentimentTrendChart
              data={sentimentTrendData}
              timeRange={analyticsTimeRange}
              onTimeRangeChange={handleTimeRangeChange}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            {/* Pass satisfied_pct into the donut chart */}
            <SatisfactionDonutChart satisfactionRate={satisfied_pct} />
          </Grid>

          <Grid item xs={12} md={8}>
            <FeedbackDistributionChart
              data={feedbackData}
              timeRange={analyticsTimeRange}
              onTimeRangeChange={handleTimeRangeChange}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FeedbackKeywordCloud keywords={keywordData} />
          </Grid>
        </Grid>

        {/* Feedback Data Table */}
        <FeedbackTable data={feedbackData} />

        {/* Customer Feedback Comments */}
        <CustomerComments
          comments={filteredComments}
          filter={commentFilter}
          onFilterChange={handleCommentFilterChange}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        {/* Insights Tab Content */}
        <InsightsSection 
          analyticsData={analyticsData} 
          timeRange={analyticsTimeRange} 
        />
      </TabPanel>
    </Box>
  );
};

export default AnalyticsPage;