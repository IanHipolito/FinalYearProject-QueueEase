import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Chip,
  Divider,
  Tabs,
  Tab,
  CircularProgress,
  IconButton
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PeopleIcon from '@mui/icons-material/People';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { Service } from '../../types/serviceTypes';
import { getCategoryIcon } from '../map/mapUtils';
import { getCategoryColor } from '../../utils/mapUtils';

interface ServiceDetailProps {
  service: Service | null;
  onClose: () => void;
  onJoinQueue: (serviceId: number) => void;
  userLocation: { latitude: number; longitude: number } | null;
}

interface RouteInfo {
  type: 'walking' | 'driving' | 'cycling';
  distance: string;
  duration: string;
  loading: boolean;
}

const ServiceDetailPanel: React.FC<ServiceDetailProps> = ({
  service,
  onClose,
  onJoinQueue,
  userLocation
}) => {
  const [activeTab, setActiveTab] = useState<'walking' | 'driving' | 'cycling'>('walking');
  const [routeInfo, setRouteInfo] = useState<Record<string, RouteInfo>>({
    walking: { type: 'walking', distance: '', duration: '', loading: false },
    driving: { type: 'driving', distance: '', duration: '', loading: false },
    cycling: { type: 'cycling', distance: '', duration: '', loading: false }
  });
  
  useEffect(() => {
    if (!service || !userLocation) return;
    
    const getDirectionsInfo = async (mode: 'walking' | 'driving' | 'cycling') => {
      if (!userLocation || !service) return;
      
      setRouteInfo(prev => ({
        ...prev,
        [mode]: { ...prev[mode], loading: true }
      }));
      
      try {
        const profile = mode === 'walking' ? 'walking' : mode === 'cycling' ? 'cycling' : 'driving';
        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/${profile}/` +
          `${userLocation.longitude},${userLocation.latitude};` +
          `${service.longitude},${service.latitude}` +
          `?steps=true&geometries=geojson&access_token=${process.env.REACT_APP_MAPBOX_ACCESS_TOKEN}`
        );
        
        const data = await response.json();
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const distance = formatDistance(route.distance);
          const duration = formatDuration(route.duration);
          
          setRouteInfo(prev => ({
            ...prev,
            [mode]: { 
              ...prev[mode], 
              distance, 
              duration, 
              loading: false 
            }
          }));
        }
      } catch (error) {
        console.error(`Error fetching ${mode} directions:`, error);
        setRouteInfo(prev => ({
          ...prev,
          [mode]: { 
            ...prev[mode], 
            loading: false 
          }
        }));
      }
    };
    
    getDirectionsInfo('walking');
    getDirectionsInfo('driving');
    getDirectionsInfo('cycling');
  }, [service, userLocation]);
  
  if (!service) return null;
  
  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    } else {
      return `${(meters / 1000).toFixed(1)}km`;
    }
  };
  
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}min`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}min`;
    }
  };
  
  const handleGetDirections = (mode: 'walking' | 'driving' | 'cycling') => {
    const profile = mode === 'walking' ? 'walking' : mode === 'cycling' ? 'cycling' : 'driving';
    const url = `https://www.google.com/maps/dir/?api=1&destination=${service.latitude},${service.longitude}&travelmode=${profile}`;
    window.open(url, '_blank');
  };
  
  return (
    <Paper
      elevation={2}
      sx={{
        position: 'absolute',
        right: 10,
        top: 70,
        width: { xs: 'calc(100% - 20px)', sm: 320 },
        maxHeight: 'calc(70vh)',
        overflow: 'auto',
        zIndex: 10,
        borderRadius: 2,
        boxShadow: '0 2px 10px rgba(0,0,0,0.12)'
      }}
    >
      <IconButton 
        sx={{ 
          position: 'absolute', 
          right: 4, 
          top: 4, 
          bgcolor: 'rgba(255,255,255,0.8)',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.95)' },
          zIndex: 2,
          padding: 0.5
        }}
        size="small"
        onClick={onClose}
        aria-label="close"
      >
        <CloseIcon fontSize="small" />
      </IconButton>

      <Box sx={{ height: 4, bgcolor: getCategoryColor(service.category || 'default') }} />

      <Box sx={{ p: 2 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          {service.name}
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1.5 }}>
          <Chip
            icon={getCategoryIcon(service.category || 'default')}
            label={service.category}
            size="small"
            sx={{ borderRadius: 1.5, height: 24 }}
          />

          {service.wait_time && service.wait_time > 0 && (
            <Chip
              icon={<AccessTimeIcon fontSize="small" />}
              label={`${service.wait_time} min`}
              size="small"
              color={service.wait_time > 30 ? "error" : "success"}
              sx={{ borderRadius: 1.5, height: 24 }}
            />
          )}

          {service.queue_length && service.queue_length > 0 && (
            <Chip
              icon={<PeopleIcon fontSize="small" />}
              label={`${service.queue_length} in queue`}
              size="small"
              color={service.queue_length > 10 ? "error" : "success"}
              sx={{ borderRadius: 1.5, height: 24 }}
            />
          )}
        </Box>

        <Typography variant="body2" sx={{ mb: 2 }}>
          {service.description || "No description provided for this service."}
        </Typography>

        <Divider sx={{ my: 1.5 }} />
        
        {userLocation && (
          <>
            <Typography variant="subtitle2" fontWeight={600} mb={1}>
              Directions
            </Typography>
            
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              variant="fullWidth"
              sx={{ 
                mb: 1.5, 
                minHeight: 36,
                '& .MuiTab-root': { 
                  minWidth: 'auto',
                  minHeight: 36,
                  py: 0.5 
                } 
              }}
            >
              <Tab 
                icon={<DirectionsWalkIcon fontSize="small" />} 
                value="walking" 
                label="Walk" 
                iconPosition="start"
              />
              <Tab 
                icon={<DirectionsCarIcon fontSize="small" />} 
                value="driving" 
                label="Drive"
                iconPosition="start"
              />
              <Tab 
                icon={<DirectionsBikeIcon fontSize="small" />} 
                value="cycling" 
                label="Bike"
                iconPosition="start"
              />
            </Tabs>
            
            <Box sx={{ p: 1.5, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 1.5, mb: 2 }}>
              {routeInfo[activeTab].loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                  <CircularProgress size={20} />
                </Box>
              ) : (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">
                      Distance: <strong>{routeInfo[activeTab].distance || 'N/A'}</strong>
                    </Typography>
                    <Typography variant="body2">
                      ETA: <strong>{routeInfo[activeTab].duration || 'N/A'}</strong>
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    fullWidth
                    size="small"
                    onClick={() => handleGetDirections(activeTab)}
                    startIcon={activeTab === 'walking' ? <DirectionsWalkIcon /> : 
                               activeTab === 'cycling' ? <DirectionsBikeIcon /> : 
                               <DirectionsCarIcon />}
                  >
                    Get Directions
                  </Button>
                </>
              )}
            </Box>
          </>
        )}

        <Button
          variant="contained"
          fullWidth
          startIcon={<AddIcon />}
          size="medium"
          sx={{ 
            borderRadius: 2,
            py: 0.75,
            bgcolor: '#6f42c1',
            '&:hover': {
              bgcolor: '#5e35b1',
            }
          }}
          onClick={() => onJoinQueue(service.id)}
        >
          {service.service_type === 'appointment' ? 'Book Appointment' : 'Join Queue'}
        </Button>
      </Box>
    </Paper>
  );
};

export default ServiceDetailPanel;