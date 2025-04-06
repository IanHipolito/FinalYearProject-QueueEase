import React from 'react';
import { Card, CardContent, Typography, Box, Chip, Button } from '@mui/material';
import { ServiceCardProps } from 'types/mapTypes';

const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  isSelected = false,
  onCardClick,
  onJoinClick,
  theme
}) => {
  return (
    <Card
      sx={{
        borderRadius: 4,
        transition: 'transform 0.2s, box-shadow 0.2s',
        border: isSelected ? `2px solid ${theme.palette.primary.main}` : 'none',
        boxShadow: isSelected ? `0 0 0 2px ${theme.palette.primary.main}` : '0 2px 8px rgba(0,0,0,0.08)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
        },
        cursor: 'pointer',
        mb: 2,
        position: 'relative'
      }}
      onClick={() => onCardClick(service)}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography variant="h6" fontWeight="600" noWrap>
            {service.name}
          </Typography>
          {service.category && (
            <Chip 
              label={service.category || 'General'}
              size="small" 
              sx={{ ml: 1, bgcolor: 'primary.light', color: 'white' }}
            />
          )}
        </Box>
        
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {service.description}
        </Typography>
        
        {onJoinClick && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 'auto' }}>
            <Button
              variant="contained"
              size="small"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                onJoinClick && onJoinClick(service.id);
              }}
              sx={{ 
                borderRadius: 4,
                textTransform: 'none',
                bgcolor: theme.palette.primary.main,
                '&:hover': {
                  bgcolor: theme.palette.primary.dark
                }
              }}
            >
              Join Queue
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ServiceCard;