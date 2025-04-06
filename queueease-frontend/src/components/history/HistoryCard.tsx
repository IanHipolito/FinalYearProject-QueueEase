import React from 'react';
import { Card, CardContent, Grid, Box, Typography, Chip, Button, useTheme, useMediaQuery } from '@mui/material';
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

    const handleRefreshStatus = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!entry.order_id) return;

        try {
            const response = await API.appointments.checkStatus(entry.order_id);

            if (response.ok) {
                if (onRefresh) {
                    onRefresh();
                }
            }
        } catch (error) {
            console.error('Error refreshing appointment status:', error);
        }
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
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            flexDirection: isMobile ? 'column' : 'row',
                            justifyContent: isMobile ? 'center' : 'flex-start',
                            width: '100%'
                        }}>
                            <Box sx={{
                                mr: isMobile ? 0 : 2,
                                mb: isMobile ? 2 : 0,
                                bgcolor: entry.service_type === 'immediate' ?
                                    'rgba(111, 66, 193, 0.12)' : 'rgba(13, 110, 253, 0.12)',
                                color: entry.service_type === 'immediate' ?
                                    theme.palette.primary.main : '#0d6efd',
                                borderRadius: '50%',
                                p: 1.5,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: { xs: '40px', sm: 'auto' },
                                alignSelf: isMobile ? 'center' : 'flex-start'
                            }}>
                                {entry.service_type === 'immediate' ?
                                    <QrCodeIcon fontSize="medium" /> :
                                    <CalendarTodayIcon fontSize="medium" />
                                }
                            </Box>

                            <Box sx={{
                                width: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: isMobile ? 'center' : 'flex-start'
                            }}>
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: isMobile ? 'center' : 'flex-start',
                                    mb: 0.5,
                                    flexDirection: isMobile ? 'column' : 'row',
                                    gap: isMobile ? 1 : 0,
                                    textAlign: isMobile ? 'center' : 'left',
                                    width: '100%'
                                }}>
                                    <Typography variant="h6" fontWeight={600} sx={{ mr: isMobile ? 0 : 1, textAlign: isMobile ? 'center' : 'left' }}>
                                        {entry.service_name}
                                    </Typography>
                                    <Box sx={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: 1,
                                        justifyContent: isMobile ? 'center' : 'flex-start'
                                    }}>
                                        <Chip
                                            label={entry.service_type === 'immediate' ? 'Queue' : 'Appointment'}
                                            size="small"
                                            sx={{
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
                                                bgcolor: `${getStatusColor(entry.status)}20`,
                                                color: getStatusColor(entry.status),
                                                fontWeight: 500,
                                            }}
                                        />
                                    </Box>
                                </Box>

                                {/* Show transferred information */}
                                {entry.status === 'transferred' && entry.transferred_to && (
                                    <Box sx={{
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
                                    }}>
                                        <SwapHorizIcon sx={{ fontSize: 16, mr: 0.5, color: theme.palette.info.main, flexShrink: 0 }} />
                                        <Typography variant="body2" color={theme.palette.info.main} sx={{ whiteSpace: 'normal' }}>
                                            Transferred to another location
                                        </Typography>
                                    </Box>
                                )}

                                {/* Show received transfer information */}
                                {entry.transferred_from && (
                                    <Box sx={{
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
                                    }}>
                                        <SwapHorizIcon sx={{ fontSize: 16, mr: 0.5, color: theme.palette.info.main, flexShrink: 0 }} />
                                        <Typography variant="body2" color={theme.palette.info.main} sx={{ whiteSpace: 'normal' }}>
                                            Transferred from another location
                                        </Typography>
                                    </Box>
                                )}

                                {entry.category && (
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        mb: 1,
                                        justifyContent: isMobile ? 'center' : 'flex-start'
                                    }}>
                                        <CategoryIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary', flexShrink: 0 }} />
                                        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'normal' }}>
                                            {entry.category.charAt(0).toUpperCase() + entry.category.slice(1).replace('_', ' ')}
                                        </Typography>
                                    </Box>
                                )}

                                <Grid
                                    container
                                    spacing={1}
                                    sx={{
                                        mt: 1,
                                        textAlign: isMobile ? 'center' : 'left',
                                        justifyContent: isMobile ? 'center' : 'flex-start'
                                    }}
                                >
                                    {entry.service_type === 'immediate' ? (
                                        <>
                                            <Grid item xs={12} sm={4}>
                                                <Box sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: isMobile ? 'center' : 'flex-start'
                                                }}>
                                                    <AccessTimeIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary', flexShrink: 0 }} />
                                                    <Typography variant="body2" color="text.secondary" noWrap={false}>
                                                        Wait time: {(() => {
                                                            if (entry.waiting_time === null || entry.waiting_time === undefined) return '–';

                                                            let waitTime = entry.waiting_time;
                                                            if (waitTime > 300) {
                                                                waitTime = Math.round(waitTime / 60);
                                                            }

                                                            return `${waitTime} min`;
                                                        })()}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        </>
                                    ) : (
                                        <>
                                            <Grid item xs={12} sm={4}>
                                                <Box sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: isMobile ? 'center' : 'flex-start'
                                                }}>
                                                    <EventIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary', flexShrink: 0 }} />
                                                    <Typography variant="body2" color="text.secondary" noWrap={false}>
                                                        Date: {entry.appointment_date ? formatDate(entry.appointment_date) : '–'}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            <Grid item xs={12} sm={4}>
                                                <Box sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: isMobile ? 'center' : 'flex-start'
                                                }}>
                                                    <AccessTimeIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary', flexShrink: 0 }} />
                                                    <Typography variant="body2" color="text.secondary" noWrap={false}>
                                                        Time: {entry.appointment_time ? formatTime(entry.appointment_time) : '–'}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        </>
                                    )}
                                    <Grid item xs={12} sm={4}>
                                        <Box sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: isMobile ? 'center' : 'flex-start'
                                        }}>
                                            <EventIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary', flexShrink: 0 }} />
                                            <Typography variant="body2" color="text.secondary" noWrap={false}>
                                                Created: {new Date(entry.date_created).toLocaleTimeString()}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Box>
                    </Grid>

                    {/* Action buttons - Only Refresh button remains */}
                    {entry.service_type === 'appointment' && entry.status === 'pending' && (
                        <Grid item xs={12} sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mt: 2
                        }}>
                            <Button
                                variant="outlined"
                                startIcon={<RefreshIcon />}
                                onClick={handleRefreshStatus}
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
                                Refresh
                            </Button>
                        </Grid>
                    )}
                </Grid>
            </CardContent>
        </Card>
    );
};

export default HistoryCard;