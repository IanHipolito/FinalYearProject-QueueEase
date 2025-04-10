import React from 'react';
import { Backdrop, CircularProgress } from '@mui/material';
import { LoadingIndicatorProps } from 'types/commonTypes';

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ open }) => {
  return (
    <Backdrop
      sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
      open={open}
    >
      <CircularProgress color="inherit" />
    </Backdrop>
  );
};

export default LoadingIndicator;