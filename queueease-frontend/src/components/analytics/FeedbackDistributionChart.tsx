import React from 'react';
import {
  Box, Card, CardContent, FormControl, Paper,
  Select, MenuItem, Typography
} from '@mui/material';
import { FeedbackDistributionChartProps } from 'types/analyticsTypes';

const FeedbackDistributionChart: React.FC<FeedbackDistributionChartProps> = ({ 
  data, 
  timeRange, 
  onTimeRangeChange 
}) => {
  return (
    <Card sx={{ borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="500">
            Feedback Distribution
          </Typography>
          <FormControl size="small" sx={{ width: 120 }}>
            <Select
              value={timeRange}
              onChange={onTimeRangeChange}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        <Box sx={{ height: 300, mt: 2 }}>
          <Paper sx={{ 
            height: '100%', 
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-around',
            p: 2
          }}>
            {data.map((item, index) => (
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
  );
};

export default FeedbackDistributionChart;