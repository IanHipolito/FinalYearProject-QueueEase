import React from 'react';
import { Box, Typography } from '@mui/material';
import { Service } from '../../types/serviceTypes';
import { getCategoryColor } from '../../utils/mapUtils';
import { getCategoryIcon } from './mapUtils';

interface ServiceMarkerProps {
  service: Service;
  onClick: (service: Service) => void;
  isSelected?: boolean;
}

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
      {getCategoryIcon(service.category || 'default', 'small')}
      
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