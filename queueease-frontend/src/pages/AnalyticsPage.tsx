import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { API } from '../services/api';
import ErrorDisplay from '../components/common/ErrorDisplay';
import LoadingIndicator from '../components/common/LoadingIndicator';
import {
  Box,
  Grid,
  Typography,
  SelectChangeEvent
} from '@mui/material';
import InsightsIcon from '@mui/icons-material/Insights';
import AssessmentIcon from '@mui/icons-material/Assessment';
import FeedbackIcon from '@mui/icons-material/Feedback';
import { AnalyticsData } from '../types/analyticsTypes';
import StatisticCard from '../components/analytics/StatisticCard';
import FeedbackDistributionChart from '../components/analytics/FeedbackDistributionChart';
import SatisfactionDonutChart from '../components/analytics/SatisfactionDonutChart';
import FeedbackTable from '../components/analytics/FeedbackTable';
import CustomerComments from '../components/analytics/CustomerComments';
import SentimentTrendChart from '../components/analytics/SentimentTrendChart';
import FeedbackKeywordCloud from '../components/analytics/FeedbackKeywordCloud';

const AnalyticsPage: React.FC = () => {
  const { currentService } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analyticsTimeRange, setAnalyticsTimeRange] = useState('month');
  const [commentFilter, setCommentFilter] = useState('recent');

  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    feedback_distribution: [],
    customer_comments: [],
    total_reports: 0,
    satisfaction_rate: 0,
    average_wait_time: 0,
    wait_time_trend: [],
    satisfaction_trend: [],
    feedback_keywords: []
  });

  const {
    feedback_distribution: feedbackData,
    customer_comments: customerFeedback,
    total_reports: totalReports,
    satisfaction_rate: satisfactionRate,
    average_wait_time: averageWaitTime,
    satisfaction_trend: sentimentTrendData,
    feedback_keywords: keywordData
  } = analyticsData;

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!currentService?.id) return;

      setLoading(true);
      setError('');

      try {
        const response = await API.admin.getAnalytics(currentService.id, analyticsTimeRange);

        if (!response.ok) {
          let errorMessage = 'Failed to load analytics data';
          let errorData;

          try {
            errorData = await response.json();
            console.error('API response error:', errorData);

            // Special handling for known backend errors
            if (errorData.error && (
              errorData.error.includes('Resource punkt_tab not found') ||
              errorData.error.includes('NLTK')
            )) {
              console.log("NLTK dependency missing on the server, using fallback approach...");

              setAnalyticsData({
                feedback_distribution: [],
                customer_comments: [],
                total_reports: 0,
                satisfaction_rate: 0,
                average_wait_time: 0,
                wait_time_trend: Array(12).fill(0),
                satisfaction_trend: Array(12).fill(0),
                feedback_keywords: []
              });

              setError("Natural Language Processing features are unavailable. The server is missing required NLTK packages. Please contact the administrator.");
              setLoading(false);
              return;
            }

            if (errorData.error && errorData.error.includes("'Queue' object has no attribute 'total_wait'")) {
              console.log("Queue total_wait attribute missing, using fallback approach...");

              setAnalyticsData({
                feedback_distribution: errorData.feedback_distribution || [],
                customer_comments: errorData.customer_comments || [],
                total_reports: errorData.total_reports || 0,
                satisfaction_rate: errorData.satisfaction_rate || 0,
                average_wait_time: 0,
                wait_time_trend: Array(12).fill(0),
                satisfaction_trend: errorData.satisfaction_trend || Array(12).fill(0),
                feedback_keywords: errorData.feedback_keywords || []
              });

              setError("Note: Wait time analysis is currently unavailable. Other analytics are still accessible.");
              setLoading(false);
              return;
            }

            errorMessage = errorData.error || errorMessage;
          } catch (err) {
            const errorText = await response.text().catch(() => '');
            console.error('API response error:', errorText);
          }
          throw new Error(`Failed to load analytics data: ${response.status}`);
        }

        const data = await response.json();

        setAnalyticsData({
          feedback_distribution: data.feedback_distribution || [],
          customer_comments: data.customer_comments || [],
          total_reports: data.total_reports || 0,
          satisfaction_rate: data.satisfaction_rate || 0,
          average_wait_time: data.average_wait_time || 0,
          wait_time_trend: data.wait_time_trend || Array(12).fill(0),
          satisfaction_trend: data.satisfaction_trend || Array(12).fill(0),
          feedback_keywords: data.feedback_keywords || []
        });

      } catch (err: any) {
        console.error('Error fetching analytics data:', err);
        setError(err.message || 'Failed to load analytics data');
        setAnalyticsData({
          feedback_distribution: [],
          customer_comments: [],
          total_reports: 0,
          satisfaction_rate: 0,
          average_wait_time: 0,
          wait_time_trend: Array(12).fill(0),
          satisfaction_trend: Array(12).fill(0),
          feedback_keywords: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [currentService?.id, analyticsTimeRange]);

  const handleTimeRangeChange = (event: SelectChangeEvent) => {
    setAnalyticsTimeRange(event.target.value);
  };

  const handleCommentFilterChange = (event: SelectChangeEvent) => {
    setCommentFilter(event.target.value);
  };

  const filteredComments = customerFeedback.filter(comment => {
    if (commentFilter === 'recent') return true;
    if (commentFilter === 'positive' && comment.rating >= 4) return true;
    if (commentFilter === 'negative' && comment.rating <= 2) return true;
    return commentFilter === 'recent';
  });

  const lineChart = (
    <svg width="100%" height="40" viewBox="0 0 200 40">
      <path d="M0,30 Q40,15 80,25 T160,10 T200,20" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
    </svg>
  );

  const generateTimeLabels = (timeRange: string): string[] => {
    if (timeRange === 'week') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return days;
    } else if (timeRange === 'month') {
      return ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    } else {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months;
    }
  };

  if (loading && !feedbackData.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <LoadingIndicator open={true} />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f5f7fb', minHeight: '100vh', p: 3 }}>
      <Typography variant="h5" fontWeight="500" gutterBottom>
        Analytics
      </Typography>

      {error && <ErrorDisplay error={error} onRetry={() => {
        setAnalyticsTimeRange(analyticsTimeRange);
      }} />}

      {/* Top Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <StatisticCard
            title="Total Feedback Reports"
            value={totalReports}
            icon={<FeedbackIcon />}
            trend="+12%"
            bgGradient="linear-gradient(135deg, #6f42c1 0%, #8551d9 100%)"
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <StatisticCard
            title="Customer Satisfaction"
            value={`${satisfactionRate}%`}
            icon={<InsightsIcon />}
            bgGradient="linear-gradient(135deg, #0d6efd 0%, #3d8bfd 100%)"
            chart={lineChart}
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
          <FeedbackDistributionChart
            data={feedbackData}
            timeRange={analyticsTimeRange}
            onTimeRangeChange={handleTimeRangeChange}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <SatisfactionDonutChart satisfactionRate={satisfactionRate} />
        </Grid>

        <Grid item xs={12} md={8}>
          <SentimentTrendChart
            data={sentimentTrendData}
            timeLabels={generateTimeLabels(analyticsTimeRange)}
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
    </Box>
  );
};

export default AnalyticsPage;