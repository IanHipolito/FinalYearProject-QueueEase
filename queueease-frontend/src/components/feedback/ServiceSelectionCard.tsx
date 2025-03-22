import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip
} from '@mui/material';
import { ServiceWithOrderDetails } from '../../types/feedbackTypes';

interface ServiceSelectionCardProps {
  service: ServiceWithOrderDetails;
  onSelect: () => void;
}

const ServiceSelectionCard: React.FC<ServiceSelectionCardProps> = ({ service, onSelect }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <Card
      sx={{
        borderRadius: 2,
        mb: 2,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        border: '1px solid',
        borderColor: 'divider',
        transition: 'transform 0.3s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" fontWeight="medium">{service.name}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {service.order_details}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Order Date: {formatDate(service.date)}
            </Typography>
          </Box>
          
          <Box>
            {service.has_feedback ? (
              <Chip 
                label="Feedback Submitted" 
                color="success" 
                variant="outlined" 
                size="small"
              />
            ) : (
              <Button
                variant="contained"
                onClick={onSelect}
                sx={{
                  bgcolor: '#6f42c1',
                  '&:hover': {
                    bgcolor: '#8551d9',
                  },
                  borderRadius: 2
                }}
              >
                Give Feedback
              </Button>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ServiceSelectionCard;