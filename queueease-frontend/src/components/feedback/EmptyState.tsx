import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import FeedbackIcon from '@mui/icons-material/Feedback';
import { keyframes } from '@emotion/react';

interface EmptyStateProps {
  message: string;
  buttonText?: string;
  buttonAction?: () => void;
}

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
`;

const EmptyState: React.FC<EmptyStateProps> = ({ 
  message, 
  buttonText, 
  buttonAction 
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4,
        py: 8,
        textAlign: 'center',
        borderRadius: 3,
        bgcolor: '#f8f9fc',
        border: '1px dashed',
        borderColor: 'rgba(111, 66, 193, 0.3)',
      }}
    >
      <Box
        sx={{
          p: 2,
          borderRadius: '50%',
          bgcolor: 'rgba(111, 66, 193, 0.1)',
          display: 'inline-flex',
          mb: 3,
          animation: `${pulse} 2s infinite ease-in-out`
        }}
      >
        <FeedbackIcon
          sx={{
            fontSize: 56,
            color: '#6f42c1',
          }}
        />
      </Box>
      
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2, fontWeight: 500 }}>
        {message}
      </Typography>
      
      {buttonText && buttonAction && (
        <Button
          variant="contained"
          color="primary"
          onClick={buttonAction}
          sx={{ 
            borderRadius: 2,
            px: 3,
            py: 1,
            mt: 1,
            bgcolor: '#6f42c1',
            '&:hover': {
              bgcolor: '#8551d9',
              boxShadow: '0 6px 15px rgba(111, 66, 193, 0.3)',
            },
          }}
        >
          {buttonText}
        </Button>
      )}
    </Paper>
  );
};

export default EmptyState;