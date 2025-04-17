import React, { useState } from 'react';
import { Card, CardContent, Grid, Box, Typography, Chip, Button, useTheme, useMediaQuery, Alert } from '@mui/material';
import QrCodeIcon from '@mui/icons-material/QrCode';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CategoryIcon from '@mui/icons-material/Category';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventIcon from '@mui/icons-material/Event';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PendingIcon from '@mui/icons-material/Pending';
import RefreshIcon from '@mui/icons-material/Refresh';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { API } from '../../services/api';
import { HistoryCardProps } from 'types/historyTypes';

const HistoryCard: React.FC<HistoryCardProps> = ({
    entry,
    formatDate,
    formatTime,
    onRefresh
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    // Helper function to get appropriate color for status
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return theme.palette.success.main;
            case 'pending':
                return theme.palette.warning.main;
            case 'cancelled':
                return theme.palette.error.main;
            case 'transferred':
                return theme.palette.info.main;
            default:
                return theme.palette.grey[500];
        }
    };

    // Helper function to get appropriate icon for status
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircleIcon sx={{ fontSize: 16 }} />;
            case 'pending':
                return <PendingIcon sx={{ fontSize: 16 }} />;
            case 'cancelled':
                return <CancelIcon sx={{ fontSize: 16 }} />;
            case 'transferred':
                return <SwapHorizIcon sx={{ fontSize: 16 }} />;
            default:
                return null;
        }
    };

    // Handle status refresh for pending appointments
    const handleRefreshStatus = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!entry.order_id) return;

        setRefreshing(true);
        setError('');

        try {
            await API.appointments.checkStatus(entry.order_id);
            
            if (onRefresh) {
                onRefresh();
            }
        } catch (err) {
            console.error('Error refreshing appointment status:', err);
            setError(err instanceof Error ? err.message : 'Failed to refresh status');
        } finally {
            setRefreshing(false);
        }
    };

    // Reusable style for icon containers
    const iconContainerStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: isMobile ? 'center' : 'flex-start'
    };

    // Reusable style for info text items
    const infoTextStyle = {
        variant: "body2" as const,
        color: "text.secondary",
        noWrap: false,
        sx: { whiteSpace: 'normal' }
    };

    // Reusable style for info icons
    const infoIconStyle = {
        fontSize: 16,
        mr: 0.5,
        color: 'text.secondary',
        flexShrink: 0
    };

    // Reusable style for transfer notification boxes
    const transferBoxStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: isMobile ? 'center' : 'flex-start',
        mb: 1,
        p: 0.75,
        borderRadius: 1,
        bgcolor: 'rgba(25, 118, 210, 0.1)',
        flexWrap: 'wrap',
        width: '100%',
        textAlign: isMobile ? 'center' : 'left'
    };

    // Format the waiting time display
    const formatWaitingTime = () => {
        if (entry.waiting_time === null || entry.waiting_time === undefined) return '–';

        let waitTime = entry.waiting_time;
        // Convert seconds to minutes for larger values
        if (waitTime > 300) {
            waitTime = Math.round(waitTime / 60);
        }

        return `${waitTime} min`;
    };

    // Get service icon based on service type
    const getServiceIcon = () => {
        return entry.service_type === 'immediate' 
            ? <QrCodeIcon fontSize="medium" /> 
            : <CalendarTodayIcon fontSize="medium" />;
    };

    // Get service type color
    const getServiceTypeColor = () => {
        return entry.service_type === 'immediate'
            ? theme.palette.primary.main
            : '#0d6efd';
    };

    // Get service type background color
    const getServiceTypeBgColor = () => {
        return entry.service_type === 'immediate'
            ? 'rgba(111, 66, 193, 0.12)'
            : 'rgba(13, 110, 253, 0.12)';
    };

    // Format a string to title case
    const toTitleCase = (str: string) => {
        return str.charAt(0).toUpperCase() + str.slice(1).replace('_', ' ');
    };

    return (
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
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        {/* Error alert */}
                        {error && (
                            <Alert 
                                severity="error" 
                                sx={{ mb: 2, borderRadius: 2 }}
                                onClose={() => setError('')}
                            >
                                {error}
                            </Alert>
                        )}
                        
                        {/* Main content container */}
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            flexDirection: isMobile ? 'column' : 'row',
                            justifyContent: isMobile ? 'center' : 'flex-start',
                            width: '100%'
                        }}>
                            {/* Service type icon */}
                            <Box sx={{
                                mr: isMobile ? 0 : 2,
                                mb: isMobile ? 2 : 0,
                                bgcolor: getServiceTypeBgColor(),
                                color: getServiceTypeColor(),
                                borderRadius: '50%',
                                p: 1.5,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: { xs: '40px', sm: 'auto' },
                                alignSelf: isMobile ? 'center' : 'flex-start'
                            }}>
                                {getServiceIcon()}
                            </Box>

                            {/* Content details */}
                            <Box sx={{
                                width: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: isMobile ? 'center' : 'flex-start'
                            }}>
                                {/* Service name and status */}
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: isMobile ? 'center' : 'flex-start',
                                    mb: 0.5,
                                    flexDirection: isMobile ? 'column' : 'row',
                                    gap: isMobile ? 1 : 0,
                                    textAlign: isMobile ? 'center' : 'left',
                                    width: '100%'
                                }}>
                                    {/* Service name */}
                                    <Typography variant="h6" fontWeight={600} sx={{ mr: isMobile ? 0 : 1, textAlign: isMobile ? 'center' : 'left' }}>
                                        {entry.service_name}
                                    </Typography>
                                    
                                    {/* Status chips container */}
                                    <Box sx={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: 1,
                                        justifyContent: isMobile ? 'center' : 'flex-start'
                                    }}>
                                        {/* Service type chip */}
                                        <Chip
                                            label={entry.service_type === 'immediate' ? 'Queue' : 'Appointment'}
                                            size="small"
                                            sx={{
                                                bgcolor: getServiceTypeBgColor(),
                                                color: getServiceTypeColor(),
                                                fontWeight: 500,
                                            }}
                                        />
                                        
                                        {/* Status chip */}
                                        <Chip
                                            icon={getStatusIcon(entry.status) || <></>}
                                            label={toTitleCase(entry.status)}
                                            size="small"
                                            sx={{
                                                bgcolor: `${getStatusColor(entry.status)}20`,
                                                color: getStatusColor(entry.status),
                                                fontWeight: 500,
                                            }}
                                        />
                                    </Box>
                                </Box>

                                {/* Transferred to notification */}
                                {entry.status === 'transferred' && entry.transferred_to && (
                                    <Box sx={transferBoxStyle}>
                                        <SwapHorizIcon sx={{ fontSize: 16, mr: 0.5, color: theme.palette.info.main, flexShrink: 0 }} />
                                        <Typography variant="body2" color={theme.palette.info.main} sx={{ whiteSpace: 'normal' }}>
                                            Transferred to another location
                                        </Typography>
                                    </Box>
                                )}

                                {/* Transferred from notification */}
                                {entry.transferred_from && (
                                    <Box sx={transferBoxStyle}>
                                        <SwapHorizIcon sx={{ fontSize: 16, mr: 0.5, color: theme.palette.info.main, flexShrink: 0 }} />
                                        <Typography variant="body2" color={theme.palette.info.main} sx={{ whiteSpace: 'normal' }}>
                                            Transferred from another location
                                        </Typography>
                                    </Box>
                                )}

                                {/* Category info */}
                                {entry.category && (
                                    <Box sx={iconContainerStyle}>
                                        <CategoryIcon sx={infoIconStyle} />
                                        <Typography {...infoTextStyle}>
                                            {toTitleCase(entry.category)}
                                        </Typography>
                                    </Box>
                                )}

                                {/* Time and date information */}
                                <Grid
                                    container
                                    spacing={1}
                                    sx={{
                                        mt: 1,
                                        textAlign: isMobile ? 'center' : 'left',
                                        justifyContent: isMobile ? 'center' : 'flex-start'
                                    }}
                                >
                                    {/* Show different information based on service type */}
                                    {entry.service_type === 'immediate' ? (
                                        <>
                                            {/* Queue wait time */}
                                            <Grid item xs={12} sm={4}>
                                                <Box sx={iconContainerStyle}>
                                                    <AccessTimeIcon sx={infoIconStyle} />
                                                    <Typography {...infoTextStyle}>
                                                        Wait time: {formatWaitingTime()}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        </>
                                    ) : (
                                        <>
                                            {/* Appointment date */}
                                            <Grid item xs={12} sm={4}>
                                                <Box sx={iconContainerStyle}>
                                                    <EventIcon sx={infoIconStyle} />
                                                    <Typography {...infoTextStyle}>
                                                        Date: {entry.appointment_date ? formatDate(entry.appointment_date) : '–'}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            
                                            {/* Appointment time */}
                                            <Grid item xs={12} sm={4}>
                                                <Box sx={iconContainerStyle}>
                                                    <AccessTimeIcon sx={infoIconStyle} />
                                                    <Typography {...infoTextStyle}>
                                                        Time: {entry.appointment_time ? formatTime(entry.appointment_time) : '–'}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        </>
                                    )}
                                    
                                    {/* Created date/time */}
                                    <Grid item xs={12} sm={4}>
                                        <Box sx={iconContainerStyle}>
                                            <EventIcon sx={infoIconStyle} />
                                            <Typography {...infoTextStyle}>
                                                Created: {new Date(entry.date_created).toLocaleTimeString()}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Box>
                    </Grid>

                    {/* Refresh button for pending appointments */}
                    {entry.service_type === 'appointment' && entry.status === 'pending' && (
                        <Grid item xs={12} sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mt: 2
                        }}>
                            <Button
                                variant="outlined"
                                startIcon={refreshing ? null : <RefreshIcon />}
                                onClick={handleRefreshStatus}
                                disabled={refreshing}
                                sx={{
                                    borderRadius: 2,
                                    borderColor: theme.palette.info.main,
                                    color: theme.palette.info.main,
                                    '&:hover': {
                                        bgcolor: 'rgba(13, 110, 253, 0.08)',
                                        borderColor: theme.palette.info.dark
                                    },
                                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                }}
                            >
                                {refreshing ? "Refreshing..." : "Refresh"}
                            </Button>
                        </Grid>
                    )}
                </Grid>
            </CardContent>
        </Card>
    );
};

export default HistoryCard;