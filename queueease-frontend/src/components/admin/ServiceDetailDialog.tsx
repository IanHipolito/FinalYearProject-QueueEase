import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, List, ListItemButton,
  ListItemIcon, ListItemText
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CategoryIcon from '@mui/icons-material/Category';
import BusinessIcon from '@mui/icons-material/Business';
import { ServiceDetailDialogProps } from 'types/serviceTypes';

const ServiceDetailDialog: React.FC<ServiceDetailDialogProps> = ({
  open,
  onClose,
  service,
  onSelect
}) => {
  if (!service) return null;
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        {service.name}
      </DialogTitle>
      <DialogContent dividers>
        {service.location && (
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 2, 
              p: 1.5,
              borderRadius: 1,
              bgcolor: 'rgba(111,66,193,0.05)',
              border: '1px solid rgba(111,66,193,0.1)'
            }}
          >
            <LocationOnIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="subtitle2">
              Located at: <strong>{service.location}</strong>
            </Typography>
          </Box>
        )}
        
        <Typography variant="body1" paragraph>
          {service.description || "No description available."} 
          {service.location && !service.description?.includes(service.location) && (
            <> This service is available at <strong>{service.location}</strong>.</>
          )}
        </Typography>
        
        <Typography variant="subtitle2" sx={{ mb: 1, mt: 2, fontWeight: 'medium' }}>
          Service Details
        </Typography>
        <List dense sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
          {service.category && (
            <ListItemButton>
              <ListItemIcon>
                <CategoryIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Category"
                secondary={service.category}
              />
            </ListItemButton>
          )}
          
          {service.location && (
            <ListItemButton>
              <ListItemIcon>
                <LocationOnIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Location"
                primaryTypographyProps={{ fontWeight: 'medium' }}
                secondary={
                  <Typography variant="body2" component="span">
                    {service.location}
                  </Typography>
                }
              />
            </ListItemButton>
          )}
          
          {service.business_hours && (
            <ListItemButton>
              <ListItemIcon>
                <BusinessIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Business Hours"
                secondary={service.business_hours}
              />
            </ListItemButton>
          )}
        </List>
        
        {service.location && (
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="caption" color="text.secondary" align="center">
              *You'll be able to manage this service's queue system for customers at this location
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {service && !service.has_admin && onSelect && (
          <Button 
            variant="contained"
            onClick={() => {
              onSelect(service);
              onClose();
            }}
          >
            Select This Service
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ServiceDetailDialog;