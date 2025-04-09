import React from 'react';
import { Box, Typography } from '@mui/material';
import { ServiceMarkerProps } from '../../types/serviceTypes';
import { getCategoryColor, getCategoryIcon } from '../../utils/mapUtils';

const ServiceMarker: React.FC<ServiceMarkerProps> = ({ 
  service, 
  onClick,
  isSelected = false 
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(service);
  };

  return (
    <Box
      onClick={handleClick}
      className={`queueease-marker ${isSelected ? 'queueease-marker-selected' : ''}`}
      data-service-id={service.id}
      sx={{
        bgcolor: getCategoryColor(service.category || 'default'),
        cursor: 'pointer',
      }}
    >
      {getCategoryIcon(service.category || 'default', 'small') as React.ReactElement || undefined}
      
      {(service.queue_length && service.queue_length > 0) && (
        <Box
          className="queueease-marker-badge"
          sx={{
            bgcolor: (service.queue_length && service.queue_length > 10) ? '#f44336' : '#4caf50',
          }}
        >
          <Typography variant="caption" sx={{ fontSize: 10 }}>
            {service.queue_length}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ServiceMarker;