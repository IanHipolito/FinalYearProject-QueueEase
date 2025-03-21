import React from 'react';
import { Box, LinearProgress, Typography, useTheme } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

interface TimeProgressProps {
  remainingTime: number;
  progressPercentage: number;
}

const TimeProgress: React.FC<TimeProgressProps> = ({ remainingTime, progressPercentage }) => {
  const theme = useTheme();

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h6" gutterBottom fontWeight={600}>
        Time Remaining
      </Typography>
      <Box sx={{ position: 'relative', mt: 1 }}>
        <LinearProgress
          variant="determinate"
          value={100 - progressPercentage}
          sx={{
            height: 10,
            borderRadius: 5,
            bgcolor: 'rgba(0, 0, 0, 0.08)',
            '& .MuiLinearProgress-bar': {
              bgcolor: theme.palette.primary.main,
            }
          }}
        />
      </Box>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        mt: 2
      }}>
        <AccessTimeIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
        <Typography variant="h6" fontWeight={600} color={theme.palette.primary.main}>
          {formatTime(remainingTime)} remaining
        </Typography>
      </Box>
    </Box>
  );
};

export default TimeProgress;