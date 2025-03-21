import React from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
  IconButton,
  Divider
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

interface CustomerTrendsChartProps {
  customerStats: number[];
  timeLabels: string[];
  loading: boolean;
  statsTimeRange: string;
  onTimeRangeChange: (event: SelectChangeEvent) => void;
  onRefresh: () => void;
  isImmediateService: () => boolean;
}

const CustomerTrendsChart: React.FC<CustomerTrendsChartProps> = ({
  customerStats,
  timeLabels,
  loading,
  statsTimeRange,
  onTimeRangeChange,
  onRefresh,
  isImmediateService
}) => {
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight="600" sx={{ color: '#2c3e50' }}>
          Customer Trends
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton 
            size="small" 
            onClick={onRefresh}
            title="Refresh data"
            sx={{ mr: 1 }}
          >
            <RefreshIcon fontSize="small" sx={{ color: '#64748b' }} />
          </IconButton>
          <FormControl size="small" sx={{ width: 120 }}>
            <Select
              value={statsTimeRange}
              onChange={onTimeRangeChange}
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
      
      <Box
        sx={{
          height: 250,
          bgcolor: '#f8fafc',
          borderRadius: 3,
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden'
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
                bottom: `${level}%`,
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
            <CircularProgress size={32} sx={{ color: '#3b82f6' }} />
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
              mb: 2
            }}>
              {customerStats && customerStats.length > 0 ? (
                customerStats.map((value, index) => {
                  // Find max value for scaling
                  const maxValue = Math.max(...customerStats, 1);
                  
                  // Calculate percentage height (normalize values)
                  const percentHeight = Math.round((value / maxValue) * 100);
                  const isMin = value === Math.min(...customerStats.filter(v => v > 0));
                  const isMax = value === Math.max(...customerStats);
                  
                  // If all values are 0, make a minimum height
                  const finalHeight = maxValue === 0 ? 5 : Math.max(percentHeight, 5);
                  
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
                          justifyContent: 'center'
                        }}
                      >
                        <Box
                          className="trend-bar"
                          sx={{
                            position: 'relative',
                            width: '80%',
                            maxWidth: '28px',
                            height: `${finalHeight}%`,
                            minHeight: 4,
                            bgcolor: value === 0 ? '#e0e7ff' : isMax ? '#3b82f6' : isMin ? '#93c5fd' : '#60a5fa',
                            borderRadius: '4px 4px 0 0',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer',
                            '&:hover': {
                              bgcolor: value === 0 ? '#c7d2fe' : '#2563eb',
                              '& + .value-tooltip': {
                                opacity: 1,
                                visibility: 'visible'
                              }
                            }
                          }}
                        />
                        
                        <Box 
                          className="value-tooltip"
                          sx={{
                            position: 'absolute',
                            left: '50%',
                            bottom: `calc(${finalHeight}% + 10px)`,
                            transform: 'translateX(-50%)',
                            bgcolor: '#1e40af',
                            color: 'white',
                            py: 0.5,
                            px: 1.5,
                            borderRadius: 1,
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            opacity: 0,
                            visibility: 'hidden',
                            transition: 'all 0.2s ease',
                            whiteSpace: 'nowrap',
                            zIndex: 10,
                            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                            '&::after': {
                              content: '""',
                              position: 'absolute',
                              top: '100%',
                              left: '50%',
                              marginLeft: '-5px',
                              borderWidth: '5px',
                              borderStyle: 'solid',
                              borderColor: '#1e40af transparent transparent transparent'
                            }
                          }}
                        >
                          {`${timeLabels[index]}: ${value}`}
                        </Box>
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
                    No trend data available
                  </Typography>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={onRefresh}
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
            {customerStats && customerStats.length > 0 && (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-around', 
                borderTop: '1px dashed rgba(0,0,0,0.09)',
                pt: 1.5,
                px: 1,
                height: '24px'
              }}>
                {customerStats.map((_, index) => {
                  const label = timeLabels[index] || '';
                  return (
                    <Typography 
                      key={index} 
                      variant="caption" 
                      sx={{ 
                        width: `${95 / Math.max(customerStats.length, 1)}%`,
                        maxWidth: '50px',
                        textAlign: 'center',
                        fontSize: '0.75rem',
                        color: '#64748b',
                        fontWeight: '500'
                      }}
                    >
                      {label}
                    </Typography>
                  );
                })}
              </Box>
            )}
          </>
        )}
      </Box>
      
      {/* Legend */}
      {customerStats && customerStats.length > 0 && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          alignItems: 'center', 
          mt: 2,
          mr: 1
        }}>
          <Box 
            sx={{ 
              width: 12, 
              height: 12, 
              bgcolor: '#3b82f6', 
              borderRadius: 0.5, 
              mr: 1 
            }} 
          />
          <Typography variant="caption" sx={{ color: '#475569', fontWeight: '500' }}>
            {isImmediateService() ? 'Queue volume' : 'Appointment volume'}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default CustomerTrendsChart;