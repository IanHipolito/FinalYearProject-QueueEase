import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import {
    Box,
    Container,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    Divider,
    Chip,
    IconButton,
    TextField,
    InputAdornment,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Tab,
    Tabs,
    CircularProgress,
    Alert,
    Button,
    useTheme
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import dayjs from 'dayjs';

// Icons
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventIcon from '@mui/icons-material/Event';
import StorefrontIcon from '@mui/icons-material/Storefront';
import CategoryIcon from '@mui/icons-material/Category';
import FilterListIcon from '@mui/icons-material/FilterList';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PendingIcon from '@mui/icons-material/Pending';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SortIcon from '@mui/icons-material/Sort';
import QrCodeIcon from '@mui/icons-material/QrCode';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

interface HistoryEntry {
    id: number;
    service_name: string;
    service_type: 'immediate' | 'appointment';
    category?: string;
    date_created: string;
    status: 'completed' | 'pending' | 'cancelled';
    waiting_time?: number;
    position?: number;
    order_id?: string;
    appointment_date?: string;
    appointment_time?: string;
}

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

    // Categories derived from your service data
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
                    const queueResponse = await fetch(`http://127.0.0.1:8000/api/queue-history/${user.id}/`);
                    if (queueResponse.ok) {
                        queueData = await queueResponse.json();
                        console.log("Successfully fetched queue history:", queueData);
                    } else {
                        // If that fails, try the alternative endpoint
                        console.warn(`Queue history API returned ${queueResponse.status}, trying user-queues endpoint`);
                        const fallbackResponse = await fetch(`http://127.0.0.1:8000/api/user-queues/${user.id}/`);
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
                    const appointmentResponse = await fetch(`http://127.0.0.1:8000/api/appointments/${user.id}/`);
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return theme.palette.success.main;
            case 'pending':
                return theme.palette.warning.main;
            case 'cancelled':
                return theme.palette.error.main;
            default:
                return theme.palette.grey[500];
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircleIcon sx={{ fontSize: 16 }} />;
            case 'pending':
                return <PendingIcon sx={{ fontSize: 16 }} />;
            case 'cancelled':
                return <CancelIcon sx={{ fontSize: 16 }} />;
            default:
                return null;
        }
    };

    const getCategoryIcon = (category?: string) => {
        switch (category?.toLowerCase()) {
            case 'restaurant':
            case 'fast_food':
            case 'cafe':
                return <StorefrontIcon fontSize="small" />;
            default:
                return <CategoryIcon fontSize="small" />;
        }
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
                </Box>

                {/* Advanced filters */}
                {showFilters && (
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
                                        onChange={(e) => setStatusFilter(e.target.value)}
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
                                        onChange={(e) => setCategoryFilter(e.target.value)}
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
                                        onChange={(e) => setServiceTypeFilter(e.target.value)}
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
                    /* History entries organized by date */
                    <Box>
                        {Object.entries(dateGroups).map(([date, entries]) => (
                            <Box key={date} sx={{ mb: 4 }}>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        mb: 2,
                                        color: theme.palette.text.secondary,
                                        fontWeight: 600
                                    }}
                                >
                                    {new Date(date).toLocaleDateString(undefined, {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </Typography>

                                <Grid container spacing={2}>
                                    {entries.map(entry => (
                                        <Grid item xs={12} key={`${entry.service_type}-${entry.id}`}>
                                            <Card
                                                sx={{
                                                    borderRadius: 3,
                                                    boxShadow: 'none',
                                                    border: '1px solid',
                                                    borderColor: theme.palette.divider,
                                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                                    '&:hover': {
                                                        transform: 'translateY(-2px)',
                                                        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
                                                    }
                                                }}
                                            >
                                                <CardContent sx={{ p: 3 }}>
                                                    <Grid container spacing={2}>
                                                        <Grid item xs={12} sm={8}>
                                                            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                                                <Box
                                                                    sx={{
                                                                        mr: 2,
                                                                        bgcolor: entry.service_type === 'immediate' ?
                                                                            'rgba(111, 66, 193, 0.12)' : 'rgba(13, 110, 253, 0.12)',
                                                                        color: entry.service_type === 'immediate' ?
                                                                            theme.palette.primary.main : '#0d6efd',
                                                                        borderRadius: '50%',
                                                                        p: 1.5,
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center'
                                                                    }}
                                                                >
                                                                    {entry.service_type === 'immediate' ?
                                                                        <QrCodeIcon fontSize="medium" /> :
                                                                        <CalendarTodayIcon fontSize="medium" />
                                                                    }
                                                                </Box>

                                                                <Box>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                                        <Typography variant="h6" fontWeight={600}>
                                                                            {entry.service_name}
                                                                        </Typography>
                                                                        <Chip
                                                                            label={entry.service_type === 'immediate' ? 'Queue' : 'Appointment'}
                                                                            size="small"
                                                                            sx={{
                                                                                ml: 2,
                                                                                bgcolor: entry.service_type === 'immediate' ?
                                                                                    'rgba(111, 66, 193, 0.12)' : 'rgba(13, 110, 253, 0.12)',
                                                                                color: entry.service_type === 'immediate' ?
                                                                                    theme.palette.primary.main : '#0d6efd',
                                                                                fontWeight: 500,
                                                                            }}
                                                                        />
                                                                        <Chip
                                                                            icon={getStatusIcon(entry.status) || <></>}
                                                                            label={entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                                                                            size="small"
                                                                            sx={{
                                                                                ml: 1,
                                                                                bgcolor: `${getStatusColor(entry.status)}20`,
                                                                                color: getStatusColor(entry.status),
                                                                                fontWeight: 500,
                                                                            }}
                                                                        />
                                                                    </Box>

                                                                    {entry.category && (
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                                            <CategoryIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                                                                            <Typography variant="body2" color="text.secondary">
                                                                                {entry.category.charAt(0).toUpperCase() + entry.category.slice(1).replace('_', ' ')}
                                                                            </Typography>
                                                                        </Box>
                                                                    )}

                                                                    <Grid container spacing={2} sx={{ mt: 1 }}>
                                                                        {entry.service_type === 'immediate' ? (
                                                                            <>
                                                                                <Grid item xs={6} sm={4}>
                                                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                                        <AccessTimeIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                                                                                        <Typography variant="body2" color="text.secondary">
                                                                                            Wait time: {entry.waiting_time || '–'} min
                                                                                        </Typography>
                                                                                    </Box>
                                                                                </Grid>
                                                                                <Grid item xs={6} sm={4}>
                                                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                                        <PersonIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                                                                                        <Typography variant="body2" color="text.secondary">
                                                                                            Position: {entry.position || '–'}
                                                                                        </Typography>
                                                                                    </Box>
                                                                                </Grid>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <Grid item xs={6} sm={4}>
                                                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                                        <EventIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                                                                                        <Typography variant="body2" color="text.secondary">
                                                                                            Date: {entry.appointment_date ? formatDate(entry.appointment_date) : '–'}
                                                                                        </Typography>
                                                                                    </Box>
                                                                                </Grid>
                                                                                <Grid item xs={6} sm={4}>
                                                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                                        <AccessTimeIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                                                                                        <Typography variant="body2" color="text.secondary">
                                                                                            Time: {entry.appointment_time ? formatTime(entry.appointment_time) : '–'}
                                                                                        </Typography>
                                                                                    </Box>
                                                                                </Grid>
                                                                            </>
                                                                        )}
                                                                        <Grid item xs={12} sm={4}>
                                                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                                <EventIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                                                                                <Typography variant="body2" color="text.secondary">
                                                                                    Created: {new Date(entry.date_created).toLocaleTimeString()}
                                                                                </Typography>
                                                                            </Box>
                                                                        </Grid>
                                                                    </Grid>
                                                                </Box>
                                                            </Box>
                                                        </Grid>

                                                        {/* Action buttons */}
                                                        <Grid item xs={12} sm={4} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                                            <Button
                                                                variant="outlined"
                                                                startIcon={<VisibilityIcon />}
                                                                onClick={() => handleViewDetails(entry)}
                                                                sx={{
                                                                    borderRadius: 2,
                                                                    borderColor: theme.palette.primary.main,
                                                                    color: theme.palette.primary.main,
                                                                    '&:hover': {
                                                                        bgcolor: 'rgba(111, 66, 193, 0.08)',
                                                                        borderColor: theme.palette.primary.dark
                                                                    },
                                                                }}
                                                            >
                                                                View Details
                                                            </Button>
                                                        </Grid>
                                                    </Grid>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        ))}

                        {/* Summary stats */}
                        <Paper
                            elevation={0}
                            sx={{
                                mt: 4,
                                p: 3,
                                borderRadius: 3,
                                bgcolor: 'white',
                                border: `1px solid ${theme.palette.divider}`
                            }}
                        >
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                Summary
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={6} md={3}>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Total Entries
                                        </Typography>
                                        <Typography variant="h5" fontWeight={700}>
                                            {filteredHistory.length}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Queue Entries
                                        </Typography>
                                        <Typography variant="h5" fontWeight={700}>
                                            {filteredHistory.filter(entry => entry.service_type === 'immediate').length}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Appointments
                                        </Typography>
                                        <Typography variant="h5" fontWeight={700}>
                                            {filteredHistory.filter(entry => entry.service_type === 'appointment').length}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Completed
                                        </Typography>
                                        <Typography variant="h5" fontWeight={700}>
                                            {filteredHistory.filter(entry => entry.status === 'completed').length}
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Box>
                )}
            </Container>
        </Box>
    );
}

export default QueueHistory;
