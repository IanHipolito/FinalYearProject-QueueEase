import React from 'react';
import {
  Box,
  Card,
  CardContent,
  IconButton,
  Typography
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { StatisticCardProps } from 'types/analyticsTypes';

const StatisticCard: React.FC<StatisticCardProps> = ({
  title,
  value,
  icon,
  trend,
  bgGradient,
  chart
}) => {
  return (
    <Card sx={{
      borderRadius: 4,
      background: bgGradient,
      color: '#fff',
      height: '100%',
      position: 'relative',
      overflow: 'visible'
    }}>
      <CardContent sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ bgcolor: 'rgba(255,255,255,0.1)', p: 1, borderRadius: 2 }}>
            {icon}
          </Box>
        </Box>
        <Box sx={{ mt: 2 }}>
          <Typography variant="h3" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center' }}>
            {value}
            {trend && (
              <Box component="span" sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                fontSize: '0.5em',
                p: 0.5,
                borderRadius: 1,
                ml: 1
              }}>
                {trend}
              </Box>
            )}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
            {title}
          </Typography>
        </Box>
        {chart && (
          <Box sx={{ mt: 2, height: 40 }}>
            {chart}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default StatisticCard;