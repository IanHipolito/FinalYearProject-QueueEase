import React, { ReactNode } from 'react';
import { Card, Box, Typography, useTheme } from '@mui/material';

interface DetailCardProps {
  title: string;
  subtitle?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  subtitleIcon?: ReactNode;
  headerColor?: string;
}

const DetailCard: React.FC<DetailCardProps> = ({ 
  title, 
  subtitle, 
  icon, 
  children, 
  subtitleIcon, 
  headerColor 
}) => {
  const theme = useTheme();
  
  return (
    <Card
      elevation={2}
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)'
        }
      }}
    >
      <Box sx={{ 
        bgcolor: headerColor || theme.palette.primary.main, 
        py: 3, 
        px: 3, 
        color: 'white'
      }}>
        <Typography variant="h5" fontWeight={600}>
          {icon && React.cloneElement(icon as React.ReactElement, { sx: { mr: 1, fontSize: 24 } })}
          {title}
        </Typography>
        {subtitle && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            {subtitleIcon && React.cloneElement(subtitleIcon as React.ReactElement, { sx: { mr: 1, fontSize: 18 } })}
            <Typography variant="body2">
              {subtitle}
            </Typography>
          </Box>
        )}
      </Box>
      {children}
    </Card>
  );
};

export default DetailCard;