import React from 'react';
import { Chip } from '@mui/material';
import { StatusChipProps } from 'types/commonTypes';

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
      case 'transferred':
        return 'info';
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