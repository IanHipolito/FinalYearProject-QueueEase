import React from 'react';
import { TextField, InputAdornment } from '@mui/material';
import { FormTextFieldProps } from 'types/commonTypes';

const FormTextField: React.FC<FormTextFieldProps> = ({ 
  startIcon, 
  endIcon, 
  InputProps, 
  sx,
  ...rest 
}) => {
  return (
    <TextField
      variant="outlined"
      fullWidth
      InputProps={{
        ...InputProps,
        sx: { borderRadius: 2, ...(InputProps?.sx || {}) },
        ...(startIcon && { 
          startAdornment: <InputAdornment position="start">{startIcon}</InputAdornment> 
        }),
        ...(endIcon && { 
          endAdornment: <InputAdornment position="end">{endIcon}</InputAdornment> 
        })
      }}
      sx={{ ...sx }}
      {...rest}
    />
  );
};

export default FormTextField;