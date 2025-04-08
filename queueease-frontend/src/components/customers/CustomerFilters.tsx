import React from 'react';
import {
  Box, TextField, FormControl, 
  InputLabel, Select, MenuItem, InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';

interface CustomerFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
}

const CustomerFilters: React.FC<CustomerFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus
}) => {
  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: { xs: 'column', sm: 'row' },
      justifyContent: 'space-between', 
      alignItems: { xs: 'stretch', sm: 'center' }, 
      mb: 3,
      gap: 2
    }}>
      <Box sx={{ 
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: 'flex-start',
        gap: 2,
        flexGrow: 1
      }}>
        <TextField 
          placeholder="Search by name or email"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ 
            width: { xs: '100%', sm: '350px' },
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="status-filter-label">Status</InputLabel>
          <Select
            labelId="status-filter-label"
            id="status-filter"
            value={filterStatus}
            label="Status"
            onChange={(e) => setFilterStatus(e.target.value)}
            startAdornment={
              <InputAdornment position="start">
                <FilterListIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            }
          >
            <MenuItem value="all">All Customers</MenuItem>
            <MenuItem value="active">Active Only</MenuItem>
            <MenuItem value="inactive">Inactive Only</MenuItem>
          </Select>
        </FormControl>
      </Box>
    </Box>
  );
};

export default CustomerFilters;