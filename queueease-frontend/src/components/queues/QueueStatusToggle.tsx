import React from 'react';
import { Card, CardContent, Box, Typography, Switch, FormControlLabel } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import { QueueStatusToggleProps } from 'types/queueTypes';

const QueueStatusToggle: React.FC<QueueStatusToggleProps> = ({ 
  activeQueues, 
  inactiveQueues, 
  bgColor, 
  iconColor 
}) => {
  const [showActive, setShowActive] = React.useState(true);

  const handleToggle = () => {
    setShowActive(!showActive);
  };

  return (
    <Card sx={{ borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ 
            bgcolor: bgColor, 
            color: iconColor, 
            p: 1, 
            borderRadius: 2, 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <SettingsIcon />
          </Box>
        </Box>
        <Box sx={{ mt: 2 }}>
          <Typography variant="h4" fontWeight="bold">
            {showActive ? activeQueues : inactiveQueues}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {showActive ? 'Active Queues' : 'Inactive Queues'}
            </Typography>
            <FormControlLabel
              control={
                <Switch 
                  size="small" 
                  checked={showActive}
                  onChange={handleToggle}
                  sx={{ ml: 1 }}
                />
              }
              label=""
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default QueueStatusToggle;