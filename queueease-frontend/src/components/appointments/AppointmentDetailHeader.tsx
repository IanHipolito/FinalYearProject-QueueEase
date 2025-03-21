import React from 'react';
import { Box, Typography } from '@mui/material';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';

interface AppointmentDetailHeaderProps {
  title: string;
  orderId: string;
}

const AppointmentDetailHeader: React.FC<AppointmentDetailHeaderProps> = ({ title, orderId }) => {
  return (
    <>
      <Typography variant="h5" fontWeight={600}>
        {title}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
        <ConfirmationNumberIcon sx={{ mr: 1, fontSize: 18 }} />
        <Typography variant="body2">
          Order ID: {orderId}
        </Typography>
      </Box>
    </>
  );
};

export default AppointmentDetailHeader;