import React from 'react';
import { Paper } from '@mui/material';
import { StyledCardProps } from 'types/commonTypes';

const StyledCard: React.FC<StyledCardProps> = ({ 
  children, 
  hoverEffect = true, 
  sx, 
  ...rest 
}) => {
  return (
    <Paper
      elevation={2}
      sx={{
        borderRadius: 3,
        p: 4,
        width: '100%',
        transition: 'transform 0.2s, box-shadow 0.2s',
        ...(hoverEffect && {
          '&:hover': {
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)'
          }
        }),
        ...sx
      }}
      {...rest}
    >
      {children}
    </Paper>
  );
};

export default StyledCard;