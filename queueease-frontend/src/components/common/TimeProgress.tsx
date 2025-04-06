import React from 'react';
import { Box, LinearProgress, Typography } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { TimeProgressProps } from 'types/commonTypes';

const TimeProgress: React.FC<TimeProgressProps> = ({ remainingTime, progressPercentage }) => {
  return (
    <Box>
      <Typography 
        variant="h6" 
        fontWeight={600} 
        sx={{ mb: 2 }}
      >
        Time Remaining
      </Typography>

      <LinearProgress 
        variant="determinate" 
        value={progressPercentage} 
        sx={{ 
          height: 12, 
          borderRadius: 6,
          mb: 2,
          backgroundColor: 'rgba(111, 66, 193, 0.1)',
          '& .MuiLinearProgress-bar': {
            backgroundColor: 'primary.main',
            borderRadius: 6
          }
        }}
      />

      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          mt: 2
        }}
      >
        <AccessTimeIcon 
          sx={{ 
            mr: 1, 
            color: 'primary.main' 
          }} 
        />
        <Typography 
          variant="h6" 
          color="primary.main"
          fontWeight={600}
        >
          {typeof remainingTime === 'string' ? remainingTime : `${Math.floor(remainingTime / 60)}m ${remainingTime % 60}s remaining`}
        </Typography>
      </Box>
    </Box>
  );
};

export default TimeProgress;