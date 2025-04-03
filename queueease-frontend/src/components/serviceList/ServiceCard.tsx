import React from 'react';
import {
  Paper,
  Box,
  Typography,
  Button,
  Chip,
  useTheme
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PeopleIcon from '@mui/icons-material/People';
import AddIcon from '@mui/icons-material/Add';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { getCategoryIcon } from '../map/mapUtils';
import { getCategoryColor } from '../../utils/mapUtils';

const getSafeCategory = (category?: string): string => {
  return category || 'default';
};

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
  onTransferClick?: (serviceId: number) => void;
  showTransferButton?: boolean;
  theme?: any;
}

const ServiceCard: React.FC<ServiceCardProps> = React.memo(({
  service,
  isSelected = false,
  onCardClick,
  onJoinClick,
  onTransferClick,
  showTransferButton = false,
  theme: propTheme
}) => {
  const defaultTheme = useTheme();
  const theme = propTheme || defaultTheme;

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 1.5,
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid rgba(0,0,0,0.05)',
        bgcolor: isSelected ? 'rgba(0,0,0,0.03)' : 'white',
        transition: 'all 0.2s ease',
      }}
      onClick={() => onCardClick(service)}
    >
      <Box sx={{ display: 'flex', height: '100%', cursor: 'pointer' }}>
        {/* Color accent */}
        <Box
          sx={{
            width: 5,
            bgcolor: getCategoryColor(getSafeCategory(service.category)),
          }}
        />

        {/* Content */}
        <Box sx={{ p: 1.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={600}>
                {service.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.25 }}>
                {getCategoryIcon(getSafeCategory(service.category))}
                <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                  {service.category}
                </Typography>
              </Box>
            </Box>

            {/* Transfer Button */}
            {showTransferButton && onTransferClick ? (
              <Button
                variant="contained"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.stopPropagation();
                  onTransferClick(service.id);
                }}
                size="small"
                startIcon={<SwapHorizIcon fontSize="small" />}
                sx={{
                  borderRadius: 1.5,
                  py: 0.25,
                  px: 1,
                  ml: 1,
                  minWidth: 'auto',
                  fontSize: '0.75rem',
                  backgroundColor: theme.palette.info.main,
                  '&:hover': {
                    backgroundColor: theme.palette.info.dark,
                  }
                }}
              >
                Transfer
              </Button>
            ) : (onJoinClick && service.service_type === 'appointment') && (
              <Button
                variant="contained"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.stopPropagation();
                  onJoinClick(service.id);
                }}
                size="small"
                startIcon={<AddIcon fontSize="small" />}
                sx={{
                  borderRadius: 1.5,
                  py: 0.25,
                  px: 1,
                  ml: 1,
                  minWidth: 'auto',
                  fontSize: '0.75rem',
                  backgroundColor: theme.palette.primary.main,
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                  }
                }}
              >
                Book
              </Button>
            )}
          </Box>

          {/* Description */}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              mt: 0.5,
              mb: 1,
              display: '-webkit-box',
              overflow: 'hidden',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 1,
            }}
          >
            {service.description || "No description provided."}
          </Typography>

          {/* Status indicators */}
          <Box sx={{ display: 'flex', gap: 1.5, mt: 'auto' }}>
            {/* Wait time indicator */}
            {typeof service.wait_time === 'number' && service.wait_time > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccessTimeIcon
                  fontSize="small"
                  sx={{
                    color: service.wait_time > 30 ? 'error.main' : 'success.main',
                    mr: 0.5,
                    fontSize: '0.875rem'
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: service.wait_time > 30 ? 'error.main' : 'success.main',
                  }}
                >
                  {service.wait_time} min
                </Typography>
              </Box>
            )}
            
            {/* Queue indicator */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PeopleIcon
                fontSize="small"
                sx={{
                  color: service.queue_length && service.queue_length > 10
                    ? 'error.main'
                    : 'success.main',
                  mr: 0.5,
                  fontSize: '0.875rem'
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  color: service.queue_length && service.queue_length > 10
                    ? 'error.main'
                    : 'success.main',
                }}
              >
                {service.queue_length || 0} in queue
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
});

export default ServiceCard;