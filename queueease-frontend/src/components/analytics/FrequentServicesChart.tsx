import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';

interface ServiceData {
  name: string;
  count: number;
}

interface FrequentServicesChartProps {
  services: ServiceData[];
}

const FrequentServicesChart: React.FC<FrequentServicesChartProps> = ({ services }) => {
  const theme = useTheme();
  
  // Calculate max count for scaling
  const maxCount = services.length > 0 ? Math.max(...services.map(s => s.count)) : 0;
  
  return (
    <Box sx={{ height: 280, mt: 1 }}>
      {services.length > 0 ? (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {services.map((service, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  minWidth: 150, 
                  maxWidth: 150,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {service.name}
              </Typography>
              <Box sx={{ flexGrow: 1, ml: 2, display: 'flex', alignItems: 'center' }}>
                <Box sx={{ 
                  height: 16, 
                  bgcolor: theme.palette.primary.main,
                  borderRadius: 2,
                  width: `${(service.count / maxCount) * 100}%`,
                  minWidth: 30,
                  transition: 'width 0.3s ease'
                }} />
                <Typography variant="body2" sx={{ ml: 2 }}>
                  {service.count}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      ) : (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%',
          color: 'text.secondary'
        }}>
          No data available for the selected time period
        </Box>
      )}
    </Box>
  );
};

export default FrequentServicesChart;