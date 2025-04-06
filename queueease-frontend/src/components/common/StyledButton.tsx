import React from 'react';
import { Button, ButtonProps, useTheme } from '@mui/material';
import { StyledButtonProps } from 'types/commonTypes';

const StyledButton: React.FC<StyledButtonProps> = ({ 
  children, 
  hoverAnimation = true, 
  sx, 
  variant = 'contained',
  ...rest 
}) => {
  const theme = useTheme();
  
  return (
    <Button
      variant={variant}
      sx={{ 
        py: 1.5,
        borderRadius: 2,
        fontWeight: 600,
        ...(variant === 'contained' && {
          bgcolor: theme.palette.primary.main,
          ...(hoverAnimation && {
            '&:hover': {
              bgcolor: theme.palette.primary.dark,
              transform: 'translateY(-2px)',
              boxShadow: '0 5px 15px rgba(111, 66, 193, 0.3)'
            }
          })
        }),
        ...(variant === 'outlined' && {
          color: theme.palette.primary.main,
          borderColor: theme.palette.primary.main,
          '&:hover': { 
            bgcolor: 'rgba(111, 66, 193, 0.08)',
            borderColor: theme.palette.primary.dark
          }
        }),
        transition: 'all 0.2s ease',
        ...sx
      }}
      {...rest}
    >
      {children}
    </Button>
  );
};

export default StyledButton;