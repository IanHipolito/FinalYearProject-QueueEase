import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { AnalyticsSummaryCardProps } from 'types/analyticsTypes';

const AnalyticsSummaryCard: React.FC<AnalyticsSummaryCardProps> = ({
  title,
  value,
  icon,
  color
}) => {
  return (
    <Card sx={{ 
      borderRadius: 4, 
      background: color,
      color: '#fff',
      height: '100%',
      position: 'relative'
    }}>
      <CardContent sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ 
            bgcolor: 'rgba(255,255,255,0.1)', 
            p: 1, 
            borderRadius: 2, 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {icon}
          </Box>
        </Box>
        <Box sx={{ mt: 2 }}>
          <Typography variant="h3" fontWeight="bold">
            {value}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
            {title}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AnalyticsSummaryCard;