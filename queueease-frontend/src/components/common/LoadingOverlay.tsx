import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingOverlayProps {
  message?: string;
  transparent?: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = 'Loading...',
  transparent = false
}) => {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: transparent ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.9)',
        zIndex: 9999
      }}
    >
      <CircularProgress size={40} color="primary" />
      {message && (
        <Typography variant="body1" sx={{ mt: 2 }}>
          {message}
        </Typography>
      )}
    </Box>
  );
};

export default LoadingOverlay;