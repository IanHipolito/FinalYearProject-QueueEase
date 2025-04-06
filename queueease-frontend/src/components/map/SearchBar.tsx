import React, { useCallback } from 'react';
import { 
  Box, TextField, InputAdornment, IconButton, Paper, 
  Divider, Badge, Collapse
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { SearchBarProps } from 'types/mapTypes';

const SearchBar: React.FC<SearchBarProps> = ({
  filterText,
  onFilterTextChange,
  showFilters,
  toggleFilters,
  hasActiveFilters,
  children
}) => {
  const navigate = useNavigate();

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterTextChange(e.target.value);
  }, [onFilterTextChange]);

  const handleClearSearch = useCallback(() => {
    onFilterTextChange("");
  }, [onFilterTextChange]);

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 10,
        left: 10,
        right: 10,
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 1
      }}
    >
      <Paper
        elevation={2}
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <IconButton
          sx={{ mx: 0.5 }}
          onClick={() => navigate('/usermainpage')}
          size="small"
        >
          <ArrowBackIcon fontSize="small" />
        </IconButton>

        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search services..."
          value={filterText}
          onChange={handleSearchChange}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="primary" fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: filterText ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={handleClearSearch}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
            sx: {
              py: 0.25,
              '& fieldset': { border: 'none' }
            }
          }}
        />

        <Divider orientation="vertical" flexItem />

        <Badge
          color="primary"
          variant="dot"
          invisible={!hasActiveFilters}
        >
          <IconButton
            color={hasActiveFilters ? "primary" : "default"}
            sx={{ mx: 0.5 }}
            onClick={toggleFilters}
            size="small"
          >
            <FilterAltIcon fontSize="small" />
          </IconButton>
        </Badge>
      </Paper>

      {/* Collapsible filter section */}
      <Collapse in={showFilters}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {children}
        </Box>
      </Collapse>
    </Box>
  );
};

export default SearchBar;