import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import FeedbackIcon from '@mui/icons-material/Feedback';

interface EmptyStateProps {
  message: string;
  buttonText?: string;
  buttonAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  message, 
  buttonText, 
  buttonAction 
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 10,
        textAlign: 'center'
      }}
    >
      <FeedbackIcon
        sx={{
          fontSize: 72,
          color: '#6f42c1',
          opacity: 0.5,
          mb: 2
        }}
      />
      
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
        {message}
      </Typography>
      
      {buttonText && buttonAction && (
        <Button
          variant="outlined"
          color="primary"
          onClick={buttonAction}
          sx={{ borderRadius: 2 }}
        >
          {buttonText}
        </Button>
      )}
    </Box>
  );
};

export default EmptyState;