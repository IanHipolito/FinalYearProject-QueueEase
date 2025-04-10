import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'context/AuthContext';
import { 
  Box, Container, Typography, Paper, IconButton, Tab, Tabs, 
  CircularProgress, Alert, useTheme, Pagination, 
  Stack, FormControl, Select, MenuItem, SelectChangeEvent
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { API } from '../services/api';
import HistoryFilterBar from '../components/history/HistoryFilterBar';
import AdvancedFilters from '../components/history/AdvancedFilters';
import HistoryList from '../components/history/HistoryList';
import { HistoryEntry } from '../types/historyTypes';
import { useAuthGuard } from '../hooks/useAuthGuard';

const QueueHistory: React.FC = () => {
    const { authenticated, loading: authLoading } = useAuthGuard();
    
    const { user } = useAuth();
    const navigate = useNavigate();
    const theme = useTheme();

    // States
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [filteredHistory, setFilteredHistory] = useState<HistoryEntry[]>([]);
    const [displayedHistory, setDisplayedHistory] = useState<HistoryEntry[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [tabValue, setTabValue] = useState<string>('all');

    // Pagination states
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    // Filters
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [serviceTypeFilter, setServiceTypeFilter] = useState<string>('all');
    const [showFilters, setShowFilters] = useState<boolean>(false);
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

    // Categories derived from service data
    const categories = [
        'restaurant', 'fast_food', 'cafe', 'pub', 'post_office',
        'bar', 'bank', 'events_venue', 'veterinary', 'charging_station',
        'healthcare', 'government'
    ];

    // Fetch history data only when authenticated
    useEffect(() => {
        // Only fetch data if user is authenticated and userId exists
        if (!authenticated || !user?.id) return;

        const fetchHistory = async () => {
            setLoading(true);
            setError(null);
            
            try {
                let queueData: any[] = [];
                let appointmentData: any[] = [];
                let queueError = null;
                let appointmentError = null;

                try {
                    await API.appointments.checkAndUpdateAppointments();
                } catch (error) {
                    console.error("Error checking appointments:", error);
                    // Don't set global error here as this is just an update operation
                }

                try {
                    queueData = await API.queues.getUserQueues(user.id);
                    console.error("Successfully fetched queue history:", queueData);
                } catch (error) {
                    queueError = "Error fetching queue history";
                    console.error(queueError, error);
                }

                try {
                    appointmentData = await API.appointments.getAll(user.id);
                    console.error("Successfully fetched appointments:", appointmentData);
                } catch (error) {
                    appointmentError = "Error fetching appointments";
                    console.error(appointmentError, error);
                }

                // Process queue data with defensive coding
                const queueHistory: HistoryEntry[] = Array.isArray(queueData) ? queueData.map((queue: any) => ({
                    id: queue.id || Math.floor(Math.random() * 10000),
                    service_name: queue.service_name || 'Unknown Service',
                    service_type: 'immediate',
                    category: queue.category || 'other',
                    date_created: queue.date_created || new Date().toISOString(),
                    status: queue.status || 'pending',
                    waiting_time: queue.waiting_time || 0,
                    position: queue.position || null,
                    transferred_from: queue.transferred_from || null,
                    transferred_to: queue.transferred_to || null
                })) : [];

                // Process appointment data with defensive coding
                const appointmentHistory: HistoryEntry[] = Array.isArray(appointmentData) ? appointmentData.map((appointment: any) => ({
                    id: parseInt(appointment.order_id?.replace(/\D/g, '')) || Math.floor(Math.random() * 10000),
                    order_id: appointment.order_id || `APT-${Math.floor(Math.random() * 10000)}`,
                    service_name: appointment.service_name || 'Unknown Service',
                    service_type: 'appointment',
                    category: appointment.category || 'other',
                    date_created: new Date(appointment.appointment_date || new Date()).toISOString(),
                    status: appointment.status || 'pending',
                    appointment_date: appointment.appointment_date || new Date().toISOString().split('T')[0],
                    appointment_time: appointment.appointment_time || '12:00'
                })) : [];

                // Combine and sort
                const combinedHistory = [...queueHistory, ...appointmentHistory].sort((a, b) =>
                    new Date(b.date_created).getTime() - new Date(a.date_created).getTime()
                );

                setHistory(combinedHistory);
                setFilteredHistory(combinedHistory);
                // Reset to first page when data changes
                setPage(1);

                // Set error state based on results
                if (combinedHistory.length === 0) {
                    if (queueError && appointmentError) {
                        setError("Could not connect to server. Please try again later.");
                    } else {
                        setError("No history records found. You haven't used any services yet.");
                    }
                } else {
                    setError(null);
                }
            } catch (error) {
                console.error("Error in fetchHistory:", error);
                setError(error instanceof Error ? error.message : "An unexpected error occurred. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [authenticated, user?.id]);

    // Apply filters whenever filter criteria changes
    useEffect(() => {
        if (history.length === 0) return;

        let filtered = [...history];

        // Tab filter (all, immediate, appointment)
        if (tabValue !== 'all') {
            filtered = filtered.filter(entry => entry.service_type === tabValue);
        }

        // Text search
        if (searchQuery.trim() !== '') {
            const searchLower = searchQuery.toLowerCase();
            filtered = filtered.filter(entry =>
                entry.service_name.toLowerCase().includes(searchLower) ||
                (entry.category && entry.category.toLowerCase().includes(searchLower))
            );
        }

        // Date range filter
        if (startDate) {
            const startTimestamp = startDate.setHours(0, 0, 0, 0);
            filtered = filtered.filter(entry => {
                const entryDate = new Date(entry.date_created).getTime();
                return entryDate >= startTimestamp;
            });
        }

        if (endDate) {
            const endTimestamp = endDate.setHours(23, 59, 59, 999);
            filtered = filtered.filter(entry => {
                const entryDate = new Date(entry.date_created).getTime();
                return entryDate <= endTimestamp;
            });
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(entry => entry.status === statusFilter);
        }

        // Category filter
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(entry =>
                entry.category && entry.category.toLowerCase() === categoryFilter.toLowerCase()
            );
        }

        // Service type filter
        if (serviceTypeFilter !== 'all') {
            filtered = filtered.filter(entry => entry.service_type === serviceTypeFilter);
        }

        // Sort by date
        filtered = filtered.sort((a, b) => {
            if (sortOrder === 'newest') {
                return new Date(b.date_created).getTime() - new Date(a.date_created).getTime();
            } else {
                return new Date(a.date_created).getTime() - new Date(b.date_created).getTime();
            }
        });

        setFilteredHistory(filtered);
        // Reset to first page when filters change
        setPage(1);
    }, [
        history,
        searchQuery,
        startDate,
        endDate,
        statusFilter,
        categoryFilter,
        serviceTypeFilter,
        tabValue,
        sortOrder
    ]);

    // Pagination effect - update displayed items based on current page
    useEffect(() => {
        // Calculate total pages
        const calculatedTotalPages = Math.ceil(filteredHistory.length / itemsPerPage);
        setTotalPages(calculatedTotalPages || 1); // Ensure at least 1 page even when empty
        
        // Get current page items
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentPageItems = filteredHistory.slice(startIndex, endIndex);
        
        setDisplayedHistory(currentPageItems);
        
        // Handle case where current page is now out of bounds
        if (page > calculatedTotalPages && calculatedTotalPages > 0) {
            setPage(calculatedTotalPages);
        }
    }, [filteredHistory, page, itemsPerPage]);

    // Event handlers
    const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
        setTabValue(newValue);
    };

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(event.target.value);
    };

    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
        // Scroll to top of history list when page changes
        window.scrollTo({
            top: document.getElementById('history-list-container')?.offsetTop || 0,
            behavior: 'smooth'
        });
    };

    const handleItemsPerPageChange = (event: SelectChangeEvent<number>) => {
        setItemsPerPage(event.target.value as number);
        setPage(1); // Reset to first page when items per page changes
    };

    const handleViewDetails = useCallback((entry: HistoryEntry) => {
        if (entry.service_type === 'immediate') {
            navigate(`/success/${entry.id}`);
        } else if (entry.order_id) {
            navigate(`/appointment/${entry.order_id}`);
        }
    }, [navigate]);

    const clearFilters = () => {
        setSearchQuery('');
        setStartDate(null);
        setEndDate(null);
        setStatusFilter('all');
        setCategoryFilter('all');
        setServiceTypeFilter('all');
        setSortOrder('newest');
    };

    const toggleFilters = () => {
        setShowFilters(!showFilters);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            weekday: 'short',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (timeString?: string) => {
        if (!timeString) return '';

        if (timeString.includes(':')) {
            // Already in HH:MM format
            return timeString;
        }

        // Convert from 24-hour format
        const hours = parseInt(timeString.substring(0, 2));
        const minutes = timeString.substring(2);
        const period = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 || 12;

        return `${formattedHours}:${minutes} ${period}`;
    };

    const refreshData = useCallback(async () => {
        // Only refresh if authenticated and user ID exists
        if (!authenticated || !user?.id) return;
        
        setError(null); // Clear any previous errors
        
        try {
            await API.appointments.checkAndUpdateAppointments();
            
            const appointmentData = await API.appointments.getAll(user.id);
            
            const appointmentHistory: HistoryEntry[] = Array.isArray(appointmentData) ? appointmentData.map((appointment: any) => ({
                id: parseInt(appointment.order_id?.replace(/\D/g, '')) || Math.floor(Math.random() * 10000),
                order_id: appointment.order_id || `APT-${Math.floor(Math.random() * 10000)}`,
                service_name: appointment.service_name || 'Unknown Service',
                service_type: 'appointment',
                category: appointment.category || 'other',
                date_created: new Date(appointment.appointment_date || new Date()).toISOString(),
                status: appointment.status || 'pending',
                appointment_date: appointment.appointment_date || new Date().toISOString().split('T')[0],
                appointment_time: appointment.appointment_time || '12:00'
            })) : [];
            
            const updatedHistory = history.map(entry => {
                if (entry.service_type === 'appointment') {
                    const updatedEntry = appointmentHistory.find(a => a.order_id === entry.order_id);
                    if (updatedEntry) {
                        return { ...entry, status: updatedEntry.status };
                    }
                }
                return entry;
            });
            
            setHistory(updatedHistory);
        } catch (error) {
            console.error("Error refreshing data:", error);
            setError(error instanceof Error ? error.message : "Failed to refresh data. Please try again.");
        }
    }, [authenticated, user?.id, history]);

    // Generate date groups for the displayed history (paginated)
    const dateGroups = React.useMemo(() => {
        if (displayedHistory.length === 0) return {};

        const groups: { [key: string]: HistoryEntry[] } = {};

        displayedHistory.forEach(entry => {
            const date = new Date(entry.date_created).toLocaleDateString();
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(entry);
        });

        return groups;
    }, [displayedHistory]);

    // Show loading indicator during authentication check
    if (authLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <CircularProgress size={40} sx={{ color: theme.palette.primary.main }} />
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fb', py: 4, px: 2 }}>
            <Container maxWidth="lg">
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                    <IconButton
                        onClick={() => navigate('/usermainpage')}
                        sx={{
                            mr: 2,
                            color: theme.palette.primary.main,
                            '&:hover': { bgcolor: 'rgba(111, 66, 193, 0.08)' }
                        }}
                    >
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h4" fontWeight={700} color="text.primary">
                        Queue History
                    </Typography>
                </Box>

                {/* Error message */}
                {error && (
                    <Alert
                        severity="error"
                        sx={{ mb: 3, borderRadius: 2 }}
                        onClose={() => setError(null)}
                    >
                        {error}
                    </Alert>
                )}

                {/* Tabs for quick filtering */}
                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: 3,
                        mb: 3,
                        overflow: 'hidden',
                        border: `1px solid ${theme.palette.divider}`
                    }}
                >
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        variant="fullWidth"
                        textColor="primary"
                        indicatorColor="primary"
                        sx={{
                            bgcolor: 'white',
                            '& .MuiTab-root': {
                                py: 2,
                                fontWeight: 600
                            }
                        }}
                    >
                        <Tab label="All History" value="all" />
                        <Tab label="Queue History" value="immediate" />
                        <Tab label="Appointment History" value="appointment" />
                    </Tabs>
                </Paper>

                {/* Search and filters */}
                <Box sx={{ mb: 3 }}>
                    <HistoryFilterBar
                        searchQuery={searchQuery}
                        handleSearch={handleSearch}
                        showFilters={showFilters}
                        toggleFilters={toggleFilters}
                        sortOrder={sortOrder}
                        setSortOrder={setSortOrder}
                    />
                </Box>

                {/* Advanced filters */}
                {showFilters && (
                    <AdvancedFilters
                        startDate={startDate}
                        setStartDate={setStartDate}
                        endDate={endDate}
                        setEndDate={setEndDate}
                        statusFilter={statusFilter}
                        setStatusFilter={setStatusFilter}
                        categoryFilter={categoryFilter}
                        setCategoryFilter={setCategoryFilter}
                        serviceTypeFilter={serviceTypeFilter}
                        setServiceTypeFilter={setServiceTypeFilter}
                        categories={categories}
                        clearFilters={clearFilters}
                    />
                )}

                {/* History List Container with ID for scroll targeting */}
                <Box id="history-list-container">
                    {/* Loading indicator */}
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                            <CircularProgress sx={{ color: theme.palette.primary.main }} />
                        </Box>
                    ) : filteredHistory.length === 0 ? (
                        <Paper
                            sx={{
                                p: 4,
                                borderRadius: 3,
                                textAlign: 'center',
                                bgcolor: 'white'
                            }}
                        >
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                No history found
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all' || serviceTypeFilter !== 'all' || startDate || endDate ?
                                    'Try adjusting your filters to see more results.' :
                                    'You have not joined any queues or booked any appointments yet.'
                                }
                            </Typography>
                        </Paper>
                    ) : (
                        <>
                            <HistoryList
                                dateGroups={dateGroups}
                                handleViewDetails={handleViewDetails}
                                formatDate={formatDate}
                                formatTime={formatTime}
                                filteredHistory={displayedHistory} // Use paginated history
                                onRefresh={refreshData}
                            />
                            
                            {/* Pagination Controls */}
                            {filteredHistory.length > 0 && (
                                <Paper
                                    sx={{
                                        p: 2,
                                        mt: 3,
                                        borderRadius: 3,
                                        bgcolor: 'white',
                                        display: 'flex',
                                        flexDirection: { xs: 'column', sm: 'row' },
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 2
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Showing {Math.min((page - 1) * itemsPerPage + 1, filteredHistory.length)}-
                                            {Math.min(page * itemsPerPage, filteredHistory.length)} of {filteredHistory.length} items
                                        </Typography>
                                        
                                        <FormControl variant="outlined" size="small" sx={{ minWidth: 80 }}>
                                            <Select
                                                value={itemsPerPage}
                                                onChange={handleItemsPerPageChange}
                                                displayEmpty
                                                sx={{ height: 36 }}
                                            >
                                                <MenuItem value={5}>5</MenuItem>
                                                <MenuItem value={10}>10</MenuItem>
                                                <MenuItem value={25}>25</MenuItem>
                                                <MenuItem value={50}>50</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Box>
                                    
                                    <Pagination 
                                        count={totalPages}
                                        page={page}
                                        onChange={handlePageChange}
                                        color="primary"
                                        size="medium"
                                        showFirstButton
                                        showLastButton
                                        sx={{ 
                                            '& .MuiPaginationItem-root': {
                                                color: theme.palette.text.primary,
                                            },
                                            '& .Mui-selected': {
                                                bgcolor: `${theme.palette.primary.main} !important`,
                                                color: 'white !important'
                                            }
                                        }}
                                    />
                                </Paper>
                            )}
                        </>
                    )}
                </Box>
            </Container>
        </Box>
    );
};

export default QueueHistory;