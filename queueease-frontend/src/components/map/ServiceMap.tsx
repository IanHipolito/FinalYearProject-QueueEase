import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Box, Button, CircularProgress } from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { Service, ServiceMapProps } from 'types/serviceTypes';
import { prepareGeoJSON, getServicePointLayer, getServiceSymbolLayer, addMapStyles } from './mapUtils';
import { DUBLIN_CENTER, DUBLIN_BOUNDS, MAPBOX_TOKEN } from 'utils/mapUtils';
import * as turf from '@turf/turf';
import throttle from 'lodash/throttle';
import debounce from 'lodash/debounce';

const USER_LAYER_ID = 'user-location';
const USER_RADIUS_LAYER_ID = 'user-radius';
const USER_RADIUS_OUTLINE_ID = 'user-radius-outline';
const USER_PULSE_LAYER_ID = 'user-location-pulse';

const ServiceMap: React.FC<ServiceMapProps> = ({
  services,
  selectedService,
  onServiceClick,
  height = '100%',
  isMobile = false,
  maxDistance = 10,
  userLocation,
  onUserLocationChange
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const serviceMapRef = useRef<Map<number, Service>>(new Map());
  const isMapMovingRef = useRef<boolean>(false);
  const layersInitializedRef = useRef<boolean>(false);
  const mapStyleLoadedRef = useRef<boolean>(false);
  const userLocationPulseRadiusRef = useRef<number>(15);
  const animationFrameRef = useRef<number | null>(null);
  const pendingUpdatesRef = useRef<(() => void)[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  
  // Recreate service map when services change
  useEffect(() => {
    const serviceMap = new Map<number, Service>();
    services.forEach(service => {
      serviceMap.set(service.id, service);
    });
    serviceMapRef.current = serviceMap;
  }, [services]);
  
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
  
  // Memoized data transform with distance filtering
  const serviceData = useMemo(() => {
    let filteredServices = services;
    
    // Filter services by distance if user location is available
    if (userLocation && maxDistance > 0) {
      filteredServices = services.filter(service => {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          service.latitude,
          service.longitude
        );
        // Convert distance to kilometers and compare with maxDistance
        return distance / 1000 <= maxDistance;
      });
    }
    
    return prepareGeoJSON(filteredServices, selectedService?.id);
  }, [services, selectedService?.id, userLocation, maxDistance, calculateDistance]);
  
  // Helper function to ensure map is ready for operations
  const ensureMapIsReady = useCallback((callback: () => void) => {
    if (!map.current) {
      pendingUpdatesRef.current.push(callback);
      return;
    }
    
    if (mapStyleLoadedRef.current) {
      callback();
    } else {
      pendingUpdatesRef.current.push(callback);
    }
  }, []);
  
  // Process all pending updates
  const processPendingUpdates = useCallback(() => {
    const updates = [...pendingUpdatesRef.current];
    pendingUpdatesRef.current = [];
    
    for (const update of updates) {
      try {
        update();
      } catch (error) {
        console.error('Error processing pending update:', error);
      }
    }
  }, []);
  
  // Update map data with debounce
  const updateMapData = useMemo(() => 
    debounce(() => {
      if (!map.current || !mapStyleLoadedRef.current) return;
      if (isMapMovingRef.current) return;

      try {
        const source = map.current.getSource('services') as mapboxgl.GeoJSONSource;
        if (!source) return;

        // Batch update - only one repaint
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
      } catch (error) {
        console.error('Error updating map data:', error);
      }
    }, 150), 
  [serviceData, selectedService]);
  
  // Update user location marker and radius circle on map
  const updateUserLocationOnMap = useCallback((latitude: number, longitude: number, radiusKm: number) => {
    if (!map.current || !mapStyleLoadedRef.current) return;
    
    try {
      // Create user location marker
      const userLocationData = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        properties: {}
      };
      
      // Create radius circle with turf.js
      const radiusInKm = radiusKm;
      const options = { steps: 64, units: 'kilometers' as const };
      const circle = turf.circle([longitude, latitude], radiusInKm, options);
      
      // Add or update user location source
      if (map.current.getSource(USER_LAYER_ID)) {
        // Update existing source 
        const source = map.current.getSource(USER_LAYER_ID) as mapboxgl.GeoJSONSource;
        if (source) {
          source.setData(userLocationData as any);
        }
      } else {
        // Create new source and layers
        map.current.addSource(USER_LAYER_ID, {
          type: 'geojson',
          data: userLocationData as any
        });
        
        // User location dot with higher z-index
        map.current.addLayer({
          id: USER_LAYER_ID,
          source: USER_LAYER_ID,
          type: 'circle',
          paint: {
            'circle-radius': 8,
            'circle-color': '#FF0000',
            'circle-stroke-width': 3,
            'circle-stroke-color': '#ffffff',
            'circle-opacity': 1
          }
        });
        
        // Pulsating effect layer
        map.current.addLayer({
          id: USER_PULSE_LAYER_ID,
          source: USER_LAYER_ID,
          type: 'circle',
          paint: {
            'circle-radius': 15,
            'circle-color': '#FF0000',
            'circle-opacity': 0.4,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#FF0000',
            'circle-stroke-opacity': 0.3
          }
        });
        
        // Set up pulse animation using RAF
        const animatePulse = () => {
          if (!map.current || !mapStyleLoadedRef.current) return;
          
          // Update pulse radius for animation
          userLocationPulseRadiusRef.current = 15 + 5 * Math.sin(Date.now() / 500);
          
          if (map.current.getLayer(USER_PULSE_LAYER_ID)) {
            map.current.setPaintProperty(
              USER_PULSE_LAYER_ID,
              'circle-radius',
              userLocationPulseRadiusRef.current
            );
          }
          
          animationFrameRef.current = requestAnimationFrame(animatePulse);
        };
        
        // Start animation
        animationFrameRef.current = requestAnimationFrame(animatePulse);
      }
      
      // Update or create radius circle
      if (map.current.getSource(USER_RADIUS_LAYER_ID)) {
        // Update existing source
        const radiusSource = map.current.getSource(USER_RADIUS_LAYER_ID) as mapboxgl.GeoJSONSource;
        if (radiusSource) {
          radiusSource.setData(circle as any);
        }
      } else {
        // Create new source and layers
        map.current.addSource(USER_RADIUS_LAYER_ID, {
          type: 'geojson',
          data: circle as any
        });
        
        // Add radius layer first checking if service-points exists
        const beforeLayerId = map.current.getLayer('service-points') ? 'service-points' : undefined;
        
        // Add radius layer
        map.current.addLayer({
          id: USER_RADIUS_LAYER_ID,
          source: USER_RADIUS_LAYER_ID,
          type: 'fill',
          paint: {
            'fill-color': '#FF0000',
            'fill-opacity': 0.15,
            'fill-outline-color': '#FF0000'
          }
        }, beforeLayerId);
        
        // Add radius outline with more visible styling
        map.current.addLayer({
          id: USER_RADIUS_OUTLINE_ID,
          source: USER_RADIUS_LAYER_ID,
          type: 'line',
          paint: {
            'line-color': '#FF0000',
            'line-width': 2.5,
            'line-opacity': 0.7,
            'line-dasharray': [3, 3]
          }
        }, beforeLayerId);
      }
    } catch (error) {
      console.error('Error updating user location on map:', error);
    }
  }, []);
  
  // Get user's current location
  const getUserLocation = useCallback(() => {
    setIsLoading(true);
    
    // First attempt to directly update user location without geolocation API
    if (userLocation) {
      try {
        if (map.current) {
          // Update user location on map directly
          ensureMapIsReady(() => {
            updateUserLocationOnMap(userLocation.latitude, userLocation.longitude, maxDistance);
            
            // Fly to user location
            if (map.current) {
              map.current.flyTo({
                center: [userLocation.longitude, userLocation.latitude],
                zoom: 14,
                essential: true
              });
            }
          });
          
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error using existing user location:', error);
      }
    }
    
    // If no existing location or update failed, use Geolocation API
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by your browser');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Update parent component with new location
          onUserLocationChange({ latitude, longitude });
          
          if (map.current) {
            // Force update user location on map
            ensureMapIsReady(() => {
              updateUserLocationOnMap(latitude, longitude, maxDistance);
              
              // Fly to user location
              if (map.current) {
                map.current.flyTo({
                  center: [longitude, latitude],
                  zoom: 14,
                  essential: true
                });
              }
              
              // Also update the data source
              updateMapData();
            });
          }
        } catch (error) {
          console.error('Error processing user location:', error);
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        // Geolocation errors
        let errorMsg = 'Unknown error getting location';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'User denied the request for geolocation';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            errorMsg = 'The request to get user location timed out';
            break;
        }
        
        console.error('Geolocation error:', errorMsg);
        setIsLoading(false);
        
        // Use Dublin center as fallback
        const dublinCenter = { 
          latitude: DUBLIN_CENTER[1], 
          longitude: DUBLIN_CENTER[0] 
        };
        onUserLocationChange(dublinCenter);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, [maxDistance, onUserLocationChange, updateUserLocationOnMap, updateMapData, userLocation, ensureMapIsReady]);
  
  // Initialize map layers
  const initializeMapLayers = useCallback(() => {
    if (!map.current || !mapStyleLoadedRef.current || layersInitializedRef.current) return;
    
    try {
      // Add source for services with optimized params
      map.current.addSource('services', {
        type: 'geojson',
        data: serviceData,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
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
            '#8551d9',
            20, '#6f42c1',
            100, '#5e35b1'
          ],
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'point_count'],
            3, 18,
            10, 22,
            50, 30,
            100, 35
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': 'white',
          'circle-opacity': 0.85
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
      const servicePointLayer = getServicePointLayer(selectedService);
      
      if (!servicePointLayer.paint) {
        servicePointLayer.paint = {};
      }
      
      // Optimize radius rendering based on zoom level
      servicePointLayer.paint['circle-radius'] = [
        'interpolate',
        ['linear'],
        ['zoom'],
        10, 5,
        14, 9,
        16, 12
      ];
      
      servicePointLayer.paint['circle-opacity'] = 0.85;
      
      // Service points layer
      map.current.addLayer(servicePointLayer);
      map.current.addLayer(getServiceSymbolLayer());

      // Add user location if available
      if (userLocation) {
        updateUserLocationOnMap(userLocation.latitude, userLocation.longitude, maxDistance);
      }
      
      // Set up event listeners for interactions with the map
      setupMapEventListeners();
      
      // Mark layers as initialized
      layersInitializedRef.current = true;
    } catch (error) {
      console.error('Error initializing map layers:', error);
    }
  }, [serviceData, maxDistance, selectedService, userLocation, updateUserLocationOnMap]);

  // Create a separate function for event listeners
  const setupMapEventListeners = useCallback(() => {
    if (!map.current) return;

    // Handle clicks on clusters with throttle
    map.current.on('click', 'clusters', throttle((e) => {
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
    }, 200));

    // Handle clicks on individual points
    map.current.on('click', 'service-points', throttle((e) => {
      if (!e.features || e.features.length === 0) return;

      const feature = e.features[0];
      const serviceId = feature.properties?.id;
      if (!serviceId) return;

      const service = serviceMapRef.current.get(Number(serviceId));
      if (service) {
        onServiceClick(service);
      }
    }, 200));

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
  }, [onServiceClick]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const initMap = () => {
      try {
        mapboxgl.accessToken = MAPBOX_TOKEN;

        const newMap = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/light-v11',
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
          logoPosition: 'bottom-left',
          preserveDrawingBuffer: false,
          refreshExpiredTiles: false,
          failIfMajorPerformanceCaveat: true
        });
        map.current = newMap;
        
        // Controls minimized for less clutter
        newMap.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left');
        newMap.addControl(
          new mapboxgl.NavigationControl({
            showCompass: false,
            visualizePitch: false
          }),
          'bottom-right'
        );
        
        // Setup event handlers with throttling/debouncing
        const throttledMapUpdate = throttle(() => {
          isMapMovingRef.current = true;
        }, 100);
        
        const debouncedMapEnded = debounce(() => {
          isMapMovingRef.current = false;
          updateMapData();
        }, 150);

        newMap.on('movestart', throttledMapUpdate);
        newMap.on('moveend', debouncedMapEnded);

        // Optimize zoom level handling
        newMap.on('zoom', throttle(() => {
          if (map.current && userLocation && map.current.getLayer(USER_RADIUS_LAYER_ID)) {
            // Opacity of the circle based on zoom level for better visibility
            const currentZoom = map.current.getZoom();
            const opacity = Math.max(0.03, Math.min(0.12, 0.12 - (currentZoom - 12) * 0.01));
            
            map.current.setPaintProperty(
              USER_RADIUS_LAYER_ID,
              'fill-opacity',
              opacity
            );
          }
        }, 100));

        newMap.on('style.load', () => {
          console.log('Map style loaded successfully');
          mapStyleLoadedRef.current = true;
          addMapStyles();
          
          // Initialize map layers once style is loaded
          initializeMapLayers();
          
          // Process any pending updates
          processPendingUpdates();
          
          // If user location is already set, update it on the map
          if (userLocation) {
            updateUserLocationOnMap(userLocation.latitude, userLocation.longitude, maxDistance);
          } else {
            // Try to get user's location after map loads
            getUserLocation();
          }
        });
        
        // Check if style is already loaded
        if (newMap.isStyleLoaded()) {
          console.log('Map style already loaded');
          mapStyleLoadedRef.current = true;
          addMapStyles();
          initializeMapLayers();
          
          // Process any pending updates
          processPendingUpdates();
          
          // If user location is already set, update it on the map
          if (userLocation) {
            updateUserLocationOnMap(userLocation.latitude, userLocation.longitude, maxDistance);
          } else {
            // Try to get user's location after map loads
            getUserLocation();
          }
        }
      } catch (err) {
        console.error('Error initializing map:', err);
      }
    };

    initMap();

    return () => {
      // Cancel animation frame
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // Clear all debounced/throttled functions
      updateMapData.cancel();
      
      // Remove map
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      
      // Reset refs
      layersInitializedRef.current = false;
      mapStyleLoadedRef.current = false;
    };
  }, [
    isMobile, 
    updateUserLocationOnMap, 
    maxDistance, 
    userLocation, 
    getUserLocation, 
    initializeMapLayers, 
    updateMapData,
    processPendingUpdates
  ]);

  // Update map when radius or user location changes
  useEffect(() => {
    if (!userLocation) return;
    if (!map.current) return;
    
    ensureMapIsReady(() => {
      updateUserLocationOnMap(userLocation.latitude, userLocation.longitude, maxDistance);
      updateMapData();
    });
  }, [maxDistance, userLocation, updateUserLocationOnMap, updateMapData, ensureMapIsReady]);

  // Update map when selected service changes
  useEffect(() => {
    if (!map.current || !selectedService) return;
    
    ensureMapIsReady(() => {
      updateMapData();
      
      // Fly to selected service
      if (map.current) {
        map.current.flyTo({
          center: [selectedService.longitude, selectedService.latitude],
          zoom: Math.max(map.current.getZoom(), 14),
          duration: 500,
          essential: true
        });
      }
    });
  }, [selectedService, updateMapData, ensureMapIsReady]);

  return (
    <Box
      sx={{
        height,
        width: '100%',
        position: 'relative',
        '& .mapboxgl-canvas': {
          outline: 'none',
          willChange: 'transform',
        }
      }}
    >
      {/* Map Container */}
      <Box
        ref={mapContainer}
        sx={{
          height: '100%',
          width: '100%',
          position: 'relative'
        }}
      />
      
      {/* User Location Button */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 100,
          right: 16,
          zIndex: 10
        }}
      >
        <Button
          variant="contained"
          size="small"
          onClick={getUserLocation}
          disabled={isLoading}
          title="Find my location"
          sx={{
            minWidth: '44px',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: isLoading ? '#f0f0f0' : 'white',
            color: '#FF0000',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            '&:hover': {
              backgroundColor: '#f5f5f5'
            },
            transition: 'transform 0.2s ease',
            '&:active': {
              transform: 'scale(0.95)'
            }
          }}
        >
          {isLoading ? (
            <CircularProgress size={24} color="error" /> 
          ) : (
            <MyLocationIcon fontSize="medium" />
          )}
        </Button>
      </Box>
    </Box>
  );
};

export default React.memo(ServiceMap);