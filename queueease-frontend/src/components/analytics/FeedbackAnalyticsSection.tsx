import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Paper, Card, CardContent, useTheme, 
  alpha, Divider, Chip, Rating, Tabs, Tab, CircularProgress
} from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import SentimentNeutralIcon from '@mui/icons-material/SentimentNeutral';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import { API } from '../../services/api';
import EmptyState from '../feedback/EmptyState';
import { UserFeedback, FeedbackAnalyticsSectionProps } from 'types/feedbackTypes';

const FeedbackAnalyticsSection: React.FC<FeedbackAnalyticsSectionProps> = ({ 
  userFeedback: initialFeedback,
  averageRating: initialRating,
  userId
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [userFeedback, setUserFeedback] = useState<UserFeedback[]>(initialFeedback || []);
  const [averageRating, setAverageRating] = useState(initialRating || 0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Reusable styled component for card styling
  const cardStyle = { 
    borderRadius: 3, 
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    height: '100%',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 8px 30px rgba(0,0,0,0.1)'
    }
  };

  // Fetch feedback data when component mounts or userId changes
  useEffect(() => {
    const fetchFeedbackData = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        setError('');
        
        const data = await API.feedback.getUserFeedbackHistory(userId);
        
        setUserFeedback(data);
        
        // Calculate average rating from all feedback
        if (Array.isArray(data) && data.length > 0) {
          const totalRating = data.reduce((sum, item) => sum + item.rating, 0);
          const avgRating = Math.round((totalRating / data.length) * 10) / 10;
          setAverageRating(avgRating);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while loading feedback data');
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbackData();
  }, [userId]);

  // Calculate feedback sentiment statistics
  const calculateSentimentStats = () => {
    // Count feedback by sentiment type
    const positiveFeedback = userFeedback.filter(f => f.sentiment === 'positive').length;
    const neutralFeedback = userFeedback.filter(f => f.sentiment === 'neutral').length;
    const negativeFeedback = userFeedback.filter(f => f.sentiment === 'negative').length;
    
    // Calculate percentages for visualisation
    const totalFeedback = userFeedback.length;
    const positivePercentage = totalFeedback > 0 ? Math.round((positiveFeedback / totalFeedback) * 100) : 0;
    const neutralPercentage = totalFeedback > 0 ? Math.round((neutralFeedback / totalFeedback) * 100) : 0;
    const negativePercentage = totalFeedback > 0 ? Math.round((negativeFeedback / totalFeedback) * 100) : 0;

    return {
      positiveFeedback,
      neutralFeedback,
      negativeFeedback,
      totalFeedback,
      positivePercentage,
      neutralPercentage,
      negativePercentage
    };
  };

  // Analyze categories mentioned in feedback
  const analyzeFeedbackCategories = () => {
    // Extract all categories for analysis
    const allCategories = userFeedback.flatMap(f => f.categories);
    const categoryCount: {[key: string]: {total: number, positive: number, negative: number}} = {};
    
    // Count initial occurrences of each category
    allCategories.forEach(category => {
      if (!categoryCount[category]) {
        categoryCount[category] = {total: 0, positive: 0, negative: 0};
      }
      categoryCount[category].total += 1;
    });
    
    // Add sentiment data to categories
    userFeedback.forEach(feedback => {
      feedback.categories.forEach(category => {
        if (feedback.sentiment === 'positive') {
          categoryCount[category].positive += 1;
        } else if (feedback.sentiment === 'negative') {
          categoryCount[category].negative += 1;
        }
      });
    });
    
    // Sort categories by frequency and return top 5
    return Object.entries(categoryCount)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 5);
  };

  // Filter feedback based on active tab selection
  const getFilteredFeedback = () => {
    if (activeTab === 0) return userFeedback;
    if (activeTab === 1) return userFeedback.filter(f => 
      f.sentiment === 'positive' || (!f.sentiment && f.rating >= 4)
    );
    if (activeTab === 2) return userFeedback.filter(f => 
      f.sentiment === 'negative' || (!f.sentiment && f.rating <= 2)
    );
    return userFeedback;
  };

  // Reusable progress bar component for sentiment visualisation
  const SentimentProgressBar = ({ 
    label, 
    icon, 
    color, 
    value, 
    count, 
    percentage 
  }: { 
    label: string; 
    icon: React.ReactElement; 
    color: string; 
    value: number;
    count: number; 
    percentage: number 
  }) => (
    <Box sx={{ mb: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
          {React.cloneElement(icon, { fontSize: "small", sx: { mr: 0.5, color } })}
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={600}>
          {count} ({percentage}%)
        </Typography>
      </Box>
      <Box sx={{ 
        width: '100%', 
        height: 8, 
        bgcolor: alpha(color, 0.2),
        borderRadius: 5,
        overflow: 'hidden'
      }}>
        <Box sx={{ 
          width: `${percentage}%`, 
          height: '100%', 
          bgcolor: color,
          borderRadius: 5
        }} />
      </Box>
    </Box>
  );

  // Calculate all statistics
  const stats = calculateSentimentStats();
  const sortedCategories = analyzeFeedbackCategories();

  // Show loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <EmptyState 
        message={`${error}. Please try again later.`}
      />
    );
  }

  // Show empty state when no feedback
  if (stats.totalFeedback === 0) {
    return (
      <EmptyState 
        message="You haven't submitted any feedback yet."
        buttonText="Give Feedback"
        buttonAction={() => window.location.href = '/feedback'}
      />
    );
  }

  return (
    <Grid container spacing={3}>
      {/* Feedback Summary Card */}
      <Grid item xs={12} md={4}>
        <Card sx={cardStyle}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Your Feedback Summary
            </Typography>
            
            {/* Average Rating Display */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', my: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Rating 
                  value={averageRating} 
                  precision={0.5} 
                  readOnly 
                  size="large"
                  sx={{ mb: 1 }}
                />
                <Typography variant="h4" fontWeight={700} color="primary">
                  {averageRating.toFixed(1)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average Rating
                </Typography>
              </Box>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            {/* Sentiment Distribution */}
            <SentimentProgressBar
              label="Positive"
              icon={<ThumbUpIcon />}
              color={theme.palette.success.main}
              value={stats.positiveFeedback}
              count={stats.positiveFeedback}
              percentage={stats.positivePercentage}
            />
            
            <SentimentProgressBar
              label="Neutral"
              icon={<SentimentNeutralIcon />}
              color={theme.palette.warning.main}
              value={stats.neutralFeedback}
              count={stats.neutralFeedback}
              percentage={stats.neutralPercentage}
            />
            
            <SentimentProgressBar
              label="Negative"
              icon={<ThumbDownIcon />}
              color={theme.palette.error.main}
              value={stats.negativeFeedback}
              count={stats.negativeFeedback}
              percentage={stats.negativePercentage}
            />
            
            <Divider sx={{ my: 2 }} />
            
            {/* Total Feedback Count */}
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Total Feedback Submitted
            </Typography>
            <Typography variant="h5" fontWeight={700} color="primary">
              {stats.totalFeedback}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      {/* Categories Analysis Card */}
      <Grid item xs={12} md={8}>
        <Card sx={cardStyle}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Feedback by Category
            </Typography>
            
            {sortedCategories.length > 0 ? (
              <Box sx={{ mt: 2 }}>
                {/* Map through top categories */}
                {sortedCategories.map(([category, stats], index) => {
                  // Calculate sentiment percentages for this category
                  const positivePercent = stats.total > 0 ? (stats.positive / stats.total) * 100 : 0;
                  const negativePercent = stats.total > 0 ? (stats.negative / stats.total) * 100 : 0;
                  const neutralPercent = 100 - positivePercent - negativePercent;
                  
                  return (
                    <Box key={index} sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {stats.total} mentions
                        </Typography>
                      </Box>
                      
                      {/* Stacked bar chart for sentiment distribution */}
                      <Box sx={{ 
                        display: 'flex', 
                        width: '100%', 
                        height: 12, 
                        borderRadius: 6,
                        overflow: 'hidden'
                      }}>
                        {positivePercent > 0 && (
                          <Box sx={{ 
                            width: `${positivePercent}%`, 
                            bgcolor: theme.palette.success.main,
                            height: '100%'
                          }} />
                        )}
                        {neutralPercent > 0 && (
                          <Box sx={{ 
                            width: `${neutralPercent}%`, 
                            bgcolor: theme.palette.warning.main,
                            height: '100%'
                          }} />
                        )}
                        {negativePercent > 0 && (
                          <Box sx={{ 
                            width: `${negativePercent}%`, 
                            bgcolor: theme.palette.error.main,
                            height: '100%'
                          }} />
                        )}
                      </Box>
                      
                      {/* Legend for the chart */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="caption" sx={{ color: theme.palette.success.main }}>
                          {Math.round(positivePercent)}% Positive
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.error.main }}>
                          {Math.round(negativePercent)}% Negative
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6 }}>
                <Typography variant="body1" color="text.secondary">
                  No category data available
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
      
      {/* Feedback History Card */}
      <Grid item xs={12}>
        <Card sx={cardStyle}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Your Feedback History
            </Typography>
            
            {/* Tabs for filtering feedback */}
            <Tabs 
              value={activeTab} 
              onChange={(e, val) => setActiveTab(val)}
              sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="All" />
              <Tab label="Positive" />
              <Tab label="Negative" />
            </Tabs>
            
            {/* Display filtered feedback items */}
            {getFilteredFeedback().length > 0 ? (
              <Grid container spacing={2}>
                {getFilteredFeedback().map((feedback) => (
                  <Grid item xs={12} md={6} key={feedback.id}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
                          borderColor: alpha(theme.palette.primary.main, 0.3)
                        }
                      }}
                    >
                      {/* Feedback header with service name and date */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {feedback.service_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(feedback.date).toLocaleDateString()}
                        </Typography>
                      </Box>
                      
                      {/* Rating and sentiment indicator */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Rating value={feedback.rating} readOnly size="small" />
                        <Box sx={{ ml: 'auto' }}>
                          {/* Sentiment chip - positive case */}
                          {(feedback.sentiment === 'positive' || (!feedback.sentiment && feedback.rating >= 4)) && (
                            <Chip 
                              icon={<SentimentSatisfiedAltIcon />} 
                              label="Positive" 
                              size="small" 
                              sx={{ 
                                backgroundColor: alpha(theme.palette.success.main, 0.1),
                                color: theme.palette.success.main,
                                fontWeight: 500
                              }}
                            />
                          )}
                          {/* Sentiment chip - neutral case */}
                          {(feedback.sentiment === 'neutral' || (!feedback.sentiment && feedback.rating === 3)) && (
                            <Chip 
                              icon={<SentimentNeutralIcon />} 
                              label="Neutral" 
                              size="small" 
                              sx={{ 
                                backgroundColor: alpha(theme.palette.warning.main, 0.1),
                                color: theme.palette.warning.main,
                                fontWeight: 500
                              }}
                            />
                          )}
                          {/* Sentiment chip - negative case */}
                          {(feedback.sentiment === 'negative' || (!feedback.sentiment && feedback.rating <= 2)) && (
                            <Chip 
                              icon={<SentimentVeryDissatisfiedIcon />} 
                              label="Negative" 
                              size="small" 
                              sx={{ 
                                backgroundColor: alpha(theme.palette.error.main, 0.1),
                                color: theme.palette.error.main,
                                fontWeight: 500
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                      
                      {/* Feedback comment */}
                      {feedback.comment && (
                        <Typography variant="body2" color="text.secondary" sx={{ 
                          mb: 1,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          "{feedback.comment}"
                        </Typography>
                      )}
                      
                      {/* Category tags */}
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                        {feedback.categories.map((category, idx) => (
                          <Chip 
                            key={idx} 
                            label={category} 
                            size="small" 
                            sx={{ 
                              backgroundColor: alpha(theme.palette.primary.main, 0.1),
                              color: theme.palette.primary.main
                            }}
                          />
                        ))}
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6 }}>
                <Typography variant="body1" color="text.secondary">
                  {stats.totalFeedback === 0 ? 'No feedback submitted yet' : 'No feedback matching selected filter'}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default FeedbackAnalyticsSection;