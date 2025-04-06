import React from 'react';
import {
  Box, TextField, Button, FormControl, 
  InputLabel, Select, MenuItem, InputAdornment
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import { CustomerFiltersProps } from 'types/customerTypes';

const CustomerFilters: React.FC<CustomerFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  onCreateCustomer
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
      
      <Button 
        variant="contained" 
        startIcon={<AddIcon />}
        onClick={onCreateCustomer}
        sx={{ 
          borderRadius: 2, 
          bgcolor: '#6f42c1', 
          '&:hover': { bgcolor: '#8551d9' },
          alignSelf: { xs: 'stretch', sm: 'auto' }
        }}
      >
        Add New Customer
      </Button>
    </Box>
  );
};

export default CustomerFilters;