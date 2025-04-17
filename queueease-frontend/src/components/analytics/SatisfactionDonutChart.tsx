import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, useTheme, Tooltip, CircularProgress } from '@mui/material';
import { API } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { SatisfactionDonutChartProps } from 'types/analyticsTypes';

const SatisfactionDonutChart: React.FC<SatisfactionDonutChartProps> = ({
  satisfactionRate: propSatisfactionRate = null,
  neutralRate: propNeutralRate = null,
  dissatisfiedRate: propDissatisfiedRate = null
}) => {
  const theme = useTheme();
  const { currentService } = useAuth();

  // State declarations
  const [loading, setLoading] = useState(
    propSatisfactionRate === null || propNeutralRate === null || propDissatisfiedRate === null
  );
  const [hoveredArc, setHoveredArc] = useState<'satisfied' | 'neutral' | 'dissatisfied' | null>(null);
  const [animation, setAnimation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [satisfied, setSatisfied] = useState(propSatisfactionRate ?? 0);
  const [neutral, setNeutral] = useState(propNeutralRate ?? 0);
  const [dissatisfied, setDissatisfied] = useState(propDissatisfiedRate ?? 0);

  // Fetch analytics data if props were not provided
  useEffect(() => {
    const fetchData = async () => {
      // Skip fetching if we have prop values
      if (propSatisfactionRate !== null && propNeutralRate !== null && propDissatisfiedRate !== null) {
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        if (currentService?.id) {
          const data = await API.admin.getAnalytics(currentService.id);
          
          if (data) {
            // Extract satisfaction percentages
            let s = data.satisfied_pct ?? 0;
            let n = data.neutral_pct ?? 0;
            let d = data.dissatisfied_pct ?? 0;

            // Ensure total is 100%
            const total = s + n + d;
            if (total !== 100) {
              // Adjust the largest value to make total = 100
              const diff = 100 - total;
              if (s >= n && s >= d) s += diff;
              else if (n >= s && n >= d) n += diff;
              else d += diff;
            }

            setSatisfied(s);
            setNeutral(n);
            setDissatisfied(d);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load satisfaction data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentService, propSatisfactionRate, propNeutralRate, propDissatisfiedRate]);

  // Start animation after data is loaded
  useEffect(() => {
    if (!loading) {
      setAnimation(true);
    }
  }, [loading]);

  // Calculate SVG circle properties
  const radius = 70;
  const circumference = 2 * Math.PI * radius;

  // Convert percentages to arc lengths for SVG
  const satisfiedArc = (Math.max(0, Math.min(satisfied, 100)) / 100) * circumference;
  const neutralArc = (Math.max(0, Math.min(neutral, 100)) / 100) * circumference;
  const dissatisfiedArc = (Math.max(0, Math.min(dissatisfied, 100)) / 100) * circumference;
  
  // Calculate offset positions for each arc
  const offsetArc1 = 0; // Satisfied starts at the top
  const offsetArc2 = circumference - satisfiedArc; // Neutral starts where satisfied ends
  const offsetArc3 = offsetArc2 - neutralArc; // Dissatisfied starts where neutral ends

  // Rounded value for center display
  const overallSatisfaction = Math.round(satisfied);

  // Common styles for reuse
  const cardStyle = {
    borderRadius: 4,
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    height: '100%',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
    }
  };

  // Style for each legend item
  const getLegendItemStyle = (arcType: 'satisfied' | 'neutral' | 'dissatisfied') => {
    // Map arc types to theme colors
    const colorMap = {
      satisfied: theme.palette.success.main,
      neutral: theme.palette.warning.main,
      dissatisfied: theme.palette.error.main
    };
    
    // Map arc types to hover background colors
    const hoverBgMap = {
      satisfied: 'rgba(129, 199, 132, 0.1)',
      neutral: 'rgba(255, 183, 77, 0.1)',
      dissatisfied: 'rgba(229, 115, 115, 0.1)'
    };
    
    return {
      display: 'flex',
      alignItems: 'center',
      px: 1,
      py: 0.5,
      borderRadius: 1,
      '&:hover': { bgcolor: hoverBgMap[arcType] },
      cursor: 'pointer'
    };
  };

  // Arc component to reduce duplication
  const DonutArc = ({ 
    type, 
    color, 
    dashArray, 
    dashOffset, 
    animationDelay 
  }: { 
    type: 'satisfied' | 'neutral' | 'dissatisfied', 
    color: string,
    dashArray: string,
    dashOffset: number,
    animationDelay: number
  }) => (
    <Tooltip
      title={`${type.charAt(0).toUpperCase() + type.slice(1)}: ${Math.round(
        type === 'satisfied' ? satisfied : type === 'neutral' ? neutral : dissatisfied
      )}%`}
      followCursor
      placement="top"
      arrow
    >
      <circle
        cx="100"
        cy="100"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={hoveredArc === type ? 35 : 30}
        strokeDasharray={dashArray}
        strokeDashoffset={animation ? dashOffset : circumference}
        transform="rotate(-90 100 100)"
        style={{
          transition: `stroke-dashoffset ${1 + animationDelay}s ease-in-out, stroke-width 0.3s`,
          cursor: 'pointer'
        }}
        onMouseEnter={() => setHoveredArc(type)}
        onMouseLeave={() => setHoveredArc(null)}
      />
    </Tooltip>
  );

  return (
    <Card sx={cardStyle}>
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" fontWeight="500" gutterBottom>
          Overall Customer Satisfaction
        </Typography>

        {/* Chart container */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            my: 2
          }}
        >
          {loading ? (
            // Loading state
            <CircularProgress size={60} />
          ) : error ? (
            // Error state
            <Typography color="error" align="center">
              {error}
            </Typography>
          ) : (
            // Donut chart SVG
            <>
              <svg width="200" height="200" viewBox="0 0 200 200">
                {/* Background circle */}
                <circle
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke={theme.palette.grey[200]}
                  strokeWidth="30"
                />

                {/* Satisfaction arcs */}
                <DonutArc
                  type="satisfied"
                  color={theme.palette.success.light}
                  dashArray={`${satisfiedArc} ${circumference - satisfiedArc}`}
                  dashOffset={offsetArc1}
                  animationDelay={0}
                />
                <DonutArc
                  type="neutral"
                  color={theme.palette.warning.light}
                  dashArray={`${neutralArc} ${circumference - neutralArc}`}
                  dashOffset={offsetArc2}
                  animationDelay={0.3}
                />
                <DonutArc
                  type="dissatisfied"
                  color={theme.palette.error.light}
                  dashArray={`${dissatisfiedArc} ${circumference - dissatisfiedArc}`}
                  dashOffset={offsetArc3}
                  animationDelay={0.6}
                />
              </svg>

              {/* Center label */}
              <Box
                sx={{
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
                }}
              >
                <Typography variant="h4" fontWeight="bold" color="text.primary">
                  {overallSatisfaction}%
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: -0.5 }}>
                  All Time Satisfaction
                </Typography>
              </Box>
            </>
          )}
        </Box>

        {/* Legend section */}
        {!loading && !error && (
          <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 'auto', mb: 1 }}>
            {/* Satisfied legend item */}
            <Box
              sx={getLegendItemStyle('satisfied')}
              onMouseEnter={() => setHoveredArc('satisfied')}
              onMouseLeave={() => setHoveredArc(null)}
            >
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: theme.palette.success.main,
                  mr: 1
                }}
              />
              <Typography variant="body2">
                <strong>{Math.round(satisfied)}%</strong> Satisfied
              </Typography>
            </Box>
            
            {/* Neutral legend item */}
            <Box
              sx={getLegendItemStyle('neutral')}
              onMouseEnter={() => setHoveredArc('neutral')}
              onMouseLeave={() => setHoveredArc(null)}
            >
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: theme.palette.warning.main,
                  mr: 1
                }}
              />
              <Typography variant="body2">
                <strong>{Math.round(neutral)}%</strong> Neutral
              </Typography>
            </Box>
            
            {/* Dissatisfied legend item */}
            <Box
              sx={getLegendItemStyle('dissatisfied')}
              onMouseEnter={() => setHoveredArc('dissatisfied')}
              onMouseLeave={() => setHoveredArc(null)}
            >
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: theme.palette.error.main,
                  mr: 1
                }}
              />
              <Typography variant="body2">
                <strong>{Math.round(dissatisfied)}%</strong> Dissatisfied
              </Typography>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default SatisfactionDonutChart;