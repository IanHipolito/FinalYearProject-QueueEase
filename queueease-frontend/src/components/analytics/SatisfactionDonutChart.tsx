import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { SatisfactionDonutChartProps } from 'types/analyticsTypes';

const SatisfactionDonutChart: React.FC<SatisfactionDonutChartProps> = ({ satisfactionRate }) => {
  return (
    <Card sx={{ borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <CardContent>
        <Typography variant="h6" fontWeight="500" gutterBottom>
          Customer Feedback
        </Typography>
        
        <Box sx={{ 
          height: 200, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          position: 'relative',
          mt: 2
        }}>
          <svg width="200" height="200" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="70" fill="none" stroke="#e8f5e9" strokeWidth="30" />
            <circle cx="100" cy="100" r="70" fill="none" stroke="#ffebee" strokeWidth="30" strokeDasharray="440" strokeDashoffset="374" />
            <circle cx="100" cy="100" r="70" fill="none" stroke="#e3f2fd" strokeWidth="30" strokeDasharray="440" strokeDashoffset="308" />
          </svg>
          
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
  );
};

export default SatisfactionDonutChart;