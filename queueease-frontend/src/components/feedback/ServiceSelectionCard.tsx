import React from 'react';
import {
  Card, CardContent, Typography, Box, Button, Chip, Tooltip
} from '@mui/material';
import FeedbackIcon from '@mui/icons-material/Feedback';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { ServiceSelectionCardProps } from 'types/feedbackTypes';
import EventIcon from '@mui/icons-material/Event';
import RateReviewIcon from '@mui/icons-material/RateReview';
import LocalMallIcon from '@mui/icons-material/LocalMall';

const ServiceSelectionCard: React.FC<ServiceSelectionCardProps> = ({ service, onSelect, disabled = false }) => {
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
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        position: 'relative',
        border: '1px solid',
        borderColor: service.has_feedback ? 'rgba(76, 175, 80, 0.3)' : 'divider',
        backgroundColor: service.has_feedback ? 'rgba(76, 175, 80, 0.03)' : 'white',
        overflow: 'hidden',
        '&:hover': disabled ? {} : {
          transform: 'translateY(-2px)',
          boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
        },
        cursor: disabled ? 'default' : 'pointer',
      }}
      onClick={disabled ? undefined : onSelect}
    >
      {service.has_feedback && (
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 0, 
            right: 0,
            bgcolor: '#4caf50',
            color: 'white',
            py: 0.5,
            px: 1,
            fontSize: '0.75rem',
            fontWeight: 'medium',
            borderBottomLeftRadius: 8
          }}
        >
          Feedback Submitted
        </Box>
      )}
      
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
          <Box sx={{ 
            bgcolor: service.has_feedback ? 'rgba(76, 175, 80, 0.1)' : 'rgba(111, 66, 193, 0.1)', 
            p: 1.5, 
            borderRadius: 2,
            mr: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {service.has_feedback ? 
              <CheckCircleIcon sx={{ color: '#4caf50' }} /> : 
              <LocalMallIcon sx={{ color: '#6f42c1' }} />
            }
          </Box>
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" fontWeight="medium">{service.name}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {service.order_details}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <EventIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
              <Typography variant="caption" color="text.secondary">
                Order Date: {formatDate(service.date)}
              </Typography>
            </Box>
            
            {!disabled && !service.has_feedback && (
              <Tooltip title="Provide your feedback for this service">
                <Button
                  variant="contained"
                  startIcon={<RateReviewIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect();
                  }}
                  sx={{
                    mt: 1,
                    bgcolor: '#6f42c1',
                    '&:hover': {
                      bgcolor: '#8551d9',
                    },
                    borderRadius: 2,
                    textTransform: 'none'
                  }}
                >
                  Give Feedback
                </Button>
              </Tooltip>
            )}
            
            {disabled && service.has_feedback && (
              <Chip 
                icon={<FeedbackIcon />}
                label="Feedback Submitted" 
                color="success" 
                variant="outlined" 
                size="small"
                sx={{ mt: 1 }}
              />
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ServiceSelectionCard;