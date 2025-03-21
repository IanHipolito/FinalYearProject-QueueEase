import React from 'react';
import { Chip, ChipProps } from '@mui/material';

interface StatusChipProps extends Omit<ChipProps, 'color'> {
  status: string;
  size?: 'small' | 'medium';
}

const StatusChip: React.FC<StatusChipProps> = ({ status, size = 'small', ...rest }) => {
  const getStatusColor = (status: string): 'success' | 'warning' | 'info' | 'default' | 'error' | 'primary' | 'secondary' => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'not_started':
        return 'info';
      case 'cancelled':
        return 'error';
      case 'in_queue':
        return 'primary';
      default:
        return 'default';
    }
  };

  return (
    <Chip
      label={status.replace('_', ' ')}
      size={size}
      color={getStatusColor(status)}
      {...rest}
    />
  );
};

export default StatusChip;