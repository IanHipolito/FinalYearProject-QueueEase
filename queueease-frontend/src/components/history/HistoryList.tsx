import React from 'react';
import { Box, Typography, Grid, useTheme } from '@mui/material';
import HistoryCard from './HistoryCard';
import HistorySummary from './HistorySummary';

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

interface HistoryListProps {
    dateGroups: { [key: string]: HistoryEntry[] };
    handleViewDetails: (entry: HistoryEntry) => void;
    formatDate: (dateString: string) => string;
    formatTime: (timeString?: string) => string;
    filteredHistory: HistoryEntry[];
}

const HistoryList: React.FC<HistoryListProps> = ({
    dateGroups,
    handleViewDetails,
    formatDate,
    formatTime,
    filteredHistory
}) => {
    const theme = useTheme();

    return (
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
                                <HistoryCard
                                    entry={entry}
                                    onViewDetails={handleViewDetails}
                                    formatDate={formatDate}
                                    formatTime={formatTime}
                                />
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            ))}

            <HistorySummary filteredHistory={filteredHistory} />
        </Box>
    );
};

export default HistoryList;