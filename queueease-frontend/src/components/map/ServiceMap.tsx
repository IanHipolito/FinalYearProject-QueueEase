import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Box, Chip, Typography, Paper, Button, CircularProgress } from '@mui/material';
import DirectionsIcon from '@mui/icons-material/Directions';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import CloseIcon from '@mui/icons-material/Close';
import { Service } from '../../types/serviceTypes';
import { createServicePopupContent, prepareGeoJSON, getServicePointLayer, getServiceSymbolLayer, addMapStyles } from './mapUtils';
import { DUBLIN_CENTER, DUBLIN_BOUNDS, MAPBOX_TOKEN } from '../../utils/mapUtils';

// Types
interface ServiceMapProps {
  services: Service[];
  selectedService: Service | null;
  onServiceClick: (service: Service) => void;
  height?: string;
  isMobile?: boolean;
}

interface UserLocation {
  latitude: number;
  longitude: number;
}

interface RouteInfo {
  distance: number;
  duration: number;
  geometry: any;
}

const ServiceMap: React.FC<ServiceMapProps> = ({
  services,
  selectedService,
  onServiceClick,
  height = '100%',
  isMobile = false
}) => {
  // Refs
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const isMapMovingRef = useRef<boolean>(false);
  const serviceMapRef = useRef<Map<number, Service>>(new Map());
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const routeLayerId = 'route';
  const userLayerId = 'user-location';

  // State
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [isDirectionsMode, setIsDirectionsMode] = useState(false);
  
  // Memoized data transform for better performance
  const serviceData = React.useMemo(() => prepareGeoJSON(services, selectedService?.id), 
    [services, selectedService?.id]);
    
  // Initialize service map
  useEffect(() => {
    const serviceMap = new Map<number, Service>();
    services.forEach(service => {
      serviceMap.set(service.id, service);
    });
    serviceMapRef.current = serviceMap;
  }, [services]);

  // Format distance for display
  const formatDistance = useCallback((meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    } else {
      return `${(meters / 1000).toFixed(1)}km`;
    }
  }, []);

  // Format duration for display
  const formatDuration = useCallback((seconds: number): string => {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}min`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}min`;
    }
  }, []);

  // Clear route data
  const clearRoute = useCallback(() => {
    if (!map.current) return;
    
    if (map.current.getLayer(routeLayerId)) {
      map.current.removeLayer(routeLayerId);
    }
    
    if (map.current.getSource(routeLayerId)) {
      map.current.removeSource(routeLayerId);
    }
    
    setRouteInfo(null);
    setIsDirectionsMode(false);
  }, []);

  // Get user's current location
  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        
        // Add or update user marker
        if (!map.current) return;
        
        // Create user location source if it doesn't exist
        if (!map.current.getSource(userLayerId)) {
          map.current.addSource(userLayerId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [longitude, latitude]
              },
              properties: {}
            }
          });
          
          // Add user location layer
          map.current.addLayer({
            id: userLayerId,
            source: userLayerId,
            type: 'circle',
            paint: {
              'circle-radius': 8,
              'circle-color': '#007bff',
              'circle-stroke-width': 3,
              'circle-stroke-color': '#ffffff',
              'circle-opacity': 0.9
            }
          });
          
          // Add pulsing effect
          map.current.addLayer({
            id: 'user-location-pulse',
            source: userLayerId,
            type: 'circle',
            paint: {
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['get', 'pulse'],
                0, 8,
                1, 16
              ],
              'circle-color': '#007bff',
              'circle-opacity': [
                'interpolate',
                ['linear'],
                ['get', 'pulse'],
                0, 0.5,
                1, 0
              ],
              'circle-stroke-width': 0
            }
          });
        } else {
          // Update existing source
          const source = map.current.getSource(userLayerId) as mapboxgl.GeoJSONSource;
          source.setData({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [longitude, latitude]
            },
            properties: {}
          });
        }
        
        // Fly to user location
        map.current.flyTo({
          center: [longitude, latitude],
          zoom: 14,
          essential: true
        });
      },
      (error) => {
        console.error('Error getting location:', error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  }, []);

  // Calculate route between two points
  const getRoute = useCallback(async (start: [number, number], end: [number, number]) => {
    if (!map.current || !userLocation) return;
    
    setIsLoadingRoute(true);
    try {
      const query = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/walking/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${MAPBOX_TOKEN}`
      );
      
      const json = await query.json();
      if (!json.routes || json.routes.length === 0) {
        throw new Error('No route found');
      }
      
      const route = json.routes[0];
      const { distance, duration, geometry } = route;
      
      setRouteInfo({
        distance,
        duration,
        geometry
      });
      
      // Add the route to the map
      if (map.current.getLayer(routeLayerId)) {
        map.current.removeLayer(routeLayerId);
      }
      
      if (map.current.getSource(routeLayerId)) {
        map.current.removeSource(routeLayerId);
      }
      
      map.current.addSource(routeLayerId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: geometry
        }
      });
      
      map.current.addLayer({
        id: routeLayerId,
        type: 'line',
        source: routeLayerId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#6f42c1',
          'line-width': 5,
          'line-opacity': 0.8
        }
      });
      
      // Adjust map view to show route
      const coordinates = geometry.coordinates;
      const bounds = coordinates.reduce((bounds: mapboxgl.LngLatBounds, coord: [number, number]) => {
        return bounds.extend(coord);
      }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));
      
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15,
        duration: 1000
      });
    } catch (error) {
      console.error('Error calculating route:', error);
    } finally {
      setIsLoadingRoute(false);
    }
  }, [userLocation]);

  // Show directions to selected service
  const showDirections = useCallback(() => {
    if (!userLocation || !selectedService || !map.current) return;
    
    setIsDirectionsMode(true);
    
    const start: [number, number] = [userLocation.longitude, userLocation.latitude];
    const end: [number, number] = [selectedService.longitude, selectedService.latitude];
    
    getRoute(start, end);
  }, [userLocation, selectedService, getRoute]);

  // Calculate distance between two points (haversine formula)
  const calculateDistance = useCallback((
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in meters
  }, []);
  
  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const throttledUpdateData = () => {
      if (isMapMovingRef.current) return;
      updateMapData();
    };

    const initMap = () => {
      try {
        mapboxgl.accessToken = MAPBOX_TOKEN;

        const newMap = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: DUBLIN_CENTER,
          zoom: isMobile ? 11 : 12,
          minZoom: 10,
          maxZoom: 18,
          attributionControl: false,
          antialias: true,
          fadeDuration: 100,
          renderWorldCopies: false,
          maxBounds: [
            [DUBLIN_BOUNDS.west - 0.1, DUBLIN_BOUNDS.south - 0.1],
            [DUBLIN_BOUNDS.east + 0.1, DUBLIN_BOUNDS.north + 0.1]
          ],
          trackResize: true,
          pitchWithRotate: false,
          logoPosition: 'bottom-left'
        });

        map.current = newMap;
        
        // Add controls
        newMap.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left');
        newMap.addControl(
          new mapboxgl.NavigationControl({
            showCompass: false,
            visualizePitch: false
          }),
          'bottom-right'
        );

        // Add geolocate control
        const geolocateControl = new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
          showUserHeading: true
        });
        
        newMap.addControl(geolocateControl, 'bottom-right');
        
        // Create popup
        popupRef.current = new mapboxgl.Popup({
          closeButton: true,
          closeOnClick: true,
          maxWidth: '300px',
          className: 'queueease-popup',
          offset: 15
        });

        // Setup event handlers with performance optimizations
        let moveEndTimeout: NodeJS.Timeout;
        
        newMap.on('movestart', () => {
          isMapMovingRef.current = true;
          clearTimeout(moveEndTimeout);
        });

        newMap.on('moveend', () => {
          clearTimeout(moveEndTimeout);
          moveEndTimeout = setTimeout(() => {
            isMapMovingRef.current = false;
            throttledUpdateData();
          }, 100);
        });

        newMap.on('load', () => {
          const styleElement = addMapStyles();
          initializeMapLayers();
          
          // Try to get user's location after map loads
          getUserLocation();
        });
      } catch (err) {
        console.error('Error initializing map:', err);
      }
    };

    const initializeMapLayers = () => {
      if (!map.current) return;

      // Add source for services
      map.current.addSource('services', {
        type: 'geojson',
        data: serviceData,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 60,
        generateId: true,
        maxzoom: 17,
        buffer: 128,
        tolerance: 0.5
      });

      // Add clustering layers
      map.current.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'services',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#8551d9', // theme.palette.primary.light
            20, '#6f42c1', // theme.palette.primary.main
            100, '#5e35b1' // theme.palette.primary.dark
          ],
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'point_count'],
            3, 20,
            10, 25,
            50, 35,
            100, 40
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': 'white',
          'circle-opacity': 0.9
        }
      });

      map.current.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'services',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-size': 12,
          'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
          'text-allow-overlap': true
        },
        paint: {
          'text-color': 'white'
        }
      });

      // Add individual service layers
      map.current.addLayer(getServicePointLayer(selectedService));
      map.current.addLayer(getServiceSymbolLayer());

      // Handle clicks on clusters
      map.current.on('click', 'clusters', (e) => {
        if (!map.current || !e.features || e.features.length === 0) return;

        const feature = e.features[0];
        const clusterId = feature.properties?.cluster_id;
        if (!clusterId) return;

        const source = map.current.getSource('services') as mapboxgl.GeoJSONSource;
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err || !map.current) return;

          const coordinates = (feature.geometry as any).coordinates.slice() as [number, number];
          map.current.easeTo({
            center: coordinates,
            zoom: Math.min((zoom || 0) + 1, 17),
            duration: 500
          });
        });
      });

      // Handle clicks on individual points
      map.current.on('click', 'service-points', (e) => {
        if (!e.features || e.features.length === 0) return;

        const feature = e.features[0];
        const serviceId = feature.properties?.id;
        if (!serviceId) return;

        const service = serviceMapRef.current.get(Number(serviceId));
        if (service) {
          // Clear any existing route when selecting a new service
          clearRoute();
          onServiceClick(service);
        }
      });

      // Change cursor on hover
      map.current.on('mouseenter', 'service-points', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });

      map.current.on('mouseleave', 'service-points', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });

      map.current.on('mouseenter', 'clusters', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });

      map.current.on('mouseleave', 'clusters', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
    };

    initMap();

    return () => {
      if (popupRef.current) popupRef.current.remove();
      if (markerRef.current) markerRef.current.remove();
      if (map.current) map.current.remove();
      map.current = null;
    };
  }, [isMobile, serviceData, getUserLocation, clearRoute]);

  const updateMapData = useCallback(() => {
    if (!map.current) return;
    if (isMapMovingRef.current) return;

    const source = map.current.getSource('services') as mapboxgl.GeoJSONSource;
    if (!source) return;

    source.setData(serviceData);

    if (map.current.getLayer('service-points')) {
      map.current.setPaintProperty(
        'service-points',
        'circle-stroke-width',
        [
          'case',
          ['==', ['get', 'id'], ['literal', selectedService ? selectedService.id : -1]],
          3,
          1.5
        ]
      );
    }
  }, [serviceData, selectedService]);

  // Update map when services or selected service changes
  useEffect(() => {
    if (!map.current) return;
    updateMapData();

    // Show popup for selected service
    if (selectedService) {
      if (!popupRef.current) {
        popupRef.current = new mapboxgl.Popup({
          closeButton: true,
          closeOnClick: false,
          maxWidth: '300px',
          offset: 15
        });
      } else {
        popupRef.current.remove();
      }

      // Create enhanced popup content with distance if user location is available
      let popupContent = createServicePopupContent(selectedService);
      
      if (userLocation) {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          selectedService.latitude,
          selectedService.longitude
        );
        
        const distanceStr = formatDistance(distance);
        
        // Inject distance information into popup
        popupContent = popupContent.replace(
          '</div>',
          `<div style="margin-top: 8px; padding: 4px 8px; background-color: #f0f0f0; border-radius: 4px; display: inline-block;">
            <strong>Distance:</strong> ${distanceStr}
          </div></div>`
        );
      }

      popupRef.current
        .setLngLat([selectedService.longitude, selectedService.latitude])
        .setHTML(popupContent)
        .addTo(map.current);

      map.current.flyTo({
        center: [selectedService.longitude, selectedService.latitude],
        zoom: Math.max(map.current.getZoom(), 14),
        duration: 500,
        essential: true
      });

      // Clear any existing route when selecting a new service
      clearRoute();
    }
  }, [services, selectedService, userLocation, calculateDistance, formatDistance, clearRoute, updateMapData]);

  return (
    <Box
      sx={{
        height,
        width: '100%',
        position: 'relative',
        '& .mapboxgl-canvas': {
          outline: 'none'
        }
      }}
    >
      {/* Map Container */}
      <Box
        ref={mapContainer}
        sx={{
          height: '100%',
          width: '100%',
          position: 'relative',
          '& .mapboxgl-popup-content': {
            padding: '16px',
            borderRadius: '8px'
          }
        }}
      />
      
      {/* User Location Button */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 10
        }}
      >
        <Button
          variant="contained"
          size="small"
          onClick={getUserLocation}
          sx={{
            minWidth: '40px',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'white',
            color: '#6f42c1',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            '&:hover': {
              backgroundColor: '#f5f5f5'
            }
          }}
        >
          <MyLocationIcon />
        </Button>
      </Box>
      
      {/* Selected Service Actions */}
      {selectedService && userLocation && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            width: '90%',
            maxWidth: '400px'
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                {selectedService.name}
              </Typography>
              
              <Chip
                size="small"
                label={formatDistance(
                  calculateDistance(
                    userLocation.latitude,
                    userLocation.longitude,
                    selectedService.latitude,
                    selectedService.longitude
                  )
                )}
                color="primary"
              />
            </Box>
            
            {isDirectionsMode && routeInfo ? (
              <Box sx={{ mt: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">
                    Distance: <strong>{formatDistance(routeInfo.distance)}</strong>
                  </Typography>
                  <Typography variant="body2">
                    ETA: <strong>{formatDuration(routeInfo.duration)}</strong>
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  fullWidth
                  size="small"
                  onClick={clearRoute}
                  startIcon={<CloseIcon />}
                >
                  Close Directions
                </Button>
              </Box>
            ) : (
              <Button
                variant="contained"
                fullWidth
                size="small"
                onClick={showDirections}
                disabled={isLoadingRoute}
                startIcon={isLoadingRoute ? <CircularProgress size={16} color="inherit" /> : <DirectionsIcon />}
                sx={{
                  backgroundColor: '#6f42c1',
                  '&:hover': {
                    backgroundColor: '#8551d9'
                  }
                }}
              >
                {isLoadingRoute ? 'Loading Route...' : 'Get Directions'}
              </Button>
            )}
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default ServiceMap;