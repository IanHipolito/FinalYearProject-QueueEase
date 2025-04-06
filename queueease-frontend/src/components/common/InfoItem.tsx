import React, { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import { InfoItemProps } from 'types/commonTypes';

const InfoItem: React.FC<InfoItemProps> = ({ icon, label, value }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
      {React.cloneElement(icon as React.ReactElement, { 
        sx: { mr: 2, color: 'text.secondary' } 
      })}
      <Box>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        {typeof value === 'string' ? (
          <Typography variant="body1" fontWeight={500}>
            {value}
          </Typography>
        ) : (
          value
        )}
      </Box>
    </Box>
  );
};

export default InfoItem;