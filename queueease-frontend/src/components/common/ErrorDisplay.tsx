import React from 'react';
import { Box, Alert, Button } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { ErrorDisplayProps } from 'types/commonTypes';

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onRetry }) => {
  return (
    <Box sx={{ mt: 2, mb: 3 }}>
      <Alert 
        severity="error"
        action={
          onRetry ? (
            <Button 
              color="inherit" 
              size="small"
              startIcon={<RefreshIcon />}
              onClick={onRetry}
            >
              Retry
            </Button>
          ) : undefined
        }
      >
        {error}
      </Alert>
    </Box>
  );
};

export default ErrorDisplay;