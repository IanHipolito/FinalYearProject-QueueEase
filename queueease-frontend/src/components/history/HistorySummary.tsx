import React from 'react';
import { Paper, Typography, Grid, Box, useTheme } from '@mui/material';
import { HistoryEntry, HistorySummaryProps } from '../../types/historyTypes';

const HistorySummary: React.FC<HistorySummaryProps> = ({ filteredHistory }) => {
    const theme = useTheme();

    return (
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
    );
};

export default HistorySummary;