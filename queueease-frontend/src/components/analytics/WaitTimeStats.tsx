import React from 'react';
import { Box, Typography, useTheme, Tooltip, alpha } from '@mui/material';
import { DayStats, HourStats, WaitTimeStatsProps } from 'types/userAnalyticsTypes';

const WaitTimeStats: React.FC<WaitTimeStatsProps> = ({ data, type }) => {
    const theme = useTheme();

    // Sort and format data based on type
    let formattedData = [...data];

    if (type === 'day') {
        // Days of week in order
        const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        formattedData = formattedData
            .filter(item => 'day' in item)
            .sort((a, b) => dayOrder.indexOf((a as DayStats).day) - dayOrder.indexOf((b as DayStats).day));
    } else {
        // Hours in ascending order
        formattedData = formattedData
            .filter(item => 'hour' in item)
            .sort((a, b) => (a as HourStats).hour - (b as HourStats).hour);
    }

    // Find max wait time for scaling
    const maxWait = formattedData.length > 0
        ? Math.max(...formattedData.map(item => item.avgWait))
        : 0;

    const getHourLabel = (hour: number) => {
        return `${hour % 12 || 12}${hour >= 12 ? 'PM' : 'AM'}`;
    };

    // Check if we have any actual data to display
    const hasData = formattedData.length > 0 && formattedData.some(item => item.avgWait > 0 && item.count > 0);

    return (
        <Box sx={{ height: 300, mt: 2 }}>
            {hasData ? (
                <Box sx={{ display: 'flex', height: '100%', alignItems: 'flex-end' }}>
                    {formattedData.map((item, index) => {
                        const actualHeight = item.avgWait > 0 ? Math.max(20, (item.avgWait / (maxWait || 1)) * 70) : 0;
                        
                        return (
                            <Box
                                key={index}
                                sx={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    height: '100%',
                                    justifyContent: 'flex-end'
                                }}
                            >
                                {/* The bar */}
                                <Tooltip
                                    title={`Average wait: ${item.avgWait} min, ${item.count} visits`}
                                    arrow
                                    placement="top"
                                >
                                    <Box
                                        sx={{
                                            width: '70%',
                                            height: `${actualHeight}%`,
                                            minHeight: item.avgWait > 0 ? 20 : 0,
                                            bgcolor: theme.palette.primary.main,
                                            borderRadius: '4px 4px 0 0',
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            justifyContent: 'center',
                                            position: 'relative',
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                opacity: 0.8,
                                                transform: 'translateY(-5px)',
                                                boxShadow: '0 10px 15px rgba(0,0,0,0.1)'
                                            },
                                            cursor: 'pointer',
                                            border: item.avgWait > 0 ? `1px solid ${alpha(theme.palette.primary.main, 0.6)}` : 'none',
                                            boxShadow: item.avgWait > 0 ? '0 4px 10px rgba(0,0,0,0.1)' : 'none'
                                        }}
                                    >
                                        {item.avgWait > 0 && (
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: '#fff',
                                                    position: 'absolute',
                                                    top: -20,
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                {item.avgWait}m
                                            </Typography>
                                        )}
                                    </Box>
                                </Tooltip>

                                {/* Label */}
                                <Typography
                                    variant="caption"
                                    sx={{
                                        mt: 1,
                                        fontSize: '0.75rem',
                                        color: theme.palette.text.secondary,
                                        textAlign: 'center',
                                        fontWeight: item.count > 0 ? 600 : 400
                                    }}
                                >
                                    {type === 'day'
                                        ? (item as DayStats).day.substring(0, 3)
                                        : getHourLabel((item as HourStats).hour)
                                    }
                                </Typography>
                            </Box>
                        );
                    })}
                </Box>
            ) : (
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: 'text.secondary',
                    flexDirection: 'column'
                }}>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                        No wait time data available
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Try changing the time period or check back later
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default WaitTimeStats;