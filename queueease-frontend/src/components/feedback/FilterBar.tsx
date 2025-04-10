import React from 'react';
import {
  Box, TextField, Button, InputAdornment, IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import { FilterBarProps }  from 'types/feedbackTypes'

const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  showDateFilter,
  handleSearchChange,
  toggleDateFilter,
  clearFilters,
  hasActiveFilters
}) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <TextField
          placeholder="Search..."
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={handleSearchChange}
          sx={{
            minWidth: { xs: '100%', sm: '250px' },
            flex: { xs: '1', sm: 'unset' }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => handleSearchChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>)}
                  edge="end"
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            )
          }}
        />

        <Button
          variant={showDateFilter ? "contained" : "outlined"}
          color="primary"
          startIcon={<FilterListIcon />}
          onClick={toggleDateFilter}
          size="small"
          sx={{
            bgcolor: showDateFilter ? '#6f42c1' : 'transparent',
            color: showDateFilter ? 'white' : '#6f42c1',
            borderColor: '#6f42c1',
            '&:hover': {
              bgcolor: showDateFilter ? '#5e35b1' : 'rgba(111, 66, 193, 0.08)'
            }
          }}
        >
          {showDateFilter ? 'Hide Date Filter' : 'Filter by Date'}
        </Button>

        {hasActiveFilters && (
          <Button
            variant="text"
            color="primary"
            onClick={clearFilters}
            size="small"
          >
            Clear All Filters
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default FilterBar;