import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Box, Button, CircularProgress } from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { Service } from '../../types/serviceTypes';
import { prepareGeoJSON, getServicePointLayer, getServiceSymbolLayer, addMapStyles } from './mapUtils';
import { DUBLIN_CENTER, DUBLIN_BOUNDS, MAPBOX_TOKEN } from '../../utils/mapUtils';

// Types
interface ServiceMapProps {
  services: Service[];
  selectedService: Service | null;
  onServiceClick: (service: Service) => void;
  height?: string;
  isMobile?: boolean;
  maxDistance?: number;
  userLocation: { latitude: number; longitude: number } | null;
  onUserLocationChange: (location: { latitude: number; longitude: number } | null) => void;
}

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
  const userLayerId = 'user-location';
  const userRadiusLayerId = 'user-radius';
  const userRadiusOutlineId = 'user-radius-outline';

  const [isLoading, setIsLoading] = useState(false);
  
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
  const serviceData = React.useMemo(() => {
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
  
  // Initialize service map
  useEffect(() => {
    const serviceMap = new Map<number, Service>();
    services.forEach(service => {
      serviceMap.set(service.id, service);
    });
    serviceMapRef.current = serviceMap;
  }, [services]);
  
  // Get user's current location
  const getUserLocation = useCallback(() => {
    setIsLoading(true);
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by your browser');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onUserLocationChange({ latitude, longitude });
        
        // Add or update user location and radius on map
        updateUserLocationOnMap(latitude, longitude, maxDistance);
        
        // Fly to user location
        if (map.current) {
          map.current.flyTo({
            center: [longitude, latitude],
            zoom: 14,
            essential: true
          });
        }
        
        setIsLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error.message);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  }, [maxDistance, onUserLocationChange]);
  
  // Update user location marker and radius circle on map
  const updateUserLocationOnMap = useCallback((latitude: number, longitude: number, radiusKm: number) => {
    if (!map.current) return;
    
    // Check if the map style is fully loaded
    if (!map.current.isStyleLoaded()) {
      // If not loaded, wait for it to load
      map.current.once('style.load', () => {
        updateUserLocationOnMap(latitude, longitude, radiusKm);
      });
      return;
    }
    
    // Create user location marker
    const userLocationData = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [longitude, latitude]
      },
      properties: {}
    };
    
    // Create radius circle
    const radiusInMeters = radiusKm * 1000;
    const steps = 48; // Reduced for better performance
    const circle = {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[]]
      },
      properties: {}
    };
    
    // Generate circle polygon points
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * 2 * Math.PI;
      const lng = longitude + (radiusInMeters / 111320 * Math.cos(angle)) * Math.cos(latitude * Math.PI / 180);
      const lat = latitude + (radiusInMeters / 111320 * Math.sin(angle));
      (circle.geometry as any).coordinates[0].push([lng, lat]);
    }
    // Close the polygon
    (circle.geometry as any).coordinates[0].push((circle.geometry as any).coordinates[0][0]);
    
    // Add or update user location source
    if (!map.current.getSource(userLayerId)) {
      map.current.addSource(userLayerId, {
        type: 'geojson',
        data: userLocationData as any
      });
      
      // Add user location layer
      map.current.addLayer({
        id: userLayerId,
        source: userLayerId,
        type: 'circle',
        paint: {
          'circle-radius': 7,
          'circle-color': '#6f42c1',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.9
        }
      });
    } else {
      // Update existing source
      const source = map.current.getSource(userLayerId) as mapboxgl.GeoJSONSource;
      source.setData(userLocationData as any);
    }
    
    // Add or update radius circle
    if (!map.current.getSource(userRadiusLayerId)) {
      map.current.addSource(userRadiusLayerId, {
        type: 'geojson',
        data: circle as any
      });
      
      // Add radius layer with more subtle styling
      map.current.addLayer({
        id: userRadiusLayerId,
        source: userRadiusLayerId,
        type: 'fill',
        paint: {
          'fill-color': '#6f42c1',
          'fill-opacity': 0.08,
          'fill-outline-color': '#6f42c1'
        }
      }, 'service-points'); // Add below service points
      
      // Add radius outline with more subtle styling
      map.current.addLayer({
        id: userRadiusOutlineId,
        source: userRadiusLayerId,
        type: 'line',
        paint: {
          'line-color': '#6f42c1',
          'line-width': 1.5,
          'line-opacity': 0.4,
          'line-dasharray': [2, 2]
        }
      });
    } else {
      // Update existing source
      const source = map.current.getSource(userRadiusLayerId) as mapboxgl.GeoJSONSource;
      source.setData(circle as any);
    }
  }, []);
  
  // Update map data
  const updateMapData = useCallback(() => {
    if (!map.current) return;
    if (isMapMovingRef.current) return;
    if (!map.current.isStyleLoaded()) return;

    try {
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
    } catch (error) {
      console.error('Error updating map data:', error);
    }
  }, [serviceData, selectedService]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const initMap = () => {
      try {
        mapboxgl.accessToken = MAPBOX_TOKEN;

        const newMap = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/light-v11', // Use a lighter map style
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
        
        // Add controls - minimized for less clutter
        newMap.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left');
        newMap.addControl(
          new mapboxgl.NavigationControl({
            showCompass: false,
            visualizePitch: false
          }),
          'bottom-right'
        );
        
        // Setup event handlers
        let moveEndTimeout: NodeJS.Timeout;
        
        newMap.on('movestart', () => {
          isMapMovingRef.current = true;
          clearTimeout(moveEndTimeout);
        });

        newMap.on('moveend', () => {
          clearTimeout(moveEndTimeout);
          moveEndTimeout = setTimeout(() => {
            isMapMovingRef.current = false;
            updateMapData();
          }, 100);
        });

        newMap.on('load', () => {
          addMapStyles();
          
          // Ensure the map style is fully loaded before adding sources and layers
          if (newMap.isStyleLoaded()) {
            initializeMapLayers();
            
            // If user location is already set, update it on the map
            if (userLocation) {
              updateUserLocationOnMap(userLocation.latitude, userLocation.longitude, maxDistance);
            } else {
              // Try to get user's location after map loads
              getUserLocation();
            }
          } else {
            // If style isn't loaded yet, listen for the style.load event
            newMap.once('style.load', () => {
              initializeMapLayers();
              
              // If user location is already set, update it on the map
              if (userLocation) {
                updateUserLocationOnMap(userLocation.latitude, userLocation.longitude, maxDistance);
              } else {
                // Try to get user's location after map loads
                getUserLocation();
              }
            });
          }
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
        clusterRadius: 50, // Slightly reduced for less crowding
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

      // Add individual service layers - smaller and more transparent
      const servicePointLayer = getServicePointLayer(selectedService);
      
      // Fix the TypeScript error by checking if paint exists and creating it if needed
      if (!servicePointLayer.paint) {
        servicePointLayer.paint = {};
      }
      
      servicePointLayer.paint['circle-radius'] = [
        'interpolate',
        ['linear'],
        ['zoom'],
        10, 5,
        14, 9,
        16, 12
      ];
      servicePointLayer.paint['circle-opacity'] = 0.85;
      
      map.current.addLayer(servicePointLayer);
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
      if (map.current) map.current.remove();
      map.current = null;
    };
  }, [isMobile, serviceData, getUserLocation, updateUserLocationOnMap, maxDistance, selectedService, userLocation, updateMapData, onServiceClick]);

  // Update map when radius or user location changes
  useEffect(() => {
    if (userLocation && map.current) {
      // Only proceed if map style is loaded
      if (map.current.isStyleLoaded()) {
        updateUserLocationOnMap(userLocation.latitude, userLocation.longitude, maxDistance);
        updateMapData();
      } else {
        // Wait for style to load
        map.current.once('style.load', () => {
          if (map.current && userLocation) {
            updateUserLocationOnMap(userLocation.latitude, userLocation.longitude, maxDistance);
            updateMapData();
          }
        });
      }
    }
  }, [maxDistance, userLocation, updateUserLocationOnMap, updateMapData]);

  // Update map when selected service changes
  useEffect(() => {
    if (!map.current || !selectedService) return;
    
    // Check if the map style is loaded before trying to update
    if (map.current.isStyleLoaded()) {
      updateMapData();
      
      // Fly to selected service
      map.current.flyTo({
        center: [selectedService.longitude, selectedService.latitude],
        zoom: Math.max(map.current.getZoom(), 14),
        duration: 500,
        essential: true
      });
    } else {
      // Wait for style to load
      map.current.once('style.load', () => {
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
    }
  }, [selectedService, updateMapData]);

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
          {isLoading ? (
            <CircularProgress size={24} color="secondary" />
          ) : (
            <MyLocationIcon />
          )}
        </Button>
      </Box>
    </Box>
  );
};

export default React.memo(ServiceMap);