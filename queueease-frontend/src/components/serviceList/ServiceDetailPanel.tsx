import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Chip,
  Divider
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PeopleIcon from '@mui/icons-material/People';
import DirectionsIcon from '@mui/icons-material/Directions';
import AddIcon from '@mui/icons-material/Add';
import { Service } from '../../types/serviceTypes';
import { getCategoryIcon } from '../map/mapUtils';
import { getCategoryColor } from '../../utils/mapUtils';

interface ServiceDetailProps {
  service: Service | null; // Make service nullable
  onClose: () => void;
  onJoinQueue: (serviceId: number) => void;
}

const ServiceDetailPanel: React.FC<ServiceDetailProps> = ({
  service,
  onClose,
  onJoinQueue
}) => {
  if (!service) return null; // Return null when service is null
  
  const handleGetDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${service.latitude},${service.longitude}`;
    window.open(url, '_blank');
  };

  return (
    <Paper
      elevation={1}
      sx={{
        position: 'absolute',
        right: 16,
        top: 80,
        width: { xs: 'calc(100% - 32px)', sm: 350 },
        maxHeight: 'calc(100vh - 96px)',
        overflow: 'auto',
        zIndex: 10,
        borderRadius: 3,
      }}
    >
      <Box sx={{ height: 12, bgcolor: getCategoryColor(service.category || 'default') }} />

      <Box sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          {service.name}
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Chip
            icon={getCategoryIcon(service.category || 'default')}
            label={service.category}
            size="small"
            sx={{ borderRadius: 2 }}
          />

          {service.wait_time && service.wait_time > 0 && (
            <Chip
              icon={<AccessTimeIcon />}
              label={`${service.wait_time} min wait`}
              size="small"
              color={service.wait_time > 30 ? "error" : "success"}
              sx={{ borderRadius: 2 }}
            />
          )}

          {service.queue_length && service.queue_length > 0 && (
            <Chip
              icon={<PeopleIcon />}
              label={`${service.queue_length} in queue`}
              size="small"
              color={service.queue_length > 10 ? "error" : "success"}
              sx={{ borderRadius: 2 }}
            />
          )}
        </Box>

        <Typography variant="body1" paragraph>
          {service.description || "No description provided for this service."}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ borderRadius: 3, flexGrow: 1 }}
            onClick={() => onJoinQueue(service.id)}
          >
            {service.service_type === 'appointment' ? 'Book Appointment' : 'Join Queue'}
          </Button>

          <Button
            variant="outlined"
            startIcon={<DirectionsIcon />}
            sx={{ borderRadius: 3 }}
            onClick={handleGetDirections}
          >
            Directions
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default ServiceDetailPanel;