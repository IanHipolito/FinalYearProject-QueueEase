import React from 'react';
import { Box, Typography, CircularProgress, Button } from '@mui/material';
import ServiceCard from './ServiceCard';
import { ServiceListProps } from 'types/serviceTypes';

const ServiceList: React.FC<ServiceListProps> = ({
  services,
  loading,
  selectedService,
  onServiceClick,
  onJoinClick,
  theme,
  emptyMessage = "No services match your criteria",
  onClearFilters
}) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (services.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          {emptyMessage}
        </Typography>
        {onClearFilters && (
          <Button
            variant="contained"
            onClick={onClearFilters}
            sx={{ mt: 2, borderRadius: 2 }}
          >
            Clear Filters
          </Button>
        )}
      </Box>
    );
  }

  return (
    <Box>
      {services.map(service => (
        <ServiceCard
          key={service.id}
          service={service}
          isSelected={selectedService?.id === service.id}
          onCardClick={onServiceClick}
          onJoinClick={onJoinClick}
          theme={theme}
        />
      ))}
    </Box>
  );
};

export default ServiceList;