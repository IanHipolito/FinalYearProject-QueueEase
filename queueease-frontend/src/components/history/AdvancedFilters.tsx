import React from 'react';
import {
    Paper,
    Typography,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    SelectChangeEvent,
    Button,
    Box,
    useTheme
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface AdvancedFiltersProps {
    startDate: Date | null;
    setStartDate: (date: Date | null) => void;
    endDate: Date | null;
    setEndDate: (date: Date | null) => void;
    statusFilter: string;
    setStatusFilter: (status: string) => void;
    categoryFilter: string;
    setCategoryFilter: (category: string) => void;
    serviceTypeFilter: string;
    setServiceTypeFilter: (type: string) => void;
    categories: string[];
    clearFilters: () => void;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    serviceTypeFilter,
    setServiceTypeFilter,
    categories,
    clearFilters
}) => {
    const theme = useTheme();

    const handleStatusChange = (event: SelectChangeEvent) => {
        setStatusFilter(event.target.value);
    };

    const handleCategoryChange = (event: SelectChangeEvent) => {
        setCategoryFilter(event.target.value);
    };

    const handleTypeChange = (event: SelectChangeEvent) => {
        setServiceTypeFilter(event.target.value);
    };

    return (
        <Paper
            elevation={0}
            sx={{
                borderRadius: 3,
                p: 3,
                mb: 3,
                bgcolor: 'white',
                border: `1px solid ${theme.palette.divider}`
            }}
        >
            <Typography variant="h6" fontWeight={600} gutterBottom>
                Filters
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                            label="From Date"
                            value={startDate}
                            onChange={setStartDate}
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    variant: 'outlined',
                                    sx: {
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2
                                        }
                                    }
                                }
                            }}
                        />
                    </LocalizationProvider>
                </Grid>

                <Grid item xs={12} md={4}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                            label="To Date"
                            value={endDate}
                            onChange={setEndDate}
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    variant: 'outlined',
                                    sx: {
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2
                                        }
                                    }
                                }
                            }}
                        />
                    </LocalizationProvider>
                </Grid>

                <Grid item xs={12} md={4}>
                    <FormControl fullWidth variant="outlined">
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={statusFilter}
                            onChange={handleStatusChange}
                            label="Status"
                            sx={{ borderRadius: 2 }}
                        >
                            <MenuItem value="all">All Statuses</MenuItem>
                            <MenuItem value="completed">Completed</MenuItem>
                            <MenuItem value="pending">Pending</MenuItem>
                            <MenuItem value="cancelled">Cancelled</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                    <FormControl fullWidth variant="outlined">
                        <InputLabel>Category</InputLabel>
                        <Select
                            value={categoryFilter}
                            onChange={handleCategoryChange}
                            label="Category"
                            sx={{ borderRadius: 2 }}
                        >
                            <MenuItem value="all">All Categories</MenuItem>
                            {categories.map(category => (
                                <MenuItem key={category} value={category}>
                                    {category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                    <FormControl fullWidth variant="outlined">
                        <InputLabel>Service Type</InputLabel>
                        <Select
                            value={serviceTypeFilter}
                            onChange={handleTypeChange}
                            label="Service Type"
                            sx={{ borderRadius: 2 }}
                        >
                            <MenuItem value="all">All Types</MenuItem>
                            <MenuItem value="immediate">Queue (Immediate)</MenuItem>
                            <MenuItem value="appointment">Appointment</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <Button
                            variant="outlined"
                            color="primary"
                            onClick={clearFilters}
                            sx={{ borderRadius: 2 }}
                        >
                            Clear Filters
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        </Paper>
    );
};

export default AdvancedFilters;