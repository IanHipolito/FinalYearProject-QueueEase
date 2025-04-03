import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Box, Container, Typography, Paper, IconButton, Tab, Tabs, CircularProgress, Alert, useTheme } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { API } from '../services/api';
import HistoryFilterBar from '../components/history/HistoryFilterBar';
import AdvancedFilters from '../components/history/AdvancedFilters';
import HistoryList from '../components/history/HistoryList';
import { HistoryEntry } from '../types/historyTypes';

const QueueHistory: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const theme = useTheme();

    // States
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [filteredHistory, setFilteredHistory] = useState<HistoryEntry[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [tabValue, setTabValue] = useState<string>('all');

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

    // Fetch history data
    useEffect(() => {
        if (!user?.id) return;

        const fetchHistory = async () => {
            setLoading(true);
            try {
                let queueData: any[] = [];
                let appointmentData: any[] = [];
                let queueError = null;
                let appointmentError = null;

                // Try to fetch queue history with fallback to alternative endpoint
                try {
                    // First try the standard endpoint
                    const queueResponse = await API.queues.getHistory(user.id);
                    if (queueResponse.ok) {
                        queueData = await queueResponse.json();
                        console.log("Successfully fetched queue history:", queueData);
                    } else {
                        // If that fails, try the alternative endpoint
                        console.warn(`Queue history API returned ${queueResponse.status}, trying user-queues endpoint`);
                        const fallbackResponse = await API.queues.getUserQueues(user.id);
                        if (fallbackResponse.ok) {
                            queueData = await fallbackResponse.json();
                            console.log("Successfully fetched queue history from fallback:", queueData);
                        } else {
                            queueError = `Both queue history endpoints failed: ${queueResponse.status}/${fallbackResponse.status}`;
                            console.warn(queueError);
                        }
                    }
                } catch (error) {
                    queueError = "Error connecting to queue history API";
                    console.error(queueError, error);
                }

                // Try to fetch appointments
                try {
                    const appointmentResponse = await API.appointments.getAll(user.id);
                    if (appointmentResponse.ok) {
                        appointmentData = await appointmentResponse.json();
                        console.log("Successfully fetched appointments:", appointmentData);
                    } else {
                        appointmentError = `Appointments API returned ${appointmentResponse.status}`;
                        console.warn(appointmentError);
                    }
                } catch (error) {
                    appointmentError = "Error connecting to appointments API";
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
                    position: queue.position || null
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
                setError("An unexpected error occurred. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [user?.id]);

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

    // Event handlers
    const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
        setTabValue(newValue);
    };

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(event.target.value);
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

    // Generate date groups for the filtered history
    const dateGroups = React.useMemo(() => {
        if (filteredHistory.length === 0) return {};

        const groups: { [key: string]: HistoryEntry[] } = {};

        filteredHistory.forEach(entry => {
            const date = new Date(entry.date_created).toLocaleDateString();
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(entry);
        });

        return groups;
    }, [filteredHistory]);

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
                    <HistoryList
                        dateGroups={dateGroups}
                        handleViewDetails={handleViewDetails}
                        formatDate={formatDate}
                        formatTime={formatTime}
                        filteredHistory={filteredHistory}
                    />
                )}
            </Container>
        </Box>
    );
};

export default QueueHistory;
