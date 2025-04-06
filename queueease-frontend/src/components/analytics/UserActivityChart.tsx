import React, { useState, useEffect } from 'react';
import { Box, useTheme, Typography, Tooltip, Paper, CircularProgress, alpha } from '@mui/material';
import { UserActivityChartProps } from 'types/queueTypes';

const UserActivityChart: React.FC<UserActivityChartProps> = ({ queueHistory, timeRange }) => {
  const theme = useTheme();
  const [chartData, setChartData] = useState<{ labels: string[]; completedData: number[]; canceledData: number[] }>({ labels: [], completedData: [], canceledData: [] });
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(true);
  
  useEffect(() => {
    // Add a small delay to ensure UI updates
    const timer = setTimeout(() => {
      prepareChartData();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [queueHistory, timeRange]);
  
  const prepareChartData = () => {
    setIsProcessing(true);
    
    // Determine time intervals based on timeRange
    let format: string;
    let intervalCount: number;
    
    switch (timeRange) {
      case 'week':
        format = 'day';
        intervalCount = 7;
        break;
      case 'month':
        format = 'week';
        intervalCount = 4;
        break;
      case 'year':
        format = 'month';
        intervalCount = 12;
        break;
      default:
        format = 'week';
        intervalCount = 4;
    }
    
    // Generate labels and empty data
    const labels: string[] = [];
    const completedData: number[] = Array(intervalCount).fill(0);
    const canceledData: number[] = Array(intervalCount).fill(0);
    
    const now = new Date();
    
    if (format === 'day') {
      // Daily format
      for (let i = intervalCount - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
      }
      
      // Fill in data
      if (queueHistory && queueHistory.length > 0) {
        queueHistory.forEach(entry => {
          if (!entry.date_created) return;
          
          try {
            const entryDate = new Date(entry.date_created);
            const dayDiff = Math.floor((now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
            
            if (dayDiff >= 0 && dayDiff < intervalCount) {
              const index = intervalCount - 1 - dayDiff;
              
              if (entry.status === 'completed') {
                completedData[index]++;
              } else if (entry.status === 'cancelled' || entry.status === 'canceled') {
                canceledData[index]++;
              }
            }
          } catch (err) {
            console.error('Error processing queue entry date:', err);
          }
        });
      }
    } else if (format === 'week') {
      // Weekly format with better labels
      for (let i = intervalCount - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - (i * 7));
        const endDate = new Date(date);
        endDate.setDate(date.getDate() + 6);
        
        labels.push(`Week ${intervalCount - i}`);
      }
      
      // Fill in data
      if (queueHistory && queueHistory.length > 0) {
        queueHistory.forEach(entry => {
          if (!entry.date_created) return;
          
          try {
            const entryDate = new Date(entry.date_created);
            const dayDiff = Math.floor((now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
            
            if (dayDiff >= 0 && dayDiff < intervalCount * 7) {
              const weekIndex = Math.floor(dayDiff / 7);
              const index = intervalCount - 1 - weekIndex;
              
              if (index >= 0 && (entry.status === 'completed')) {
                completedData[index]++;
              } else if (index >= 0 && (entry.status === 'cancelled' || entry.status === 'canceled')) {
                canceledData[index]++;
              }
            }
          } catch (err) {
            console.error('Error processing queue entry date:', err);
          }
        });
      }
    } else {
      // Monthly format
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(now.getMonth() - i);
        labels.push(date.toLocaleDateString('en-US', { month: 'short' }));
      }
      
      // Fill in data
      if (queueHistory && queueHistory.length > 0) {
        queueHistory.forEach(entry => {
          if (!entry.date_created) return;
          
          try {
            const entryDate = new Date(entry.date_created);
            const monthDiff = (now.getFullYear() - entryDate.getFullYear()) * 12 + 
                           now.getMonth() - entryDate.getMonth();
            
            if (monthDiff >= 0 && monthDiff < 12) {
              const index = 11 - monthDiff;
              
              if (entry.status === 'completed') {
                completedData[index]++;
              } else if (entry.status === 'cancelled' || entry.status === 'canceled') {
                canceledData[index]++;
              }
            }
          } catch (err) {
            console.error('Error processing queue entry date:', err);
          }
        });
      }
    }
    
    setChartData({
      labels,
      completedData,
      canceledData
    });
    setIsProcessing(false);
  };
  
  // Check if there's any data to display
  const hasData = chartData.completedData.some(val => val > 0) || chartData.canceledData.some(val => val > 0);
  
  return (
    <Box sx={{ height: 300, mt: 2, position: 'relative' }}>
      {isProcessing ? (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%',
          flexDirection: 'column',
          gap: 2
        }}>
          <CircularProgress size={30} color="primary" />
          <Typography variant="body2" color="text.secondary">
            Processing queue data...
          </Typography>
        </Box>
      ) : chartData.labels?.length > 0 ? (
        <Box sx={{ display: 'flex', height: '100%', position: 'relative' }}>
          {/* Chart bars */}
          {chartData.labels.map((label: string, index: number) => {
            const totalForBar = chartData.completedData[index] + chartData.canceledData[index];
            const isHovered = hoveredBarIndex === index;
            
            return (
              <Box 
                key={index} 
                sx={{ 
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  position: 'relative',
                  zIndex: 1,
                  cursor: 'pointer',
                  transition: 'transform 0.3s ease',
                  transform: isHovered ? 'scale(1.05)' : 'scale(1)'
                }}
                onMouseEnter={() => setHoveredBarIndex(index)}
                onMouseLeave={() => setHoveredBarIndex(null)}
              >
                {/* Completed bar */}
                {chartData.completedData[index] > 0 && (
                  <Box sx={{ 
                    width: '70%', 
                    height: `${Math.min(100, Math.max(10, chartData.completedData[index] * 10))}%`,
                    minHeight: 5,
                    bgcolor: theme.palette.success.main,
                    borderRadius: '4px 4px 0 0',
                    mb: 0.5,
                    transition: 'all 0.3s ease',
                    opacity: isHovered ? 1 : 0.9,
                    boxShadow: isHovered ? '0 5px 15px rgba(0,0,0,0.1)' : 'none',
                    border: `1px solid ${alpha(theme.palette.success.main, 0.6)}`
                  }} />
                )}
                
                {/* Canceled bar */}
                {chartData.canceledData[index] > 0 && (
                  <Box sx={{ 
                    width: '70%', 
                    height: `${Math.min(100, Math.max(10, chartData.canceledData[index] * 10))}%`,
                    minHeight: 5,
                    bgcolor: theme.palette.error.main,
                    borderRadius: '4px 4px 0 0',
                    transition: 'all 0.3s ease',
                    opacity: isHovered ? 1 : 0.9,
                    boxShadow: isHovered ? '0 5px 15px rgba(0,0,0,0.1)' : 'none',
                    border: `1px solid ${alpha(theme.palette.error.main, 0.6)}`
                  }} />
                )}
                
                {/* Tooltip */}
                {isHovered && (
                  <Paper
                    elevation={3}
                    sx={{
                      position: 'absolute',
                      top: -60,
                      p: 1,
                      borderRadius: 1,
                      zIndex: 5,
                      width: 120
                    }}
                  >
                    <Typography variant="caption" fontWeight="bold" display="block">
                      {label}
                    </Typography>
                    <Typography variant="caption" color="success.main" display="block">
                      Completed: {chartData.completedData[index]}
                    </Typography>
                    <Typography variant="caption" color="error.main" display="block">
                      Canceled: {chartData.canceledData[index]}
                    </Typography>
                  </Paper>
                )}
                
                {/* X-axis label */}
                <Typography 
                  variant="caption" 
                  sx={{ 
                    mt: 1,
                    fontSize: '0.7rem',
                    color: theme.palette.text.secondary,
                    transform: 'none',
                    whiteSpace: 'nowrap',
                    width: '100%',
                    textAlign: 'center',
                    position: 'absolute',
                    bottom: -22,
                    fontWeight: isHovered ? 'bold' : 'normal'
                  }}
                >
                  {label}
                </Typography>
              </Box>
            );
          })}
          
          {/* Background grid lines */}
          <Box sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            zIndex: 0,
            display: 'flex',
            flexDirection: 'column-reverse',
            justifyContent: 'space-between'
          }}>
            {[0, 1, 2, 3, 4].map(line => (
              <Box 
                key={line} 
                sx={{ 
                  width: '100%', 
                  height: '1px', 
                  bgcolor: 'rgba(0, 0, 0, 0.05)' 
                }} 
              />
            ))}
          </Box>
        </Box>
      ) : (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%',
          color: 'text.secondary'
        }}>
          Error loading chart data. Please try refreshing.
        </Box>
      )}
      
      {/* "No data" message */}
      {!isProcessing && !hasData && chartData.labels.length > 0 && (
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            zIndex: 2,
            borderRadius: 1,
            flexDirection: 'column'
          }}
        >
          <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
            No activity data available for the selected time period
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try changing the time period or check back later
          </Typography>
        </Box>
      )}
      
      {/* Legend */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 4 }}>
          <Box sx={{ width: 12, height: 12, bgcolor: theme.palette.success.main, mr: 1, borderRadius: 1 }} />
          <Typography variant="caption">Completed</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ width: 12, height: 12, bgcolor: theme.palette.error.main, mr: 1, borderRadius: 1 }} />
          <Typography variant="caption">Canceled</Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default UserActivityChart;