import React from 'react';
import {
    Card,
    CardContent,
    Grid,
    Box,
    Typography,
    Chip,
    Button,
    useTheme
} from '@mui/material';
import QrCodeIcon from '@mui/icons-material/QrCode';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CategoryIcon from '@mui/icons-material/Category';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventIcon from '@mui/icons-material/Event';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PendingIcon from '@mui/icons-material/Pending';

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

interface HistoryCardProps {
    entry: HistoryEntry;
    onViewDetails: (entry: HistoryEntry) => void;
    formatDate: (dateString: string) => string;
    formatTime: (timeString?: string) => string;
}

const HistoryCard: React.FC<HistoryCardProps> = ({ 
    entry,
    onViewDetails,
    formatDate,
    formatTime 
}) => {
    const theme = useTheme();

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
                            onClick={() => onViewDetails(entry)}
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
    );
};

export default HistoryCard;