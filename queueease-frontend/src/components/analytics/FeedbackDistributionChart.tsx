import React from 'react';
import {
  Box, Card, CardContent, Typography, FormControl,
  Select, MenuItem, Paper, Tooltip, SelectChangeEvent
} from '@mui/material';
import { FeedbackDistributionChartProps } from 'types/analyticsTypes';

const FeedbackDistributionChart: React.FC<FeedbackDistributionChartProps> = ({ 
  data,
  timeRange,
  onTimeRangeChange
}) => {
  // Helper function to capitalise and clean category names
  const formatCategoryName = (category: string) => {
    return category
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Determine bar colors
  const getBarColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'dissatisfied': return '#e57373';
      case 'neutral': return '#ffb74d';
      case 'satisfied': return '#81c784';
      default: return '#90a4ae';
    }
  };

  // Handle time range change
  const handleTimeRangeChange = (event: SelectChangeEvent) => {
    if (onTimeRangeChange) {
      onTimeRangeChange(event);
    }
  };

  // If data is not an array, try to wrap it in an array
  const safeData = Array.isArray(data) ? data : (data && typeof data === 'object' ? [data] : []);

  return (
    <Card sx={{ borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="500">
            Feedback Distribution
          </Typography>
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={timeRange || 'month'}
              onChange={handleTimeRangeChange}
              displayEmpty
              variant="outlined"
              sx={{ 
                fontSize: '0.875rem',
                '& .MuiSelect-select': { py: 0.75 }
              }}
            >
              <MenuItem value="week">Weekly</MenuItem>
              <MenuItem value="month">Monthly</MenuItem>
              <MenuItem value="year">Yearly</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        <Box sx={{ 
          height: 300, 
          mt: 2,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-around'
        }}>
          <Paper 
            elevation={0}
            sx={{ 
              height: '100%', 
              width: '100%',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-around',
              p: 2,
              backgroundColor: '#f5f5f5'
            }}
          >
            {safeData.length > 0 ? (
              safeData.map((item, index) => (
                <Tooltip 
                  key={index} 
                  title={`${formatCategoryName(item.category)}: Dissatisfied: ${item.dissatisfied}%, Neutral: ${item.neutral}%, Satisfied: ${item.satisfied}%`}
                  arrow
                >
                  <Box 
                    sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20%', height: '100%' }}
                  >
                    <Box 
                      sx={{ width: '70%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
                    >
                      {item.dissatisfied > 0 && (
                        <Box 
                          sx={{ 
                            width: '100%', 
                            height: `${item.dissatisfied}%`, 
                            minHeight: 5,
                            bgcolor: getBarColor('dissatisfied'),
                            borderRadius: '4px 4px 0 0',
                            mb: 0.5
                          }} 
                        />
                      )}
                      {item.neutral > 0 && (
                        <Box 
                          sx={{ 
                            width: '100%', 
                            height: `${item.neutral}%`, 
                            minHeight: 5,
                            bgcolor: getBarColor('neutral'),
                            borderRadius: '4px 4px 0 0',
                            mb: 0.5
                          }} 
                        />
                      )}
                      {item.satisfied > 0 && (
                        <Box 
                          sx={{ 
                            width: '100%', 
                            height: `${item.satisfied}%`, 
                            minHeight: 5,
                            bgcolor: getBarColor('satisfied'),
                            borderRadius: '4px 4px 0 0'
                          }} 
                        />
                      )}
                    </Box>
                    <Typography 
                      variant="body2" 
                      sx={{ mt: 2, fontSize: '0.75rem', color: 'text.secondary', textAlign: 'center', width: '120%', wordWrap: 'break-word', lineHeight: 1.2 }}
                    >
                      {formatCategoryName(item.category)}
                    </Typography>
                  </Box>
                </Tooltip>
              ))
            ) : (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                width: '100%', 
                height: '100%'
              }}>
                <Typography variant="body1" color="text.secondary">
                  No feedback data available
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: getBarColor('dissatisfied'), mr: 1 }} />
            <Typography variant="body2">Dissatisfied</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: getBarColor('neutral'), mr: 1 }} />
            <Typography variant="body2">Neutral</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: getBarColor('satisfied'), mr: 1 }} />
            <Typography variant="body2">Satisfied</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default FeedbackDistributionChart;