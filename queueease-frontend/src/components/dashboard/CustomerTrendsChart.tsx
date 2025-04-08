import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, CircularProgress, FormControl, 
  Select, MenuItem, IconButton, Divider, useTheme, Paper,
  Tooltip, SelectChangeEvent
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { CustomerTrendsChartProps } from 'types/customerTypes';

const CustomerTrendsChart: React.FC<CustomerTrendsChartProps> = ({
  customerStats: initialCustomerStats,
  timeLabels: initialTimeLabels,
  loading: initialLoading,
  statsTimeRange,
  onTimeRangeChange,
  onRefresh,
  latestOrders
}) => {
  const theme = useTheme();
  const [customerStats, setCustomerStats] = useState<number[]>(initialCustomerStats || []);
  const [completedStats, setCompletedStats] = useState<number[]>([]);
  const [transferredStats, setTransferredStats] = useState<number[]>([]);
  const [canceledStats, setCanceledStats] = useState<number[]>([]);
  const [timeLabels, setTimeLabels] = useState<string[]>(initialTimeLabels || []);
  const [loading, setLoading] = useState<boolean>(initialLoading || false);
  const [selectedBarIndex, setSelectedBarIndex] = useState<number | null>(null);
  const [showDetailView, setShowDetailView] = useState<boolean>(false);
  
  const mapDayNameToLabel = (dayName: string): string => {
    // Mapping of possible day name variations to your time label format
    const dayMapping: Record<string, string> = {
      'Mon': 'Mon', 'Monday': 'Mon',
      'Tue': 'Tue', 'Tuesday': 'Tue',
      'Wed': 'Wed', 'Wednesday': 'Wed',
      'Thu': 'Thu', 'Thursday': 'Thu',
      'Fri': 'Fri', 'Friday': 'Fri',
      'Sat': 'Sat', 'Saturday': 'Sat',
      'Sun': 'Sun', 'Sunday': 'Sun'
    };
    
    return dayMapping[dayName] || dayName;
  };

  const normalizeDate = (date: string): string => {
    try {
      const dateObj = new Date(date);
      const currentDate = new Date();
      
      if (timeLabels && timeLabels.length > 0) {
        const sampleLabel = timeLabels[0];
        
        // If labels are day names (Mon, Tue, etc.)
        if (/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/.test(sampleLabel)) {
          const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
          return mapDayNameToLabel(dayName);
        }
        
        // If labels are like "Jan 1", "Feb 2" (month + day)
        if (/^[A-Za-z]{3}\s\d{1,2}$/.test(sampleLabel)) {
          return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
        
        // If labels are month names like "January", "February" or short months like "Jan", "Feb"
        if (/^[A-Za-z]+$/.test(sampleLabel) && sampleLabel.length >= 3) {
          // Get month abbreviation
          const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });
          
          // Check if label is in full month format (e.g., "January")
          if (sampleLabel.length > 3) {
            return dateObj.toLocaleDateString('en-US', { month: 'long' });
          }
          
          return monthName;
        }
        
        // If labels are just numbers
        if (/^\d{1,2}$/.test(sampleLabel)) {
          return String(dateObj.getDate());
        }
        
        // If labels are week numbers
        if (/^Week \d+$/.test(sampleLabel)) {
          // Calculate which week this date falls into
          const now = new Date();
          const startOfYear = new Date(now.getFullYear(), 0, 1);
          const weekNumber = Math.ceil(
            (Math.floor((dateObj.getTime() - startOfYear.getTime()) / 86400000) + 1) / 7
          );
          
          // Get current date to determine which relative week number to use
          const currentWeekNumber = Math.ceil(
            (Math.floor((currentDate.getTime() - startOfYear.getTime()) / 86400000) + 1) / 7
          );
          
          // Calculate difference in weeks
          const weekDiff = currentWeekNumber - weekNumber;
          
          // Map to Week 1, Week 2, etc.
          if (weekDiff >= 0 && weekDiff < timeLabels.length) {
            return timeLabels[timeLabels.length - 1 - weekDiff];
          }
        }
      }
      
      // Default format: return the original date
      return date;
    } catch (e) {
      console.error("Error normalizing date:", e);
      return date;
    }
  };

  // Process data from latestOrders to use in the chart
  useEffect(() => {
    console.log("CustomerTrendsChart - Processing latestOrders:", latestOrders);
    console.log("CustomerTrendsChart - Current timeLabels:", timeLabels);
    console.log("Available time labels:", timeLabels);

    if (latestOrders && latestOrders.length > 0 && timeLabels && timeLabels.length > 0) {
      // Force create data for all time labels with zero values to start
      const ordersByDate = new Map();
      timeLabels.forEach(label => {
        ordersByDate.set(label, {
          completed: 0,
          transferred: 0,
          canceled: 0
        });
      });
      
      let matchCount = 0;
      
      latestOrders.forEach(order => {
        const date = normalizeDate(order.date || 'Unknown');
        console.log(`Processing order with date: ${order.date} → normalized to: ${date}`);
        console.log(`Valid labels to match against:`, timeLabels);
        
        // Check if this date exists in our time labels
        const matchedLabel = timeLabels.find(label => label === date);
        
        if (matchedLabel) {
          matchCount++;
          const stats = ordersByDate.get(matchedLabel);
          
          // Count by status
          const status = order.status?.toLowerCase();
          if (status === 'completed' || status === 'served') {
            stats.completed++;
          } else if (status === 'transferred') {
            stats.transferred++;
          } else if (status === 'cancelled' || status === 'canceled' || status === 'left') {
            stats.canceled++;
          }
        } else {
          console.log(`No matching time label found for date: ${date}. Looking for exact match with:`, timeLabels);
        }
      });
      
      console.log(`Matched ${matchCount} orders to time labels`);
      console.log("CustomerTrendsChart - Orders grouped by date:", Object.fromEntries(ordersByDate));
      
      // Convert to arrays in the order of timeLabels
      const completed: number[] = [];
      const transferred: number[] = [];
      const canceled: number[] = [];
      
      timeLabels.forEach(label => {
        const data = ordersByDate.get(label) || { completed: 0, transferred: 0, canceled: 0 };
        completed.push(data.completed);
        transferred.push(data.transferred);
        canceled.push(data.canceled);
      });
      
      console.log("CustomerTrendsChart - Processed arrays:", {
        timeLabels,
        completed,
        transferred,
        canceled
      });
      
      setCompletedStats(completed);
      setTransferredStats(transferred);
      setCanceledStats(canceled);
      
      // Calculate total orders for each period and update customerStats
      const combinedStats = completed.map((val, idx) => 
        val + (transferred[idx] || 0) + (canceled[idx] || 0)
      );
      setCustomerStats(combinedStats);
    }
  }, [latestOrders, timeLabels, initialCustomerStats]);
  
  // Refresh function that fetches fresh data from API directly
  const handleRefresh = async () => {
    if (!onRefresh) return;
    
    setLoading(true);
    try {
      // Call the parent refresh function to fetch fresh data
      await onRefresh();
      setSelectedBarIndex(null);
      setShowDetailView(false);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Custom time range change handler with direct data fetch
  const handleTimeRangeChange = (event: SelectChangeEvent) => {
    if (onTimeRangeChange) {
      onTimeRangeChange(event);
      setSelectedBarIndex(null);
      setShowDetailView(false);
    }
  };
  
  // Helper function to get dynamic height based on value
  const getBarHeight = (value: number, maxValue: number) => {
    const minHeight = 20;
    const maxHeight = 80;
    
    if (maxValue === 0) return minHeight;
    return Math.max(minHeight, Math.min(maxHeight, (value / maxValue) * 100));
  };
  
  // Find the maximum value in the dataset for consistent scaling
  const maxValue = customerStats && customerStats.length > 0 
    ? Math.max(...customerStats, 1) 
    : 100;
  
  // Format value for display
  const formatValue = (value: number): string => {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  
  // Update local state when props change
  useEffect(() => {
    if (initialCustomerStats) {
      setCustomerStats(initialCustomerStats);
    }
    if (initialTimeLabels) {
      setTimeLabels(initialTimeLabels);
    }
    setLoading(initialLoading);
  }, [initialCustomerStats, initialTimeLabels, initialLoading]);
  
  // Detailed analysis for selected time period
  const getDetailedAnalysis = (index: number) => {
    if (!customerStats || index >= customerStats.length) return null;
    
    const completed = completedStats[index] || 0;
    const transferred = transferredStats[index] || 0;
    const canceled = canceledStats[index] || 0;
    const label = timeLabels[index];
    
    return (
      <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.03)', borderRadius: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Orders for {label}
        </Typography>
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Box>
            <Typography variant="body2" sx={{ color: theme.palette.success.dark }}>Completed</Typography>
            <Typography variant="body1" fontWeight="medium">{formatValue(completed)}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: theme.palette.info.dark }}>Transferred</Typography>
            <Typography variant="body1" fontWeight="medium">{formatValue(transferred)}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: theme.palette.error.dark }}>Canceled</Typography>
            <Typography variant="body1" fontWeight="medium">{formatValue(canceled)}</Typography>
          </Box>
        </Box>
      </Box>
    );
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight="600" sx={{ color: '#2c3e50' }}>
            Order Trends
          </Typography>
          <Tooltip title="Shows the trend of orders over time with status breakdown">
            <IconButton size="small" sx={{ ml: 0.5, color: 'text.secondary' }}>
              <InfoOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton 
            size="small" 
            onClick={handleRefresh}
            title="Refresh data"
            sx={{ mr: 1 }}
          >
            <RefreshIcon fontSize="small" sx={{ color: '#64748b' }} />
          </IconButton>
          <FormControl size="small" sx={{ width: 120 }}>
            <Select
              value={statsTimeRange}
              onChange={handleTimeRangeChange}
              sx={{ 
                borderRadius: 2,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#e2e8f0'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#94a3b8'
                }
              }}
            >
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      <Paper
        elevation={0}
        sx={{
          height: showDetailView ? 300 : 250,
          bgcolor: '#f8fafc',
          borderRadius: 3,
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          transition: 'height 0.3s ease-in-out',
          border: '1px solid',
          borderColor: theme.palette.divider
        }}
      >
        {/* Background grid lines */}
        <Box sx={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 0, pt: 2, pb: 3 }}>
          {[0, 25, 50, 75, 100].map((level, i) => (
            <Box 
              key={i} 
              sx={{ 
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: `${level * 0.8}%`,
                height: '1px',
                bgcolor: level === 0 ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.05)',
                zIndex: 1
              }}
            />
          ))}
        </Box>
        
        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%',
            width: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            bgcolor: 'rgba(255,255,255,0.7)',
            zIndex: 10,
            borderRadius: 3 
          }}>
            <CircularProgress size={32} sx={{ color: theme.palette.primary.main }} />
          </Box>
        ) : (
          <>
            <Box sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-around',
              position: 'relative',
              zIndex: 2,
              mb: 2,
              padding: '0 16px'
            }}>
              {customerStats && customerStats.length > 0 ? (
                customerStats.map((total, index) => {
                  const completed = completedStats[index] || 0;
                  const transferred = transferredStats[index] || 0;
                  const canceled = canceledStats[index] || 0;
                  const maxStatValue = Math.max(...completedStats, ...transferredStats, ...canceledStats, 1);
                  const completedHeight = getBarHeight(completed, maxStatValue);
                  const transferredHeight = getBarHeight(transferred, maxStatValue);
                  const canceledHeight = getBarHeight(canceled, maxStatValue);
                  const isSelected = selectedBarIndex === index;
                  
                  return (
                    <Box 
                      key={index} 
                      sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        position: 'relative',
                        height: '100%',
                        width: `${95 / Math.max(customerStats.length, 1)}%`,
                        maxWidth: '50px'
                      }}
                    >
                      <Box 
                        className="bar-container"
                        sx={{ 
                          position: 'relative', 
                          width: '100%', 
                          height: '100%',
                          display: 'flex',
                          alignItems: 'flex-end',
                          justifyContent: 'center',
                          gap: '2px'
                        }}
                      >
                        {/* Completed bar */}
                        {completed > 0 && (
                          <Box
                            className="completed-bar"
                            sx={{
                              position: 'relative',
                              width: '23%', 
                              height: `${completedHeight}%`,
                              borderRadius: '4px 4px 0 0',
                              transition: 'all 0.3s ease',
                              cursor: 'pointer',
                              bgcolor: theme.palette.success.main,
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                              }
                            }}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedBarIndex(null);
                                setShowDetailView(false);
                              } else {
                                setSelectedBarIndex(index);
                                setShowDetailView(true);
                              }
                            }}
                          />
                        )}
                        
                        {/* Transferred bar */}
                        {transferred > 0 && (
                          <Box
                            className="transferred-bar"
                            sx={{
                              position: 'relative',
                              width: '23%', 
                              height: `${transferredHeight}%`,
                              borderRadius: '4px 4px 0 0',
                              transition: 'all 0.3s ease',
                              cursor: 'pointer',
                              bgcolor: theme.palette.info.main,
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                              }
                            }}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedBarIndex(null);
                                setShowDetailView(false);
                              } else {
                                setSelectedBarIndex(index);
                                setShowDetailView(true);
                              }
                            }}
                          />
                        )}
                        
                        {/* Canceled bar */}
                        {canceled > 0 && (
                          <Box
                            className="canceled-bar"
                            sx={{
                              position: 'relative',
                              width: '23%', 
                              height: `${canceledHeight}%`,
                              borderRadius: '4px 4px 0 0',
                              transition: 'all 0.3s ease',
                              cursor: 'pointer',
                              bgcolor: theme.palette.error.main,
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                              }
                            }}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedBarIndex(null);
                                setShowDetailView(false);
                              } else {
                                setSelectedBarIndex(index);
                                setShowDetailView(true);
                              }
                            }}
                          />
                        )}
                        
                        {/* Value tooltip */}
                        <Tooltip
                          title={
                            <Box sx={{ p: 1 }}>
                              <Typography variant="caption" sx={{ display: 'block' }}>
                                {timeLabels[index]}
                              </Typography>
                              <Typography variant="caption" sx={{ display: 'block', color: theme.palette.success.light }}>
                                Completed: {formatValue(completed)}
                              </Typography>
                              <Typography variant="caption" sx={{ display: 'block', color: theme.palette.info.light }}>
                                Transferred: {formatValue(transferred)}
                              </Typography>
                              <Typography variant="caption" sx={{ display: 'block', color: theme.palette.error.light }}>
                                Canceled: {formatValue(canceled)}
                              </Typography>
                            </Box>
                          }
                          placement="top"
                          arrow
                        >
                          <Box sx={{ 
                            position: 'absolute', 
                            top: 0, 
                            left: 0, 
                            right: 0, 
                            bottom: 0,
                            cursor: 'pointer'
                          }} />
                        </Tooltip>
                      </Box>
                    </Box>
                  );
                })
              ) : (
                <Box sx={{ 
                  width: '100%', 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <Typography variant="body2" color="text.secondary">
                    No order data available
                  </Typography>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={handleRefresh}
                    sx={{ 
                      mt: 1, 
                      borderRadius: 6,
                      textTransform: 'none',
                      px: 3
                    }}
                  >
                    Refresh Data
                  </Button>
                </Box>
              )}
            </Box>
            
            {/* X-axis labels */}
            {customerStats && customerStats.length > 0 && timeLabels && (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-around', 
                borderTop: '1px dashed rgba(0,0,0,0.09)',
                pt: 1.5,
                px: 1,
                height: '24px'
              }}>
                {timeLabels.map((label, index) => (
                  <Typography 
                    key={index} 
                    variant="caption" 
                    sx={{ 
                      width: `${95 / Math.max(customerStats.length, 1)}%`,
                      maxWidth: '50px',
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      color: selectedBarIndex === index ? theme.palette.primary.main : '#64748b',
                      fontWeight: selectedBarIndex === index ? '700' : '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        color: theme.palette.primary.main
                      }
                    }}
                    onClick={() => {
                      if (selectedBarIndex === index) {
                        setSelectedBarIndex(null);
                        setShowDetailView(false);
                      } else {
                        setSelectedBarIndex(index);
                        setShowDetailView(true);
                      }
                    }}
                  >
                    {label || ''}
                  </Typography>
                ))}
              </Box>
            )}
            
            {/* Detail view */}
            {showDetailView && selectedBarIndex !== null && (
              <Box sx={{ 
                mt: 1, 
                height: 70, 
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {getDetailedAnalysis(selectedBarIndex)}
              </Box>
            )}
          </>
        )}
      </Paper>
      
      {/* Legend */}
      {customerStats && customerStats.length > 0 && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          alignItems: 'center', 
          mt: 2,
          gap: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box 
              sx={{ 
                width: 12, 
                height: 12, 
                bgcolor: theme.palette.success.main, 
                borderRadius: 0.5, 
                mr: 1 
              }} 
            />
            <Typography variant="caption" sx={{ color: '#475569', fontWeight: '500' }}>
              Completed
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box 
              sx={{ 
                width: 12, 
                height: 12, 
                bgcolor: theme.palette.info.main, 
                borderRadius: 0.5, 
                mr: 1 
              }} 
            />
            <Typography variant="caption" sx={{ color: '#475569', fontWeight: '500' }}>
              Transferred
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box 
              sx={{ 
                width: 12, 
                height: 12, 
                bgcolor: theme.palette.error.main, 
                borderRadius: 0.5, 
                mr: 1 
              }} 
            />
            <Typography variant="caption" sx={{ color: '#475569', fontWeight: '500' }}>
              Canceled
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default CustomerTrendsChart;