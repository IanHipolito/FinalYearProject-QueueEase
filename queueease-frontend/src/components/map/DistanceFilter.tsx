import React from 'react';
import {
  Box,
  Slider,
  Typography,
  Paper,
  Stack,
  Chip,
  useTheme
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';

interface DistanceFilterProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

const DistanceFilter: React.FC<DistanceFilterProps> = ({
  value,
  onChange,
  min = 0.5,
  max = 10,
  step = 0.5
}) => {
  const theme = useTheme();
  
  const handleChange = (_event: Event, newValue: number | number[]) => {
    onChange(newValue as number);
  };

  const formatDistance = (value: number) => {
    return `${value} km`;
  };
  
  // Estimate travel time based on distance and transport mode
  const getEstimatedTime = (distance: number, mode: 'walk' | 'bike' | 'car') => {
    // Average speeds in km/h: walking ~5km/h, biking ~15km/h, driving ~30km/h in urban area
    const speeds = {
      walk: 5,
      bike: 15,
      car: 30
    };
    
    // Calculate time in minutes
    const timeInMinutes = Math.round((distance / speeds[mode]) * 60);
    
    if (timeInMinutes < 1) {
      return '< 1min';
    } else if (timeInMinutes >= 60) {
      const hours = Math.floor(timeInMinutes / 60);
      const minutes = timeInMinutes % 60;
      return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`;
    } else {
      return `${timeInMinutes}min`;
    }
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 1.5,
        borderRadius: 2,
        bgcolor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <LocationOnIcon 
            color="primary" 
            fontSize="small"
            sx={{ mr: 0.5 }} 
          />
          <Typography variant="body2" fontWeight={500}>
            {formatDistance(value)}
          </Typography>
        </Box>
        
        {/* Travel time indicators */}
        <Stack direction="row" spacing={1.5}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <DirectionsWalkIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
            <Typography variant="caption" color="text.secondary">
              {getEstimatedTime(value, 'walk')}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <DirectionsBikeIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
            <Typography variant="caption" color="text.secondary">
              {getEstimatedTime(value, 'bike')}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <DirectionsCarIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
            <Typography variant="caption" color="text.secondary">
              {getEstimatedTime(value, 'car')}
            </Typography>
          </Box>
        </Stack>
      </Box>
      
      <Slider
        value={value}
        onChange={handleChange}
        aria-labelledby="distance-slider"
        valueLabelDisplay="off"
        step={step}
        marks={[
          { value: min, label: `${min}` },
          { value: max, label: `${max}` }
        ]}
        min={min}
        max={max}
        sx={{
          color: theme.palette.primary.main,
          height: 4,
          padding: '8px 0',
          '& .MuiSlider-thumb': {
            width: 16,
            height: 16,
            '&:hover, &.Mui-focusVisible': {
              boxShadow: `0px 0px 0px 6px ${theme.palette.primary.main}25`,
            },
          },
          '& .MuiSlider-valueLabel': {
            display: 'none',
          },
        }}
      />
    </Paper>
  );
};

export default DistanceFilter;