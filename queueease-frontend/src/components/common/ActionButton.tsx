import React, { ReactNode } from 'react';
import { Button, ButtonProps, useTheme } from '@mui/material';

interface ActionButtonProps extends ButtonProps {
  children: ReactNode;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  elevated?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ 
  children, 
  startIcon, 
  endIcon, 
  elevated = true, 
  sx, 
  ...rest 
}) => {
  const theme = useTheme();
  
  return (
    <Button
      variant="contained"
      color="primary"
      startIcon={startIcon}
      endIcon={endIcon}
      sx={{
        borderRadius: 2,
        py: 1.5,
        px: 3,
        bgcolor: theme.palette.primary.main,
        '&:hover': {
          bgcolor: theme.palette.primary.dark,
          ...(elevated && {
            transform: 'translateY(-2px)',
            boxShadow: '0 5px 15px rgba(111, 66, 193, 0.3)'
          })
        },
        transition: 'all 0.2s ease',
        fontWeight: 600,
        ...sx
      }}
      {...rest}
    >
      {children}
    </Button>
  );
};

export default ActionButton;