import React from 'react';
import { Card, CardContent, Box, Typography } from '@mui/material';

interface QueueStatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  bgColor: string;
  iconColor: string;
}

const QueueStatCard: React.FC<QueueStatCardProps> = ({ 
  title, 
  value, 
  icon, 
  bgColor, 
  iconColor 
}) => {
  return (
    <Card sx={{ borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ 
            bgcolor: bgColor, 
            color: iconColor, 
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
          <Typography variant="h4" fontWeight="bold">
            {value}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
            {title}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default QueueStatCard;