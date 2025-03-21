import React from 'react';
import { Box, Badge, BadgeProps } from '@mui/material';

interface IconBadgeProps extends Omit<BadgeProps, 'children'> {
  icon: React.ReactNode;
  badgeContent?: React.ReactNode;
}

const IconBadge: React.FC<IconBadgeProps> = ({ 
  icon, 
  badgeContent, 
  color = 'primary',
  ...badgeProps 
}) => {
  return (
    <Badge 
      badgeContent={badgeContent} 
      color={color} 
      {...badgeProps}
    >
      <Box 
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {icon}
      </Box>
    </Badge>
  );
};

export default IconBadge;