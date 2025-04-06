import React from 'react';
import {
  Card, CardContent, CardActions, Typography, Box, Button, Divider
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StorefrontIcon from '@mui/icons-material/Storefront';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import { AppointmentCardProps } from 'types/appointmentTypes';

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment, onView, onRemove, formatDate
}) => {
  return (
    <Card 
      sx={{
        borderRadius: 3,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography 
          variant="h5" 
          fontWeight={600} 
          sx={{ mb: 2, color: 'primary.main' }}
        >
          {appointment.appointment_title}
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          mb: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
            <StorefrontIcon sx={{ mr: 1, fontSize: 18 }} />
            <Typography variant="body1">
              {appointment.service_name}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
            <EventIcon sx={{ mr: 1, fontSize: 18 }} />
            <Typography variant="body1">
              {formatDate(appointment.appointment_date)}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
            <AccessTimeIcon sx={{ mr: 1, fontSize: 18 }} />
            <Typography variant="body1">
              {appointment.appointment_time}
            </Typography>
          </Box>
        </Box>
      </CardContent>
      
      <Divider />
      
      <CardActions sx={{ p: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          startIcon={<VisibilityIcon />}
          onClick={() => onView(appointment.order_id)}
          sx={{ 
            borderRadius: 2,
            borderColor: 'primary.main',
            color: 'primary.main',
            mr: 1,
            '&:hover': { 
              bgcolor: 'rgba(111, 66, 193, 0.08)',
              borderColor: 'primary.dark'
            },
          }}
        >
          View Details
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={() => onRemove(appointment.order_id)}
          sx={{ 
            borderRadius: 2, 
            '&:hover': { 
              bgcolor: 'rgba(211, 47, 47, 0.08)'
            }
          }}
        >
          Remove
        </Button>
      </CardActions>
    </Card>
  );
};

export default AppointmentCard;