import React from 'react';
import { TextField, InputAdornment, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

interface ServiceSearchFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  placeholder?: string;
}

const ServiceSearchField: React.FC<ServiceSearchFieldProps> = ({
  value,
  onChange,
  onClear,
  placeholder = 'Search services...'
}) => {
  return (
    <TextField
      fullWidth
      variant="outlined"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon color="primary" />
          </InputAdornment>
        ),
        endAdornment: value ? (
          <InputAdornment position="end">
            <IconButton size="small" onClick={onClear}>
              <ClearIcon fontSize="small" />
            </IconButton>
          </InputAdornment>
        ) : null,
        sx: {
          borderRadius: 2,
          backgroundColor: 'white',
          '& fieldset': { borderColor: 'rgba(0,0,0,0.1)' }
        }
      }}
      sx={{
        mb: 2
      }}
    />
  );
};

export default ServiceSearchField;