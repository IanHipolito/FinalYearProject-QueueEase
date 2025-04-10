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

  // If props are null fetch data from the API
  const [loading, setLoading] = useState(
    propSatisfactionRate === null || propNeutralRate === null || propDissatisfiedRate === null
  );
  const [hoveredArc, setHoveredArc] = useState<'satisfied' | 'neutral' | 'dissatisfied' | null>(null);
  const [animation, setAnimation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local state for the three percentages
  const [satisfied, setSatisfied] = useState(propSatisfactionRate ?? 0);
  const [neutral, setNeutral] = useState(propNeutralRate ?? 0);
  const [dissatisfied, setDissatisfied] = useState(propDissatisfiedRate ?? 0);

  // Fetch analytics if needed
  useEffect(() => {
    const fetchData = async () => {
      if (
        propSatisfactionRate !== null &&
        propNeutralRate !== null &&
        propDissatisfiedRate !== null
      ) {
        return; // We already have props
      }

      try {
        setLoading(true);
        setError(null);
        
        if (currentService?.id) {
          const data = await API.admin.getAnalytics(currentService.id);
          
          if (data) {
            let s = data.satisfied_pct ?? 0;
            let n = data.neutral_pct ?? 0;
            let d = data.dissatisfied_pct ?? 0;

            // Round total to 100 if needed
            const total = s + n + d;
            if (total !== 100) {
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

  // Trigger the arc animation once loading is complete
  useEffect(() => {
    if (!loading) {
      setAnimation(true);
    }
  }, [loading]);

  // For a circle of radius 70
  const circumference = 2 * Math.PI * 70;

  // Convert percentages to arc lengths
  const satisfiedArc = (Math.max(0, Math.min(satisfied, 100)) / 100) * circumference;
  const neutralArc = (Math.max(0, Math.min(neutral, 100)) / 100) * circumference;
  const dissatisfiedArc = (Math.max(0, Math.min(dissatisfied, 100)) / 100) * circumference;
  const offsetArc1 = 0;
  const offsetArc2 = circumference - satisfiedArc;
  const offsetArc3 = offsetArc2 - neutralArc;

  // Shown in the center
  const overallSatisfaction = Math.round(satisfied);

  return (
    <Card
      sx={{
        borderRadius: 4,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        height: '100%',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
        }
      }}
    >
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" fontWeight="500" gutterBottom>
          Overall Customer Satisfaction
        </Typography>

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
            <CircularProgress size={60} />
          ) : error ? (
            <Typography color="error" align="center">
              {error}
            </Typography>
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

                {/* ARC 1: Satisfied */}
                <Tooltip
                  title={`Satisfied: ${Math.round(satisfied)}%`}
                  followCursor
                  placement="top"
                  arrow
                >
                  <circle
                    cx="100"
                    cy="100"
                    r="70"
                    fill="none"
                    stroke={theme.palette.success.light}
                    strokeWidth={hoveredArc === 'satisfied' ? 35 : 30}
                    strokeDasharray={`${satisfiedArc} ${circumference - satisfiedArc}`}
                    strokeDashoffset={animation ? offsetArc1 : circumference}
                    transform="rotate(-90 100 100)"
                    style={{
                      transition: 'stroke-dashoffset 1s ease-in-out, stroke-width 0.3s',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={() => setHoveredArc('satisfied')}
                    onMouseLeave={() => setHoveredArc(null)}
                  />
                </Tooltip>

                {/* ARC 2: Neutral */}
                <Tooltip
                  title={`Neutral: ${Math.round(neutral)}%`}
                  followCursor
                  placement="top"
                  arrow
                >
                  <circle
                    cx="100"
                    cy="100"
                    r="70"
                    fill="none"
                    stroke={theme.palette.warning.light}
                    strokeWidth={hoveredArc === 'neutral' ? 35 : 30}
                    strokeDasharray={`${neutralArc} ${circumference - neutralArc}`}
                    strokeDashoffset={animation ? offsetArc2 : circumference}
                    transform="rotate(-90 100 100)"
                    style={{
                      transition: 'stroke-dashoffset 1.3s ease-in-out, stroke-width 0.3s',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={() => setHoveredArc('neutral')}
                    onMouseLeave={() => setHoveredArc(null)}
                  />
                </Tooltip>

                {/* ARC 3: Dissatisfied */}
                <Tooltip
                  title={`Dissatisfied: ${Math.round(dissatisfied)}%`}
                  followCursor
                  placement="top"
                  arrow
                >
                  <circle
                    cx="100"
                    cy="100"
                    r="70"
                    fill="none"
                    stroke={theme.palette.error.light}
                    strokeWidth={hoveredArc === 'dissatisfied' ? 35 : 30}
                    strokeDasharray={`${dissatisfiedArc} ${circumference - dissatisfiedArc}`}
                    strokeDashoffset={animation ? offsetArc3 : circumference}
                    transform="rotate(-90 100 100)"
                    style={{
                      transition: 'stroke-dashoffset 1.6s ease-in-out, stroke-width 0.3s',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={() => setHoveredArc('dissatisfied')}
                    onMouseLeave={() => setHoveredArc(null)}
                  />
                </Tooltip>
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

        {/* Simple legend at the bottom */}
        {!loading && !error && (
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