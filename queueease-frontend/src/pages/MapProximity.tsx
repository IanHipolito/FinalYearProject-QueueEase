import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { FeatureCollection, Feature, Point } from 'geojson';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import {
  Box, Typography, TextField, InputAdornment, Select, MenuItem, Button,
  Paper, IconButton, Chip, useTheme, useMediaQuery, CircularProgress,
  Alert, Fade, Collapse, Snackbar, Divider,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import LocalBarIcon from '@mui/icons-material/LocalBar';
import HotelIcon from '@mui/icons-material/Hotel';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import AttractionsIcon from '@mui/icons-material/Attractions';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PeopleIcon from '@mui/icons-material/People';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import AddIcon from '@mui/icons-material/Add';
import DirectionsIcon from '@mui/icons-material/Directions';
import FastfoodIcon from '@mui/icons-material/Fastfood';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import StorefrontIcon from '@mui/icons-material/Storefront';

interface Service {
  id: number;
  name: string;
  category: string;
  description?: string;
  wait_time?: number;
  queue_length?: number;
  latitude: number;
  longitude: number;
  subcategory?: string;
  service_type?: 'immediate' | 'appointment';
}

interface MapProximityProps {
  apiUrl?: string;
  mapStyle?: string;
}

const DUBLIN_CENTER: [number, number] = [-6.2603, 53.3498];
const DUBLIN_BOUNDS = {
  north: 53.4,
  south: 53.3,
  east: -6.1,
  west: -6.4
};

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || '';

const ServiceCard = React.memo(({
  service,
  isSelected,
  onCardClick,
  onJoinClick,
  theme
}: {
  service: Service,
  isSelected: boolean,
  onCardClick: (service: Service) => void,
  onJoinClick: (serviceId: number) => void,
  theme: any
}) => (
  <Paper
    elevation={0}
    sx={{
      mb: 2,
      borderRadius: 3,
      overflow: 'hidden',
      border: '1px solid rgba(0,0,0,0.05)',
      bgcolor: isSelected ? 'rgba(0,0,0,0.03)' : 'white',
      '&:hover': {
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      }
    }}
    onClick={() => onCardClick(service)}
  >
    <Box sx={{ display: 'flex', height: '100%', cursor: 'pointer' }}>
      {/* Color accent */}
      <Box
        sx={{
          width: 8,
          bgcolor: getCategoryColor(service.category),
          display: { xs: 'none', sm: 'block' }
        }}
      />

      {/* Content */}
      <Box sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              {service.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
              {getCategoryIcon(service.category)}
              <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                {service.category}
              </Typography>
            </Box>
          </Box>

          {/* Wait time indicator */}
          {service.wait_time && service.wait_time > 0 && (
            <Box
              sx={{
                bgcolor: service.wait_time > 30 ? 'error.light' : 'success.light',
                color: service.wait_time > 30 ? 'error.dark' : 'success.dark',
                px: 1.5,
                py: 0.5,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                height: 'fit-content'
              }}
            >
              <AccessTimeIcon fontSize="small" sx={{ mr: 0.5 }} />
              <Typography variant="caption" fontWeight={600}>
                {service.wait_time} min
              </Typography>
            </Box>
          )}
        </Box>

        {/* Description - truncated for performance */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mt: 1,
            mb: 1.5,
            display: '-webkit-box',
            overflow: 'hidden',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
          }}
        >
          {service.description || "No description provided."}
        </Typography>

        {/* Action buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 'auto' }}>
          {/* Queue indicator */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PeopleIcon
              fontSize="small"
              sx={{
                color: service.queue_length && service.queue_length > 10
                  ? 'error.main'
                  : 'success.main',
                mr: 0.5
              }}
            />
            <Typography
              variant="body2"
              sx={{
                color: service.queue_length && service.queue_length > 10
                  ? 'error.main'
                  : 'success.main',
              }}
            >
              {service.queue_length || 0} in queue
            </Typography>
          </Box>

          {/* Join button */}
          <Button
            variant="contained"
            onClick={(e) => {
              e.stopPropagation();
              onJoinClick(service.id);
            }}
            size="small"
            endIcon={<AddIcon />}
            sx={{
              borderRadius: 4,
              px: 2,
              backgroundColor: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
              }
            }}
          >
            {service.service_type === 'appointment' ? 'Book' : 'Join Queue'}
          </Button>
        </Box>
      </Box>
    </Box>
  </Paper>
));

const getCategoryIcon = (category: string, size: 'small' | 'medium' | 'large' = 'small') => {
  const iconProps = { fontSize: size };
  const lowerCategory = category?.toLowerCase() || '';

  switch (lowerCategory) {
    case 'restaurant':
      return <RestaurantIcon {...iconProps} />;
    case 'fast_food':
      return <FastfoodIcon {...iconProps} />;
    case 'cafe':
      return <LocalCafeIcon {...iconProps} />;
    case 'bar':
      return <LocalBarIcon {...iconProps} />;
    case 'hotel':
      return <HotelIcon {...iconProps} />;
    case 'bank':
      return <LocalAtmIcon {...iconProps} />;
    case 'shop':
      return <ShoppingBagIcon {...iconProps} />;
    case 'storefront':
      return <StorefrontIcon {...iconProps} />;
    case 'attraction':
      return <AttractionsIcon {...iconProps} />;
    case 'healthcare':
      return <LocalHospitalIcon {...iconProps} />;
    default:
      return <MyLocationIcon {...iconProps} />;
  }
};

const getCategoryColor = (category: string): string => {
  const lowerCategory = category?.toLowerCase() || '';

  switch (lowerCategory) {
    case 'restaurant':
      return '#FF5722';
    case 'fast_food':
      return '#E91E63';
    case 'cafe':
      return '#FF9800';
    case 'bar':
      return '#9C27B0';
    case 'hotel':
      return '#2196F3';
    case 'bank':
      return '#FFC107';
    case 'shop':
      return '#795548';
    case 'storefront':
      return '#8D6E63';
    case 'attraction':
      return '#4CAF50';
    case 'healthcare':
      return '#F44336';
    default:
      return '#00BCD4';
  }
};

const MARKER_COLORS = {
  default: '#00757F',
  restaurant: '#FF5722',
  fast_food: '#E91E63',
  cafe: '#FF9800',
  bar: '#9C27B0',
  shop: '#795548',
  bank: '#DB9A00',
  attraction: '#4CAF50',
  hotel: '#2196F3',
  healthcare: '#F44336',
};

const generateRandomDublinCoordinates = () => {
  return {
    latitude: DUBLIN_BOUNDS.south + Math.random() * (DUBLIN_BOUNDS.north - DUBLIN_BOUNDS.south),
    longitude: DUBLIN_BOUNDS.west + Math.random() * (DUBLIN_BOUNDS.east - DUBLIN_BOUNDS.west)
  };
};

const CATEGORIES = [
  { id: "All", label: "All Services" },
  { id: "restaurant", label: "Restaurant" },
  { id: "fast_food", label: "Fast Food" },
  { id: "cafe", label: "Cafe" },
  { id: "bar", label: "Bar" },
  { id: "shop", label: "Shop" },
  { id: "bank", label: "Bank" },
  { id: "attraction", label: "Attraction" },
  { id: "hotel", label: "Hotel" },
  { id: "healthcare", label: "Healthcare" },
];

const getServicePointLayer = (selectedService: Service | null): mapboxgl.CircleLayer => ({
  id: 'service-points',
  type: 'circle' as const,
  source: 'services',
  filter: ['!', ['has', 'point_count']],
  paint: {
    'circle-radius': [
      'interpolate',
      ['linear'],
      ['zoom'],
      10, 6,
      14, 12,
      16, 16
    ],
    'circle-color': [
      'match',
      ['get', 'category'],
      'restaurant', MARKER_COLORS.restaurant,
      'fast_food', MARKER_COLORS.fast_food,
      'cafe', MARKER_COLORS.cafe,
      'bar', MARKER_COLORS.bar,
      'shop', MARKER_COLORS.shop,
      'bank', MARKER_COLORS.bank,
      'attraction', MARKER_COLORS.attraction,
      'hotel', MARKER_COLORS.hotel,
      'healthcare', MARKER_COLORS.healthcare,
      MARKER_COLORS.default
    ],
    'circle-stroke-width': [
      'case',
      ['==', ['get', 'id'], ['literal', selectedService ? selectedService.id : -1]],
      3,
      1.5
    ],
    'circle-stroke-color': 'white',
    'circle-opacity': 0.9
  }
});

const getServiceSymbolLayer = (): mapboxgl.SymbolLayer => ({
  id: 'service-symbols',
  type: 'symbol' as const,
  source: 'services',
  filter: ['!', ['has', 'point_count']],
  layout: {
    'text-field': ['get', 'initial'],
    'text-size': 10,
    'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
    'text-allow-overlap': true
  },
  paint: {
    'text-color': 'white'
  }
});

const MapProximity: React.FC<MapProximityProps> = ({
  apiUrl = 'http://127.0.0.1:8000/api/list_services/',
  mapStyle = 'mapbox://styles/mapbox/light-v11'
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const markersRef = useRef<{ [key: number]: mapboxgl.Marker }>({});
  const bottomSheetRef = useRef<HTMLDivElement>(null);
  const markerClusterRef = useRef<boolean>(false);
  const serviceMapRef = useRef<Map<number, Service>>(new Map());
  const isMapMovingRef = useRef<boolean>(false);
  const debounceTimerRef = useRef<number | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterText, setFilterText] = useState("");
  const [debouncedFilterText, setDebouncedFilterText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [showFilters, setShowFilters] = useState(!isMobile);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);
  const [snackbarState, setSnackbarState] = useState<{
    open: boolean,
    message: string,
    severity: "success" | "error" | "info"
  }>({ open: false, message: "", severity: "success" });
  const [sheetHeight, setSheetHeight] = useState<'collapsed' | 'partial' | 'full'>('partial');

  const createServicePopupContent = (service: Service) => `
    <div style="padding: 12px;">
      <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: 600;">${service.name}</h3>
      <div style="font-size: 13px; color: #666; margin-bottom: 8px;">
        ${service.category || ''}
        ${service.wait_time ? ` • ${service.wait_time} min wait` : ''}
        ${service.queue_length ? ` • ${service.queue_length} in queue` : ''}
      </div>
    </div>
  `;

  const handleMarkerClick = useCallback((service: Service) => {
    setSelectedService(service);

    if (map.current) {
      // Limit animation duration for better performance
      map.current.flyTo({
        center: [service.longitude, service.latitude],
        zoom: Math.max(map.current.getZoom(), 14),
        duration: 500, // Shorter animation
        essential: true // Mark as essential for performance
      });

      // Reuse popup if possible
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

      // Set content and add to map
      popupRef.current
        .setLngLat([service.longitude, service.latitude])
        .setHTML(createServicePopupContent(service))
        .addTo(map.current);
    }

    if (isMobile) setSheetHeight('partial');
  }, [isMobile]);

  const handleJoinQueue = useCallback(async (serviceId: number) => {
    if (!user) {
      navigate('/login', { state: { from: '/mapproximity', service: serviceId } });
      return;
    }

    try {
      const service = serviceMapRef.current.get(serviceId);
      if (!service) {
        throw new Error('Service not found');
      }

      // Check if this is a service that requires appointments
      if (service.service_type === 'appointment') {
        // Route to booking page for appointment-based services
        navigate(`/book-appointment/${serviceId}`);
        return;
      }

      // For immediate services, create a queue entry
      setSnackbarState({
        open: true,
        message: "Creating your queue entry...",
        severity: "info"
      });

      const response = await fetch("http://127.0.0.1:8000/api/create-queue/", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          service_id: serviceId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create queue: ${response.status}`);
      }

      const data = await response.json();

      setSnackbarState({
        open: true,
        message: "Successfully joined queue!",
        severity: "success"
      });

      // Navigate to QR code screen with the queue ID
      navigate(`/qrcodescreen/${data.queue_id}`);
    } catch (err) {
      console.error('Error joining queue:', err);
      setSnackbarState({
        open: true,
        message: `Failed to join queue: ${err instanceof Error ? err.message : 'Unknown error'}`,
        severity: 'error'
      });
    }
  }, [navigate, user]);

  const filteredServices = useMemo(() => {
    if (!debouncedFilterText && selectedCategory === "All") {
      return services;
    }

    return services.filter(service => {
      // Location filter - always apply
      if (service.latitude < DUBLIN_BOUNDS.south ||
        service.latitude > DUBLIN_BOUNDS.north ||
        service.longitude < DUBLIN_BOUNDS.west ||
        service.longitude > DUBLIN_BOUNDS.east) {
        return false;
      }

      // Text filter
      if (debouncedFilterText) {
        const lowerFilter = debouncedFilterText.toLowerCase();
        const nameMatch = service.name.toLowerCase().includes(lowerFilter);
        const descMatch = service.description?.toLowerCase().includes(lowerFilter) || false;

        if (!nameMatch && !descMatch) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== "All") {
        const serviceCategory = (service.category || '').toLowerCase();
        const serviceSubcategory = (service.subcategory || '').toLowerCase();
        const serviceName = (service.name || '').toLowerCase();

        if (selectedCategory === "fast_food") {
          return serviceCategory === "fast_food" ||
            serviceSubcategory === "fast_food" ||
            serviceName.includes('mcdonald') ||
            serviceName.includes('burger king') ||
            serviceName.includes('kfc') ||
            serviceName.includes('subway');
        }

        if (selectedCategory === "healthcare") {
          return serviceCategory === "healthcare" ||
            ["doctors", "clinic", "dentist", "hospital", "medical"].some(term =>
              serviceCategory.includes(term) || serviceName.includes(term)
            );
        }

        return serviceCategory === selectedCategory.toLowerCase();
      }

      return true;
    });
  }, [services, debouncedFilterText, selectedCategory]);

  const visibleServices = useMemo(() => {
    if (sheetHeight === 'collapsed') return [];
    const MAX_VISIBLE_SERVICES = 20;
    return filteredServices.slice(0, MAX_VISIBLE_SERVICES);
  }, [filteredServices, sheetHeight]);

  const prepareGeoJSON = useCallback((services: Service[]): FeatureCollection<Point> => {
    return {
      type: 'FeatureCollection',
      features: services.map((service): Feature<Point> => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [service.longitude, service.latitude]
        },
        properties: {
          id: service.id,
          name: service.name,
          category: service.category,
          initial: service.name.charAt(0),
          wait_time: service.wait_time || 0,
          queue_length: service.queue_length || 0,
          selected: selectedService?.id === service.id
        }
      }))
    };
  }, [selectedService?.id]);

  const getViewportServices = useCallback(() => {
    if (!map.current) return filteredServices;

    // Get current viewport bounds with a buffer
    const bounds = map.current.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    // Add a 20% buffer around the viewport
    const latBuffer = (ne.lat - sw.lat) * 0.2;
    const lngBuffer = (ne.lng - sw.lng) * 0.2;

    return filteredServices.filter(service =>
      service.latitude >= sw.lat - latBuffer &&
      service.latitude <= ne.lat + latBuffer &&
      service.longitude >= sw.lng - lngBuffer &&
      service.longitude <= ne.lng + lngBuffer
    );
  }, [filteredServices, map.current]);

  const geojsonData = useMemo(() =>
    prepareGeoJSON(getViewportServices()),
    [getViewportServices, prepareGeoJSON]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilterText(filterText);
    }, 300);

    return () => {
      clearTimeout(timer);
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [filterText]);

  useEffect(() => {
    const serviceMap = new Map<number, Service>();
    services.forEach(service => {
      serviceMap.set(service.id, service);
    });
    serviceMapRef.current = serviceMap;
  }, [services]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch services: ${response.status}`);
        }

        let data = await response.json();

        data = data.map((service: Service) => {
          const newService = { ...service };

          if (!newService.latitude || !newService.longitude) {
            const { latitude, longitude } = generateRandomDublinCoordinates();
            newService.latitude = latitude;
            newService.longitude = longitude;
          }

          const nameLower = newService.name?.toLowerCase() || ''; // Add null check
          if (
            nameLower.includes('mcdonald') ||
            nameLower.includes('burger king') ||
            nameLower.includes('kfc') ||
            nameLower.includes('subway') ||
            nameLower.includes('wendy') ||
            nameLower.includes('taco bell') ||
            nameLower.includes('domino') ||
            nameLower.includes('pizza hut') ||
            nameLower.includes('chipotle') ||
            (newService.category && newService.category.toLowerCase() === 'fast_food') // Add null check
          ) {
            newService.category = 'fast_food';
            newService.subcategory = 'fast_food';
          }

          if ((newService.category && newService.category.toLowerCase().includes('health')) ||
            (newService.category && newService.category.toLowerCase().includes('clinic')) ||
            (newService.category && newService.category.toLowerCase().includes('doctor')) ||
            (newService.category && newService.category.toLowerCase().includes('hospital'))) {
            newService.category = 'healthcare';
          }

          if (!newService.category) {
            newService.category = 'other';
          }

          return newService;
        });

        setServices(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching services:', err);
        setLoading(false);
      }
    };

    fetchServices();
  }, [apiUrl]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

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
          antialias: false,
          fadeDuration: 0,
          preserveDrawingBuffer: false,
          renderWorldCopies: false,
          maxBounds: [
            [DUBLIN_BOUNDS.west - 0.1, DUBLIN_BOUNDS.south - 0.1],
            [DUBLIN_BOUNDS.east + 0.1, DUBLIN_BOUNDS.north + 0.1]
          ],
          refreshExpiredTiles: false,
          trackResize: false,
          pitchWithRotate: false,
          logoPosition: 'bottom-left'
        });

        map.current = newMap;
        newMap.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left');

        newMap.addControl(new mapboxgl.NavigationControl({
          showCompass: false,
          visualizePitch: false
        }), 'bottom-right');

        const geolocateControl = new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
          showUserHeading: true
        });
        newMap.addControl(geolocateControl, 'bottom-right');

        popupRef.current = new mapboxgl.Popup({
          closeButton: true,
          closeOnClick: true,
          maxWidth: '300px',
          className: 'queueease-popup',
          offset: 15
        });

        newMap.on('movestart', () => {
          isMapMovingRef.current = true;
        });

        newMap.on('moveend', () => {
          isMapMovingRef.current = false;
          updateMapData();
        });

        newMap.on('load', () => {
          console.log('Map loaded');
          addMapStyles();
          initializeMapLayers();
        });

        newMap.on('error', (e) => {
          console.error('Map error:', e);
          setError('Failed to load map: ' + (e.error?.message || 'Unknown error'));
        });
      } catch (err) {
        console.error('Error initializing map:', err);
        setError('Failed to initialize map: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
    };

    const addMapStyles = () => {
      const style = document.createElement('style');
      style.innerHTML = `
        .queueease-popup {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          border-radius: 16px !important;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12) !important;
        }
        .queueease-popup .mapboxgl-popup-content {
          padding: 0;
          border-radius: 16px;
          overflow: hidden;
        }
        .queueease-popup .mapboxgl-popup-close-button {
          font-size: 18px;
          padding: 8px;
          color: white;
          right: 6px;
          top: 6px;
          background: rgba(0,0,0,0.3);
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 0;
        }
        
        /* Simplified markers for better performance */
        .queueease-marker {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          cursor: pointer;
          transition: transform 0.15s;
          border: 2px solid white;
          will-change: transform;
          position: relative;
        }
        .queueease-marker:hover {
          transform: scale(1.1);
          z-index: 2;
        }
        .queueease-marker-selected {
          transform: scale(1.2);
          z-index: 3;
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.4);
        }
        .queueease-marker-badge {
          position: absolute;
          top: -6px;
          right: -6px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 10px;
          font-weight: bold;
          border: 1px solid white;
        }
        
        /* Bottom sheet styles */
        .bottom-sheet-drag-handle {
          width: 40px;
          height: 5px;
          background-color: #e0e0e0;
          border-radius: 3px;
          margin: 8px auto;
        }
        
        /* Mobile-optimized controls */
        @media (max-width: 767px) {
          .mapboxgl-ctrl-bottom-right {
            bottom: 140px;
          }
          .mapboxgl-ctrl-group {
            margin-right: 10px;
            background: white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.15) !important;
            border-radius: 50% !important;
          }
          .mapboxgl-ctrl-group button {
            border-radius: 50% !important;
          }
        }
      `;
      document.head.appendChild(style);
    };

    const initializeMapLayers = () => {
      if (!map.current) return;

      // Add source for services
      map.current.addSource('services', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        },
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
        type: 'circle' as const,
        source: 'services',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            theme.palette.primary.light,
            20, theme.palette.primary.main,
            100, theme.palette.primary.dark
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
        type: 'symbol' as const,
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

          const coordinates = (feature.geometry as Point).coordinates.slice() as [number, number];
          map.current.easeTo({
            center: coordinates,
            zoom: Math.min((zoom || 0) + 1, 17)
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
          handleMarkerClick(service);
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
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
      if (popupRef.current) popupRef.current.remove();
      if (map.current) map.current.remove();
      map.current = null;
    };
  }, [isMobile, theme.palette.primary.light, theme.palette.primary.main, theme.palette.primary.dark, handleMarkerClick, selectedService]);

  const updateMapData = useCallback(() => {
    if (!map.current) return;
    if (isMapMovingRef.current) return; // Skip updates during map movements

    const source = map.current.getSource('services') as mapboxgl.GeoJSONSource;
    if (!source) return;

    // Use requestAnimationFrame for smoother updates
    requestAnimationFrame(() => {
      // Update the GeoJSON data
      source.setData(geojsonData);

      // Only update the selected marker if absolutely necessary
      if (map.current?.getLayer('service-points')) {
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
    });
  }, [geojsonData, selectedService]);

  useEffect(() => {
    if (!map.current || loading) return;

    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(() => {
      updateMapData();
      debounceTimerRef.current = null;
    }, 100);

  }, [geojsonData, loading, updateMapData]);

  useEffect(() => {
    if (!map.current) return;

    const markers = document.querySelectorAll('.queueease-marker');
    markers.forEach(marker => {
      const serviceId = marker.getAttribute('data-service-id');
      const isSelected = selectedService && serviceId === selectedService.id.toString();

      if (isSelected && !marker.classList.contains('queueease-marker-selected')) {
        marker.classList.add('queueease-marker-selected');
      } else if (!isSelected && marker.classList.contains('queueease-marker-selected')) {
        marker.classList.remove('queueease-marker-selected');
      }
    });
  }, [selectedService]);

  useEffect(() => {
    // Reset visible count when filters change
    setVisibleCount(10);

    // Setup scroll listener for the service list container
    const container = document.querySelector('.service-list-container');
    if (container) {
      const handleScroll = (e: Event) => {
        const target = e.target as HTMLElement;
        if (target.scrollHeight - target.scrollTop - target.clientHeight < 200) {
          setVisibleCount(prev => Math.min(prev + 5, filteredServices.length));
        }
      };

      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [filteredServices.length]);

  const toggleSheetHeight = useCallback(() => {
    setSheetHeight(prev => {
      if (prev === 'collapsed') return 'partial';
      if (prev === 'partial') return 'full';
      if (prev === 'full') return 'partial';
      return 'partial';
    });
  }, []);

  const collapseSheet = useCallback(() => {
    setSheetHeight('collapsed');
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterText(e.target.value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setFilterText("");
  }, []);

  const handleCategoryChange = useCallback((event: SelectChangeEvent) => {
    setSelectedCategory(event.target.value as string);
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilterText("");
    setSelectedCategory("All");
  }, []);

  const toggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  const handleSnackbarClose = useCallback(() => {
    setSnackbarState(prev => ({ ...prev, open: false }));
  }, []);

  const renderServiceRow = useCallback((service: Service) => {
    const isSelected = selectedService?.id === service.id;
    return (
      <ServiceCard
        key={service.id}
        service={service}
        isSelected={isSelected}
        onCardClick={handleMarkerClick}
        onJoinClick={handleJoinQueue}
        theme={theme}
      />
    );
  }, [handleJoinQueue, handleMarkerClick, selectedService?.id, theme]);


  const renderServiceList = useCallback(() => {
    if (loading) {
      return <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>;
    }

    if (filteredServices.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', my: 4, px: 2 }}>
          <Typography variant="body1" color="text.secondary">
            No services match your criteria
          </Typography>
          <Button
            variant="contained"
            sx={{ mt: 2, borderRadius: 4 }}
            onClick={handleResetFilters}
          >
            Clear filters
          </Button>
        </Box>
      );
    }

    return visibleServices.map(renderServiceRow);
  }, [filteredServices.length, handleResetFilters, loading, renderServiceRow, visibleServices]);

  return (
    <Box
      sx={{
        width: '100%',
        height: '100vh',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        bgcolor: '#f8f8f8',
      }}
    >
      {/* Map Container - optimized for rendering performance */}
      <Box
        ref={mapContainer}
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          transform: 'translateZ(0)',
          willChange: 'transform',
          WebkitBackfaceVisibility: 'hidden',
          WebkitPerspective: 1000,
        }}
      />

      {/* Search bar at top - simplified for performance */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          right: 16,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <Paper
          elevation={3}
          sx={{
            borderRadius: 4,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <IconButton
            sx={{ mx: 1 }}
            onClick={() => navigate('/usermainpage')}
          >
            <ArrowBackIcon />
          </IconButton>

          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search services..."
            value={filterText}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="primary" />
                </InputAdornment>
              ),
              endAdornment: filterText ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleClearSearch}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
              sx: {
                py: 0.5,
                '& fieldset': { border: 'none' }
              }
            }}
          />

          <Divider orientation="vertical" flexItem />

          <IconButton
            color={selectedCategory !== "All" ? "primary" : "default"}
            sx={{ mx: 1 }}
            onClick={toggleFilters}
          >
            <FilterAltIcon />
          </IconButton>
        </Paper>

        {/* Horizontal category chips - optimized */}
        <Collapse in={showFilters}>
          <Box
            sx={{
              display: 'flex',
              overflowX: 'auto',
              gap: 1,
              pb: 1,
              '&::-webkit-scrollbar': {
                height: 4,
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(0,0,0,0.1)',
                borderRadius: 4,
              }
            }}
          >
            {CATEGORIES.map((category) => (
              <Chip
                key={category.id}
                icon={category.id !== "All" ? getCategoryIcon(category.id) : undefined}
                label={category.label}
                clickable
                color={selectedCategory === category.id ? "primary" : "default"}
                onClick={() => setSelectedCategory(category.id)}
                sx={{
                  borderRadius: 3,
                  py: 0.5,
                  px: 0.5,
                  border: '1px solid',
                  borderColor: selectedCategory === category.id ? 'primary.main' : 'rgba(0,0,0,0.1)',
                  '&.MuiChip-colorPrimary': {
                    bgcolor: theme.palette.primary.main,
                    color: 'white',
                  }
                }}
              />
            ))}
          </Box>
        </Collapse>
      </Box>

      {/* Bottom sheet UI */}
      <Paper
        ref={bottomSheetRef}
        elevation={8}
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          height: sheetHeight === 'full' ? 'calc(85vh)' :
            sheetHeight === 'partial' ? 'calc(40vh)' :
              sheetHeight === 'collapsed' ? '40px' : '64px',
          maxHeight: 'calc(90vh)',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          transition: 'height 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          bgcolor: '#ffffff',
          transform: 'translateZ(0)',
          willChange: 'height',
          boxShadow: '0px -2px 10px rgba(0,0,0,0.1)'
        }}
      >
        {/* Handle for dragging sheet - works in all states */}
        <Box
          onClick={toggleSheetHeight}
          sx={{
            display: 'flex',
            justifyContent: 'center',
            py: 1,
            cursor: 'pointer',
            userSelect: 'none',
            minHeight: sheetHeight === 'collapsed' ? '40px' : 'auto',
            alignItems: 'center'
          }}
        >
          {sheetHeight === 'collapsed' ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" fontWeight={600} sx={{ mr: 1 }}>
                {filteredServices.length} Services Available
              </Typography>
              <KeyboardArrowUpIcon fontSize="small" />
            </Box>
          ) : (
            <Box
              sx={{
                width: 40,
                height: 4,
                bgcolor: 'rgba(0,0,0,0.1)',
                borderRadius: 2
              }}
            />
          )}
        </Box>

        {/* Title bar - only shown when not collapsed */}
        {sheetHeight !== 'collapsed' && (
          <Box sx={{ px: 3, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={700}>
              Nearby Services ({filteredServices.length})
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {(selectedCategory !== "All" || filterText) && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleResetFilters}
                  startIcon={<RestartAltIcon />}
                  sx={{ borderRadius: 4 }}
                >
                  Reset
                </Button>
              )}
              <IconButton
                size="small"
                onClick={sheetHeight === 'full' ? toggleSheetHeight : collapseSheet}
                sx={{
                  bgcolor: 'rgba(0,0,0,0.05)',
                  borderRadius: 2,
                  width: 32,
                  height: 32
                }}
              >
                {sheetHeight === 'full' ? <KeyboardArrowDownIcon /> : <KeyboardArrowDownIcon />}
              </IconButton>
            </Box>
          </Box>
        )}

        {/* Services list - only rendered when not collapsed */}
        {sheetHeight !== 'collapsed' && (
          <Box
            className="service-list-container"
            sx={{
              overflow: 'auto',
              flexGrow: 1,
              px: 2,
              pb: 2,
              overscrollBehavior: 'contain'
            }}
          >
            {renderServiceList()}
          </Box>
        )}
      </Paper>

      {/* Selected service detail panel - optimized with conditional rendering */}
      {selectedService && (
        <Collapse
          in={Boolean(selectedService)}
          sx={{
            position: 'absolute',
            top: 80,
            left: 16,
            right: 16,
            zIndex: 15,
          }}
        >
          <Paper
            elevation={3}
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              mb: 2
            }}
          >
            <Box sx={{ position: 'relative' }}>
              {/* Header with category color */}
              <Box
                sx={{
                  bgcolor: getCategoryColor(selectedService.category),
                  height: 12
                }}
              />

              {/* Close button */}
              <IconButton
                size="small"
                sx={{
                  position: 'absolute',
                  top: 20,
                  right: 10,
                  bgcolor: 'background.paper',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
                  '&:hover': {
                    bgcolor: 'background.paper',
                    opacity: 0.9
                  }
                }}
                onClick={() => setSelectedService(null)}
              >
                <ClearIcon fontSize="small" />
              </IconButton>

              {/* Content */}
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  {selectedService.name}
                </Typography>

                <Box sx={{ display: 'flex', mt: 0.5, alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <Chip
                    icon={getCategoryIcon(selectedService.category)}
                    label={selectedService.category}
                    size="small"
                    sx={{ borderRadius: 2 }}
                  />

                  {selectedService.wait_time && selectedService.wait_time > 0 && (
                    <Chip
                      icon={<AccessTimeIcon />}
                      label={`${selectedService.wait_time} min wait`}
                      size="small"
                      color={selectedService.wait_time > 30 ? "error" : "success"}
                      sx={{ borderRadius: 2 }}
                    />
                  )}

                  {selectedService.queue_length && selectedService.queue_length > 0 && (
                    <Chip
                      icon={<PeopleIcon />}
                      label={`${selectedService.queue_length} in queue`}
                      size="small"
                      color={selectedService.queue_length > 10 ? "error" : "success"}
                      sx={{ borderRadius: 2 }}
                    />
                  )}
                </Box>

                <Typography variant="body2" sx={{ my: 2 }}>
                  {selectedService.description || "No description provided."}
                </Typography>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    sx={{ borderRadius: 3 }}
                    startIcon={<AddIcon />}
                    onClick={() => handleJoinQueue(selectedService.id)}
                  >
                    {selectedService.service_type === 'appointment' ? 'Book Appointment' : 'Join Queue'}
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={<DirectionsIcon />}
                    sx={{ borderRadius: 3 }}
                    onClick={() => {
                      const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedService.latitude},${selectedService.longitude}`;
                      window.open(url, '_blank');
                    }}
                  >
                    Directions
                  </Button>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Collapse>
      )}

      {/* Loading State - optimized with simplified loading indicator */}
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            bgcolor: 'rgba(255, 255, 255, 0.8)',
            padding: 3,
            borderRadius: 2,
            zIndex: 30
          }}
        >
          <CircularProgress size={40} color="primary" />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading services...
          </Typography>
        </Box>
      )}

      {/* Error Display - only show when critical */}
      {error && (
        <Fade in={!!error}>
          <Alert
            severity="error"
            sx={{
              position: 'absolute',
              top: 80,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 25,
              maxWidth: '90%',
              boxShadow: 3,
              borderRadius: 2
            }}
            action={
              <Button color="inherit" size="small" onClick={() => setError(null)}>
                Dismiss
              </Button>
            }
          >
            {error}
          </Alert>
        </Fade>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarState.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center'
        }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarState.severity}
          variant="filled"
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {snackbarState.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default React.memo(MapProximity);