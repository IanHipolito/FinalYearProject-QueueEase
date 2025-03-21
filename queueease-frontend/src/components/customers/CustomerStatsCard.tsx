import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tooltip,
  IconButton,
  Skeleton
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';

interface CustomerStatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  description: string;
  loading: boolean;
  gradient: string;
  chart?: React.ReactNode;
}

const CustomerStatsCard: React.FC<CustomerStatsCardProps> = ({
  title,
  value,
  icon,
  description,
  loading,
  gradient,
  chart
}) => {
  return (
    <Card sx={{ 
      borderRadius: 4, 
      background: gradient,
      color: '#fff',
      height: '100%',
      position: 'relative',
    }}>
      <CardContent sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ bgcolor: 'rgba(255,255,255,0.1)', p: 1, borderRadius: 2 }}>
            {icon}
          </Box>
          <Tooltip title={description}>
            <IconButton sx={{ color: 'white' }}>
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Box sx={{ mt: 2 }}>
          {loading ? (
            <Skeleton variant="text" width={100} height={60} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
          ) : (
            <Typography variant="h3" fontWeight="bold">
              {value}
            </Typography>
          )}
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

export default CustomerStatsCard;