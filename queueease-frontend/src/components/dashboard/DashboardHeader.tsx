import React from 'react';
import { Box, Typography, FormControl, Select, MenuItem } from '@mui/material';
import { DashboardHeaderProps } from 'types/dashboardTypes';

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  serviceName,
  services,
  onServiceChange,
  currentServiceId
}) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
      <Typography variant="h5" fontWeight="500">
        {title} {serviceName && `- ${serviceName}`}
      </Typography>

      {services && services.length > 1 && (
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <Select
            value={currentServiceId || ''}
            onChange={onServiceChange}
            displayEmpty
            sx={{ borderRadius: 2 }}
          >
            <MenuItem value="" disabled>Select a service</MenuItem>
            {services.map((service) => (
              <MenuItem key={service.id} value={service.id}>
                {service.name} {service.is_owner ? '(Owner)' : ''}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </Box>
  );
};

export default DashboardHeader;