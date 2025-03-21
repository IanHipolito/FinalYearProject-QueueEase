import React from 'react';
import {
    Grid,
    TextField,
    Button,
    InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';

interface HistoryFilterBarProps {
    searchQuery: string;
    handleSearch: (event: React.ChangeEvent<HTMLInputElement>) => void;
    showFilters: boolean;
    toggleFilters: () => void;
    sortOrder: 'newest' | 'oldest';
    setSortOrder: (order: 'newest' | 'oldest') => void;
}

const HistoryFilterBar: React.FC<HistoryFilterBarProps> = ({
    searchQuery,
    handleSearch,
    showFilters,
    toggleFilters,
    sortOrder,
    setSortOrder
}) => {
    return (
        <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Search by service name..."
                    value={searchQuery}
                    onChange={handleSearch}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" />
                            </InputAdornment>
                        ),
                        sx: {
                            bgcolor: 'white',
                            borderRadius: 2
                        }
                    }}
                />
            </Grid>
            <Grid item xs={6} md={3}>
                <Button
                    fullWidth
                    variant="outlined"
                    color="primary"
                    startIcon={<FilterListIcon />}
                    onClick={toggleFilters}
                    sx={{ borderRadius: 2, height: '100%' }}
                >
                    {showFilters ? 'Hide Filters' : 'Show Filters'}
                </Button>
            </Grid>
            <Grid item xs={6} md={3}>
                <Button
                    fullWidth
                    variant="outlined"
                    color="primary"
                    startIcon={<SortIcon />}
                    onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                    sx={{ borderRadius: 2, height: '100%' }}
                >
                    {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
                </Button>
            </Grid>
        </Grid>
    );
};

export default HistoryFilterBar;