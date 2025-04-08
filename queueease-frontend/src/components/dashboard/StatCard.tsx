import React from 'react';
import { Card, CardContent, Box, Typography } from '@mui/material';
import { StatCardProps } from 'types/dashboardTypes';

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  color, 
  children 
}) => {
  return (
    <Card sx={{
      borderRadius: 4,
      background: color,
      color: '#fff',
      height: '100%',
      position: 'relative',
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
        {children}
      </CardContent>
    </Card>
  );
};

export default StatCard;