import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { API } from '../services/api';
import ErrorDisplay from '../components/common/ErrorDisplay';
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
  Card,
  CardContent,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar,
  Divider,
  Chip,
  Rating,
  SelectChangeEvent
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import InsightsIcon from '@mui/icons-material/Insights';
import AssessmentIcon from '@mui/icons-material/Assessment';
import FeedbackIcon from '@mui/icons-material/Feedback';
import ChatIcon from '@mui/icons-material/Chat';

interface FeedbackCategory {
  id: number;
  category: string;
  satisfied: number;
  neutral: number;
  dissatisfied: number;
  total?: number;
}

interface CustomerComment {
  id: number;
  name: string;
  date: string;
  queue: string;
  rating: number;
  comment: string;
  avatar?: string;
}

interface AnalyticsData {
  feedback_distribution: FeedbackCategory[];
  customer_comments: CustomerComment[];
  total_reports: number;
  satisfaction_rate: number;
  average_wait_time: number;
  wait_time_trend: number[];
  satisfaction_trend: number[];
}

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
    satisfaction_trend: []
  });

  // Extract data for easier access
  const { 
    feedback_distribution: feedbackData,
    customer_comments: customerFeedback,
    total_reports: totalReports,
    satisfaction_rate: satisfactionRate,
    average_wait_time: averageWaitTime
  } = analyticsData;
  
  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!currentService?.id) return;
      
      setLoading(true);
      setError('');
      
      try {
        const response = await API.admin.getAnalytics(
          currentService.id, 
          analyticsTimeRange
        );
        const data = await API.handleResponse(response);
        
        setAnalyticsData({
          feedback_distribution: data.feedback_distribution || [],
          customer_comments: data.customer_comments || [],
          total_reports: data.total_reports || 0,
          satisfaction_rate: data.satisfaction_rate || 0,
          average_wait_time: data.average_wait_time || 0,
          wait_time_trend: data.wait_time_trend || [],
          satisfaction_trend: data.satisfaction_trend || []
        });
        
      } catch (err: any) {
        console.error('Error fetching analytics data:', err);
        setError(err.message || 'Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, [currentService?.id, analyticsTimeRange]);

  // Handle time range change
  const handleTimeRangeChange = (event: SelectChangeEvent) => {
    setAnalyticsTimeRange(event.target.value);
  };

  // Handle comment filter change
  const handleCommentFilterChange = (event: SelectChangeEvent) => {
    setCommentFilter(event.target.value);
  };

  // Filter comments based on selected filter
  const filteredComments = customerFeedback.filter(comment => {
    if (commentFilter === 'recent') return true;
    if (commentFilter === 'positive' && comment.rating >= 4) return true;
    if (commentFilter === 'negative' && comment.rating <= 2) return true;
    return commentFilter === 'recent';
  });

  // If still loading data
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
        setAnalyticsTimeRange(analyticsTimeRange);  // Trigger a re-fetch
      }} />}

      {/* Top Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Total Reports Card */}
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
                  <FeedbackIcon />
                </Box>
                <IconButton sx={{ color: 'white' }}>
                  <MoreVertIcon />
                </IconButton>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="h3" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center' }}>
                  {totalReports}
                  <Box component="span" sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    fontSize: '0.5em', 
                    p: 0.5, 
                    borderRadius: 1, 
                    ml: 1 
                  }}>
                    +12%
                  </Box>
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                  Total Feedback Reports
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Customer Satisfaction Card */}
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
                  <InsightsIcon />
                </Box>
                <IconButton sx={{ color: 'white' }}>
                  <MoreVertIcon />
                </IconButton>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="h3" fontWeight="bold">
                  {satisfactionRate}%
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                  Customer Satisfaction
                </Typography>
              </Box>
              <Box sx={{ mt: 2, height: 40 }}>
                {/* Simple line chart placeholder - we could use a real chart library here */}
                <svg width="100%" height="40" viewBox="0 0 200 40">
                  <path d="M0,30 Q40,15 80,25 T160,10 T200,20" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
                </svg>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Average Wait Time Card */}
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
                  <AssessmentIcon />
                </Box>
                <IconButton sx={{ color: 'white' }}>
                  <MoreVertIcon />
                </IconButton>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="h3" fontWeight="bold">
                  {averageWaitTime} min
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                  Average Wait Time
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Feedback Distribution Card */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="500">
                  Feedback Distribution
                </Typography>
                <FormControl size="small" sx={{ width: 120 }}>
                  <Select
                    value={analyticsTimeRange}
                    onChange={handleTimeRangeChange}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="week">This Week</MenuItem>
                    <MenuItem value="month">This Month</MenuItem>
                    <MenuItem value="year">This Year</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              {/* Bar Chart Placeholder */}
              <Box sx={{ height: 300, mt: 2 }}>
                <Paper sx={{ 
                  height: '100%', 
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-around',
                  p: 2
                }}>
                  {feedbackData.map((item, index) => (
                    <Box key={index} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20%' }}>
                      <Box sx={{ display: 'flex', height: '230px', alignItems: 'flex-end', width: '100%' }}>
                        <Box 
                          sx={{ 
                            width: '30%', 
                            bgcolor: '#e57373', 
                            height: `${item.dissatisfied}%`,
                            borderRadius: '4px 4px 0 0'
                          }} 
                        />
                        <Box 
                          sx={{ 
                            width: '30%', 
                            bgcolor: '#ffb74d', 
                            height: `${item.neutral}%`,
                            borderRadius: '4px 4px 0 0',
                            mx: 0.5
                          }} 
                        />
                        <Box 
                          sx={{ 
                            width: '30%', 
                            bgcolor: '#81c784', 
                            height: `${item.satisfied}%`,
                            borderRadius: '4px 4px 0 0'
                          }} 
                        />
                      </Box>
                      <Typography variant="body2" sx={{ mt: 1, fontSize: '0.75rem' }}>
                        {item.category}
                      </Typography>
                    </Box>
                  ))}
                </Paper>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Donut Chart Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="500" gutterBottom>
                Customer Feedback
              </Typography>
              
              {/* Donut Chart Placeholder */}
              <Box sx={{ 
                height: 200, 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                position: 'relative',
                mt: 2
              }}>
                {/* SVG Donut Chart - would use a proper chart library in production */}
                <svg width="200" height="200" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="70" fill="none" stroke="#e8f5e9" strokeWidth="30" />
                  <circle cx="100" cy="100" r="70" fill="none" stroke="#ffebee" strokeWidth="30" strokeDasharray="440" strokeDashoffset="374" />
                  <circle cx="100" cy="100" r="70" fill="none" stroke="#e3f2fd" strokeWidth="30" strokeDasharray="440" strokeDashoffset="308" />
                </svg>
                
                {/* Center Text */}
                <Box sx={{ 
                  position: 'absolute', 
                  top: '50%', 
                  left: '50%', 
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center'
                }}>
                  <Typography variant="h4" fontWeight="bold" color="text.primary">
                    {satisfactionRate}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Satisfied
                  </Typography>
                </Box>
              </Box>
              
              {/* Legend */}
              <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#81c784', mr: 1 }} />
                  <Typography variant="body2">Satisfied</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ffb74d', mr: 1 }} />
                  <Typography variant="body2">Neutral</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#e57373', mr: 1 }} />
                  <Typography variant="body2">Dissatisfied</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Feedback Data Table */}
      <Card sx={{ borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="500" gutterBottom>
            Detailed Feedback Reports
          </Typography>
          
          <TableContainer component={Paper} sx={{ boxShadow: 'none', borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f7fb' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Satisfied %</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Neutral %</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Dissatisfied %</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Total Responses</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {feedbackData.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box 
                          sx={{ 
                            width: `${item.satisfied}%`, 
                            maxWidth: '100px',
                            height: '8px', 
                            bgcolor: '#81c784', 
                            borderRadius: 1,
                            mr: 1 
                          }} 
                        />
                        {item.satisfied}%
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box 
                          sx={{ 
                            width: `${item.neutral}%`, 
                            maxWidth: '100px',
                            height: '8px', 
                            bgcolor: '#ffb74d', 
                            borderRadius: 1,
                            mr: 1 
                          }} 
                        />
                        {item.neutral}%
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box 
                          sx={{ 
                            width: `${item.dissatisfied}%`, 
                            maxWidth: '100px',
                            height: '8px', 
                            bgcolor: '#e57373', 
                            borderRadius: 1,
                            mr: 1 
                          }} 
                        />
                        {item.dissatisfied}%
                      </Box>
                    </TableCell>
                    <TableCell>{item.satisfied + item.neutral + item.dissatisfied}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
      
      {/* Customer Feedback Comments */}
      <Card sx={{ borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ChatIcon sx={{ mr: 1, color: '#6f42c1' }} />
              <Typography variant="h6" fontWeight="500">
                Customer Feedback Comments
              </Typography>
            </Box>
            <FormControl size="small" sx={{ width: 120 }}>
              <Select
                value={commentFilter}
                onChange={handleCommentFilterChange}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="recent">Most Recent</MenuItem>
                <MenuItem value="positive">Positive</MenuItem>
                <MenuItem value="negative">Negative</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          {filteredComments.length > 0 ? (
            filteredComments.map((feedback, index) => (
              <React.Fragment key={feedback.id}>
                <Box sx={{ py: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar 
                        src={feedback.avatar}
                        sx={{ 
                          bgcolor: !feedback.avatar ? `hsl(${feedback.id * 60}, 70%, 65%)` : undefined,
                          width: 40, 
                          height: 40,
                          mr: 1.5
                        }}
                      >
                        {!feedback.avatar && feedback.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="500">
                          {feedback.name}
                          <Chip 
                            label={feedback.queue} 
                            size="small" 
                            sx={{ ml: 1, fontSize: '0.7rem', height: 20 }}
                          />
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {feedback.date}
                        </Typography>
                      </Box>
                    </Box>
                    <Rating value={feedback.rating} readOnly size="small" />
                  </Box>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      ml: 7, 
                      bgcolor: 'background.paper', 
                      p: 1.5, 
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    {feedback.comment}
                  </Typography>
                </Box>
                {index < filteredComments.length - 1 && <Divider />}
              </React.Fragment>
            ))
          ) : (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No feedback comments available for the selected filter.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default AnalyticsPage;