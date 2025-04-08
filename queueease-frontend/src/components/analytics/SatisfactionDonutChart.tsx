import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, useTheme, Tooltip, CircularProgress } from '@mui/material';
import { SatisfactionDonutChartProps, FeedbackCategory } from 'types/analyticsTypes';
import { API } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const SatisfactionDonutChart: React.FC<SatisfactionDonutChartProps> = ({ 
  satisfactionRate: propSatisfactionRate = null, 
  neutralRate: propNeutralRate = null, 
  dissatisfiedRate: propDissatisfiedRate = null 
}) => {
  const theme = useTheme();
  const { currentService } = useAuth();
  const [animation, setAnimation] = useState(false);
  const [loading, setLoading] = useState(propSatisfactionRate === null);
  
  // State for rates
  const [satisfactionRate, setSatisfactionRate] = useState(propSatisfactionRate || 0);
  const [neutralRate, setNeutralRate] = useState(propNeutralRate || 0);
  const [dissatisfiedRate, setDissatisfiedRate] = useState(propDissatisfiedRate || 0);
  
  // Fetch satisfaction data if not provided as props
  useEffect(() => {
    const fetchSatisfactionData = async () => {
      if (propSatisfactionRate !== null) return;
      
      try {
        setLoading(true);
        
        // Use existing analytics endpoint if the current service is available
        if (currentService?.id) {
          const response = await API.admin.getAnalytics(currentService.id);
          
          if (response.ok) {
            const data = await response.json();
            
            // Extract satisfaction data from the response
            if (data && typeof data.satisfaction_rate === 'number') {
              // Use "let" so we can adjust the values
              let satisfied = Math.min(data.satisfaction_rate, 100);
              
              // Extract neutral and dissatisfied based on the ratings distribution
              let neutral = 0;
              let dissatisfied = 0;
              
              if (Array.isArray(data.feedback_distribution)) {
                const neutralCount = data.feedback_distribution.reduce(
                  (sum: number, item: FeedbackCategory) => sum + (item.neutral || 0), 0);
                  
                const dissatisfiedCount = data.feedback_distribution.reduce(
                  (sum: number, item: FeedbackCategory) => sum + (item.dissatisfied || 0), 0);
                  
                const totalCount = data.feedback_distribution.reduce(
                  (sum: number, item: FeedbackCategory) =>
                    sum + (item.satisfied || 0) + (item.neutral || 0) + (item.dissatisfied || 0), 0);
                
                if (totalCount > 0) {
                  neutral = Math.round((neutralCount / totalCount) * 100);
                  dissatisfied = Math.round((dissatisfiedCount / totalCount) * 100);
                  
                  const total = satisfied + neutral + dissatisfied;
                  if (total !== 100) {
                    const diff = 100 - total;
                    if (satisfied >= neutral && satisfied >= dissatisfied) {
                      satisfied += diff;
                    } else if (neutral >= satisfied && neutral >= dissatisfied) {
                      neutral += diff;
                    } else {
                      dissatisfied += diff;
                    }
                  }
                } else {
                  // Fallback if no distribution data
                  neutral = 25;
                  dissatisfied = Math.max(0, 100 - satisfied - neutral);
                }
              } else {
                // Fallback if no distribution data provided
                neutral = 25;
                dissatisfied = Math.max(0, 100 - satisfied - neutral);
              }
              
              setSatisfactionRate(satisfied);
              setNeutralRate(neutral);
              setDissatisfiedRate(dissatisfied);
            }
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching satisfaction data:', error);
        setLoading(false);
      }
    };
    
    fetchSatisfactionData();
  }, [currentService, propSatisfactionRate]);
  
  // Calculate the stroke dashoffset based on a circle of radius 70
  const circumference = 2 * Math.PI * 70;
  
  // Ensure all segments together make 100%
  const adjustedSatisfactionRate = Math.min(satisfactionRate || 0, 100);
  const adjustedNeutralRate = Math.min(neutralRate || 0, 100 - adjustedSatisfactionRate);
  const adjustedDissatisfiedRate = Math.max(0, 100 - adjustedSatisfactionRate - adjustedNeutralRate);

  // Overall satisfaction percentage for display at the center of the donut
  const overallSatisfaction = Math.round(adjustedSatisfactionRate);

  // For triggering the animation when loading is done
  useEffect(() => {
    if (!loading) {
      setAnimation(true);
    }
  }, [loading]);

  return (
    <Card sx={{ 
      borderRadius: 4, 
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      height: '100%',
      '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
      }
    }}>
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" fontWeight="500" gutterBottom>
          Overall Customer Satisfaction
        </Typography>
        
        <Box sx={{ 
          flex: 1,
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          position: 'relative',
          my: 2
        }}>
          {loading ? (
            <CircularProgress size={60} />
          ) : (
            <>
              <svg width="200" height="200" viewBox="0 0 200 200">
                {/* Background circle */}
                <circle 
                  cx="100" 
                  cy="100" 
                  r="70" 
                  fill="none" 
                  stroke={theme.palette.grey[200]} 
                  strokeWidth="30"
                />
                
                {/* Dissatisfied segment */}
                <Tooltip title={`Dissatisfied: ${adjustedDissatisfiedRate}%`}>
                  <circle 
                    cx="100" 
                    cy="100" 
                    r="70" 
                    fill="none" 
                    stroke={theme.palette.error.light} 
                    strokeWidth="30" 
                    strokeDasharray={circumference} 
                    strokeDashoffset={animation ? circumference - (circumference * adjustedDissatisfiedRate / 100) : circumference}
                    transform="rotate(-90 100 100)"
                    style={{ 
                      transition: 'stroke-dashoffset 1s ease-in-out',
                      cursor: 'pointer'
                    }}
                  />
                </Tooltip>
                
                {/* Neutral segment */}
                <Tooltip title={`Neutral: ${adjustedNeutralRate}%`}>
                  <circle 
                    cx="100" 
                    cy="100" 
                    r="70" 
                    fill="none" 
                    stroke={theme.palette.warning.light} 
                    strokeWidth="30" 
                    strokeDasharray={circumference} 
                    strokeDashoffset={animation ? circumference - (circumference * (adjustedNeutralRate + adjustedDissatisfiedRate) / 100) : circumference}
                    transform="rotate(-90 100 100)"
                    style={{ 
                      transition: 'stroke-dashoffset 1.3s ease-in-out',
                      cursor: 'pointer'
                    }}
                  />
                </Tooltip>
                
                {/* Satisfied segment */}
                <Tooltip title={`Satisfied: ${adjustedSatisfactionRate}%`}>
                  <circle 
                    cx="100" 
                    cy="100" 
                    r="70" 
                    fill="none" 
                    stroke={theme.palette.success.light} 
                    strokeWidth="30" 
                    strokeDasharray={circumference} 
                    strokeDashoffset={
                      animation 
                        ? circumference - (circumference * (adjustedSatisfactionRate + adjustedNeutralRate + adjustedDissatisfiedRate) / 100)
                        : circumference - (circumference * (adjustedSatisfactionRate + adjustedNeutralRate + adjustedDissatisfiedRate) / 100)
                    }
                    transform="rotate(-90 100 100)"
                    style={{ 
                      transition: 'stroke-dashoffset 1.6s ease-in-out',
                      cursor: 'pointer'
                    }}
                  />
                </Tooltip>
              </svg>
              
              <Box sx={{ 
                position: 'absolute', 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(4px)',
                borderRadius: '50%',
                width: '110px',
                height: '110px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                boxShadow: '0 0 15px rgba(0,0,0,0.08)'
              }}>
                <Typography variant="h4" fontWeight="bold" color="text.primary">
                  {overallSatisfaction}%
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: -0.5 }}>
                  All Time
                </Typography>
              </Box>
            </>
          )}
        </Box>
        
        {!loading && (
          <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 'auto', mb: 1 }}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                '&:hover': { bgcolor: 'rgba(129, 199, 132, 0.1)' },
                cursor: 'pointer'
              }}
            >
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: theme.palette.success.main, mr: 1 }} />
              <Typography variant="body2">
                <strong>{adjustedSatisfactionRate}%</strong> Satisfied
              </Typography>
            </Box>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                '&:hover': { bgcolor: 'rgba(255, 183, 77, 0.1)' },
                cursor: 'pointer'
              }}
            >
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: theme.palette.warning.main, mr: 1 }} />
              <Typography variant="body2">
                <strong>{adjustedNeutralRate}%</strong> Neutral
              </Typography>
            </Box>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                '&:hover': { bgcolor: 'rgba(229, 115, 115, 0.1)' },
                cursor: 'pointer'
              }}
            >
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: theme.palette.error.main, mr: 1 }} />
              <Typography variant="body2">
                <strong>{adjustedDissatisfiedRate}%</strong> Dissatisfied
              </Typography>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default SatisfactionDonutChart;