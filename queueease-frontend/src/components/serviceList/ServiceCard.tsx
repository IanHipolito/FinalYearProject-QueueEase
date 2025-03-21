import React from 'react';
import {
  Paper,
  Box,
  Typography,
  Button,
  Chip
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PeopleIcon from '@mui/icons-material/People';
import AddIcon from '@mui/icons-material/Add';
import { getCategoryIcon } from '../map/mapUtils';
import { getCategoryColor } from '../../utils/mapUtils';

// Helper function to safely handle potentially undefined category
const getSafeCategory = (category?: string): string => {
  return category || 'default';
};

// Update the interface to include all needed properties
interface ServiceCardProps {
  service: {
    id: number;
    name: string;
    description?: string;
    category?: string;
    wait_time?: number;
    queue_length?: number;
    service_type?: 'immediate' | 'appointment';
  };
  isSelected?: boolean;
  onCardClick: (service: any) => void;
  onJoinClick?: (serviceId: number) => void;
  theme: any;
}

const ServiceCard: React.FC<ServiceCardProps> = React.memo(({
  service,
  isSelected = false,
  onCardClick,
  onJoinClick,
  theme
}) => (
  <Paper
    elevation={0}
    sx={{
      mb: 2,
      borderRadius: 3,
      overflow: 'hidden',
      border: '1px solid rgba(0,0,0,0.05)',
      bgcolor: isSelected ? 'rgba(0,0,0,0.03)' : 'white',
      '&:hover': {
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      }
    }}
    onClick={() => onCardClick(service)}
  >
    <Box sx={{ display: 'flex', height: '100%', cursor: 'pointer' }}>
      {/* Color accent */}
      <Box
        sx={{
          width: 8,
          bgcolor: getCategoryColor(getSafeCategory(service.category)),
          display: { xs: 'none', sm: 'block' }
        }}
      />

      {/* Content */}
      <Box sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              {service.name}
            </Typography>
            {service.category && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                {getCategoryIcon(getSafeCategory(service.category))}
                <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                  {service.category}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Wait time indicator */}
          {typeof service.wait_time === 'number' && service.wait_time > 0 && (
            <Box
              sx={{
                bgcolor: service.wait_time > 30 ? 'error.light' : 'success.light',
                color: service.wait_time > 30 ? 'error.dark' : 'success.dark',
                px: 1.5,
                py: 0.5,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                height: 'fit-content'
              }}
            >
              <AccessTimeIcon fontSize="small" sx={{ mr: 0.5 }} />
              <Typography variant="caption" fontWeight={600}>
                {service.wait_time} min
              </Typography>
            </Box>
          )}
        </Box>

        {/* Description - truncated for performance */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mt: 1,
            mb: 1.5,
            display: '-webkit-box',
            overflow: 'hidden',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
          }}
        >
          {service.description || "No description provided."}
        </Typography>

        {/* Action buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 'auto' }}>
          {/* Queue indicator */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PeopleIcon
              fontSize="small"
              sx={{
                color: service.queue_length && service.queue_length > 10
                  ? 'error.main'
                  : 'success.main',
                mr: 0.5
              }}
            />
            <Typography
              variant="body2"
              sx={{
                color: service.queue_length && service.queue_length > 10
                  ? 'error.main'
                  : 'success.main',
              }}
            >
              {service.queue_length || 0} in queue
            </Typography>
          </Box>

          {/* Join button */}
          {onJoinClick && (
            <Button
              variant="contained"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                onJoinClick(service.id);
              }}
              size="small"
              endIcon={<AddIcon />}
              sx={{
                borderRadius: 4,
                px: 2,
                backgroundColor: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                }
              }}
            >
              {service.service_type === 'appointment' ? 'Book' : 'Join Queue'}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  </Paper>
));

export default ServiceCard;