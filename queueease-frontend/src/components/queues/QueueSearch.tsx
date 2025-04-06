import React from 'react';
import { TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { QueueSearchProps } from 'types/queueTypes';

const QueueSearch: React.FC<QueueSearchProps> = ({ searchTerm, setSearchTerm }) => {
  return (
    <TextField
      placeholder="Search queues..."
      variant="outlined"
      fullWidth
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
        ),
        sx: { borderRadius: 2 }
      }}
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      size="small"
    />
  );
};

export default QueueSearch;