import React, { useState } from 'react';
import {
  Box, Button, Card, CardContent, Typography,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, InputAdornment, List, ListItemButton,
  ListItemIcon, ListItemText, Stack, Chip, IconButton,
  Tooltip, Divider, CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CategoryIcon from '@mui/icons-material/Category';

interface Service {
  id: number;
  name: string;
  description: string;
  category?: string;
  location?: string;
  business_hours?: string;
  has_admin?: boolean;
}

interface ServiceSelectorProps {
  selectedService: Service | null;
  onSelectService: (service: Service | null) => void;
  loading: boolean;
  services: Service[];
  visibleServices: Service[];
  filteredServices: Service[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  visibleStart: number;
  ITEMS_PER_PAGE: number;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  viewServiceDetails: (service: Service, e?: React.MouseEvent) => void;
  submitting: boolean;
}

const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  selectedService,
  onSelectService,
  loading,
  services,
  visibleServices,
  filteredServices,
  searchQuery,
  setSearchQuery,
  visibleStart,
  ITEMS_PER_PAGE,
  onScroll,
  viewServiceDetails,
  submitting
}) => {
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);

  const openServiceDialog = () => {
    setServiceDialogOpen(true);
  };

  const handleServiceSelect = (service: Service | null) => {
    onSelectService(service);
  };

  return (
    <>
      <Box sx={{ mt: 3, mb: 1 }}>
        <Typography variant="subtitle1" fontWeight="medium" mb={1}>
          Select Service to Manage
        </Typography>
        
        {selectedService ? (
          <Card variant="outlined" sx={{ mb: 2, border: '1px solid #e0e0e0' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="h6">{selectedService.name}</Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {selectedService.category || "General Service"}
                  </Typography>
                  {selectedService.location && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      <LocationOnIcon fontSize="small" sx={{ color: 'text.secondary', mr: 0.5 }} />
                      <Typography variant="body2" color="text.secondary">
                        {selectedService.location}
                      </Typography>
                    </Box>
                  )}
                </Box>
                <Button 
                  size="small" 
                  onClick={(e) => viewServiceDetails(selectedService, e)}
                >
                  Details
                </Button>
              </Box>
              <Box sx={{ mt: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={() => handleServiceSelect(null)}
                  sx={{ mr: 1 }}
                >
                  Change
                </Button>
              </Box>
            </CardContent>
          </Card>
        ) : (
          <Button
            fullWidth
            variant="outlined"
            onClick={openServiceDialog}
            disabled={submitting || loading}
            sx={{ my: 1, py: 1.5, borderStyle: 'dashed' }}
          >
            {loading ? "Loading services..." : "Choose a service to manage"}
          </Button>
        )}
      </Box>

      {/* Service Selection Dialog */}
      <Dialog 
        open={serviceDialogOpen} 
        onClose={() => setServiceDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Select a Service
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Choose the service you want to manage
          </Typography>
          
          <TextField
            margin="dense"
            fullWidth
            placeholder="Search by name, category or location"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
          {loading ? (
            <ServiceListSkeleton />
          ) : filteredServices.length > 0 ? (
            <List 
              component="div"
              sx={{ maxHeight: '400px', overflow: 'auto', pt: 0 }}
              onScroll={onScroll}
            >
              {visibleServices.map((service) => (
                <React.Fragment key={service.id}>
                  <ListItemButton
                    onClick={() => {
                      handleServiceSelect(service);
                      setServiceDialogOpen(false);
                    }}
                  >
                    <ListItemIcon>
                      <CheckCircleOutlineIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={service.name}
                      secondary={
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                          {service.category && (
                            <Chip 
                              size="small" 
                              label={service.category} 
                              variant="outlined"
                              icon={<CategoryIcon fontSize="small" />}
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          )}
                          {service.location && (
                            <Chip 
                              size="small" 
                              label={service.location} 
                              variant="outlined"
                              icon={<LocationOnIcon fontSize="small" />}
                              sx={{ mb: 0.5 }}
                            />
                          )}
                        </Stack>
                      }
                    />
                    <Tooltip title="View details">
                      <IconButton
                        edge="end"
                        onClick={(e) => viewServiceDetails(service, e)}
                      >
                        <InfoOutlinedIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemButton>
                  <Divider component="li" />
                </React.Fragment>
              ))}
              {visibleStart + ITEMS_PER_PAGE < filteredServices.length && (
                <Box sx={{ textAlign: 'center', py: 1 }}>
                  <CircularProgress size={20} thickness={4} />
                </Box>
              )}
            </List>
          ) : (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                {searchQuery ? "No matching services found" : "No services available for registration"}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setServiceDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// Helper component for service list skeleton loading state
const ServiceListSkeleton = () => (
  <Stack spacing={1} sx={{ mt: 2 }}>
    {[...Array(5)].map((_, i) => (
      <Box key={i} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <CircularProgress size={24} sx={{ mr: 2 }} />
        <Box sx={{ width: '100%' }}>
          <Typography variant="body1" sx={{ bgcolor: '#f0f0f0', height: 24, width: '70%', borderRadius: 1 }}>&nbsp;</Typography>
          <Typography variant="body2" sx={{ bgcolor: '#f5f5f5', height: 20, width: '40%', borderRadius: 1, mt: 0.5 }}>&nbsp;</Typography>
        </Box>
      </Box>
    ))}
  </Stack>
);

export default ServiceSelector;