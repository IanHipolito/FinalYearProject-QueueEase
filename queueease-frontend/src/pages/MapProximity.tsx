import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { FeatureCollection, Feature, Point } from 'geojson';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import {
  Box, Typography, TextField, InputAdornment, Select, MenuItem, Button,
  Paper, IconButton, Chip, useTheme, useMediaQuery, CircularProgress,
  Alert, Fade, Collapse, Snackbar, Divider
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
            Join Queue
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

const createMarkerElement = (service: Service, isSelected: boolean = false) => {
  const el = document.createElement('div');
  el.className = 'queueease-marker';
  if (isSelected) {
    el.classList.add('queueease-marker-selected');
  }

  const color = getCategoryColor(service.category);
  el.style.backgroundColor = color;
  el.setAttribute('data-service-id', service.id.toString());
  el.setAttribute('data-category', service.category.toLowerCase());

  const iconContainer = document.createElement('div');
  iconContainer.className = 'queueease-marker-icon';

  let iconSvg = '';
  const category = service.category.toLowerCase();

  switch (category) {
    case 'restaurant':
      iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="white"><path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/></svg>';
      break;
    case 'fast_food':
      iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="white"><path d="M18.06 22.99h1.66c.84 0 1.53-.64 1.63-1.46L23 5.05h-5V1h-1.97v4.05h-4.97l.3 2.34c1.71.47 3.31 1.32 4.27 2.26 1.44 1.42 2.43 2.89 2.43 5.29v8.05zm-1.06-8.99c0-2.7-.82-3.85-2.34-5.38-1.5-1.5-3.63-2.51-5.66-2.51s-4.14 1.01-5.64 2.5c-1.5 1.5-2.36 2.67-2.36 5.39v9h16v-9c0 .01 0-.01 0 0z"/></svg>';
      break;
    case 'cafe':
      iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="white"><path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z"/></svg>';
      break;
    case 'bar':
      iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="white"><path d="M21 5V3H3v2l8 9v5H6v2h12v-2h-5v-5l8-9zM5.23 5h13.54l-1.81 2H7.04L5.23 5z"/></svg>';
      break;
    case 'hotel':
      iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="white"><path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z"/></svg>';
      break;
    case 'bank':
      iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="white"><path d="M4 10v7h3v-7H4zm6 0v7h3v-7h-3zM2 22h19v-3H2v3zm14-12v7h3v-7h-3zm-4.5-9L2 6v2h19V6l-9.5-5z"/></svg>';
      break;
    case 'shop':
    case 'storefront':
      iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="white"><path d="M18.36 9l.6 3H5.04l.6-3h12.72M20 4H4v2h16V4zm0 3H4l-1 5v2h1v6h10v-6h4v6h2v-6h1v-2l-1-5zM6 18v-4h6v4H6z"/></svg>';
      break;
    case 'attraction':
      iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>';
      break;
    case 'healthcare':
      iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="white"><path d="M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/></svg>';
      break;
    default:
      iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>';
  }

  iconContainer.innerHTML = iconSvg;
  el.appendChild(iconContainer);

  if (service.queue_length && service.queue_length > 0) {
    const badge = document.createElement('div');
    badge.className = 'queueease-marker-badge';
    badge.textContent = service.queue_length > 9 ? '9+' : service.queue_length.toString();
    badge.style.backgroundColor = service.queue_length > 10 ? '#f44336' : '#4caf50';
    el.appendChild(badge);
  }

  return el;
};

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
  const [snackbarState, setSnackbarState] = useState<{
    open: boolean,
    message: string,
    severity: "success" | "error" | "info"
  }>({ open: false, message: "", severity: "success" });
  const [sheetHeight, setSheetHeight] = useState<'collapsed' | 'partial' | 'full'>('partial');

  const filteredServices = useMemo(() => {
    let filtered = services.filter(service =>
      service.latitude >= DUBLIN_BOUNDS.south &&
      service.latitude <= DUBLIN_BOUNDS.north &&
      service.longitude >= DUBLIN_BOUNDS.west &&
      service.longitude <= DUBLIN_BOUNDS.east
    );

    if (debouncedFilterText.trim() !== "") {
      const lowerFilter = debouncedFilterText.toLowerCase();
      filtered = filtered.filter(
        (service) =>
          service.name.toLowerCase().includes(lowerFilter) ||
          (service.description?.toLowerCase().includes(lowerFilter) || false)
      );
    }

    if (selectedCategory !== "All") {
      filtered = filtered.filter((service) => {
        const serviceCategory = service.category?.toLowerCase() || '';
        const serviceSubcategory = service.subcategory?.toLowerCase() || '';
        const serviceName = service.name?.toLowerCase() || '';

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
      });
    }

    return filtered;
  }, [services, debouncedFilterText, selectedCategory]);

  const geojsonData = useMemo<FeatureCollection<Point>>(() => ({
    type: 'FeatureCollection',
    features: filteredServices.map((service): Feature<Point> => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [service.longitude, service.latitude]
      },
      properties: {
        id: service.id,
        name: service.name,
        category: service.category,
        wait_time: service.wait_time || 0,
        queue_length: service.queue_length || 0
      }
    }))
  }), [filteredServices]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilterText(filterText);
    }, 300);
    return () => clearTimeout(timer);
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
          ]
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
          updateVisibleMarkers();
        });

        newMap.on('load', () => {
          console.log('Map loaded');
          addMapStyles();
          initializeMarkerLayers();
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

    const initializeMarkerLayers = () => {
      if (!map.current) return;

      map.current.addSource('services', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
        clusterProperties: {
          restaurant_count: ['+', ['case', ['==', ['get', 'category'], 'restaurant'], 1, 0]],
          fast_food_count: ['+', ['case', ['==', ['get', 'category'], 'fast_food'], 1, 0]],
          cafe_count: ['+', ['case', ['==', ['get', 'category'], 'cafe'], 1, 0]],
          bar_count: ['+', ['case', ['==', ['get', 'category'], 'bar'], 1, 0]],
          shop_count: ['+', ['case', ['==', ['get', 'category'], 'shop'], 1, 0]],
          bank_count: ['+', ['case', ['==', ['get', 'category'], 'bank'], 1, 0]],
          hotel_count: ['+', ['case', ['==', ['get', 'category'], 'hotel'], 1, 0]],
          healthcare_count: ['+', ['case', ['==', ['get', 'category'], 'healthcare'], 1, 0]],
          attraction_count: ['+', ['case', ['==', ['get', 'category'], 'attraction'], 1, 0]]
        }
      });

      map.current.addLayer({
        id: 'clusters',
        type: 'circle',
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
            ['exponential', 1.5],
            ['get', 'point_count'],
            3, 25,
            10, 30,
            50, 40,
            100, 45,
            500, 55
          ],
          'circle-stroke-width': 3,
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
          'text-size': 14,
          'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
          'text-allow-overlap': true
        },
        paint: {
          'text-color': 'white'
        }
      });

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
            zoom: Math.min((zoom || 0) + 0.5, 18)
          });
        });
      });

      markerClusterRef.current = true;
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
  }, [isMobile, theme.palette.primary.main]);

  const updateVisibleMarkers = useCallback(() => {
    if (!map.current || isMapMovingRef.current) return;
    const bounds = map.current.getBounds();
    const source = map.current.getSource('services') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData(geojsonData);
    }

    const currentZoom = map.current.getZoom();
    const shouldShowClusters = currentZoom < 14;
    const MAX_VISIBLE_MARKERS = shouldShowClusters ? 30 : 75;

    const visibleServices = filteredServices.filter(service =>
      service.longitude >= bounds.getWest() &&
      service.longitude <= bounds.getEast() &&
      service.latitude >= bounds.getSouth() &&
      service.latitude <= bounds.getNorth()
    );

    const servicesToShow = visibleServices.slice(0, MAX_VISIBLE_MARKERS);
    const currentServiceIds = new Set(servicesToShow.map(s => s.id));
    const existingServiceIds = new Set(Object.keys(markersRef.current).map(Number));

    existingServiceIds.forEach(id => {
      if (!currentServiceIds.has(id)) {
        if (markersRef.current[id]) {
          markersRef.current[id].remove();
          delete markersRef.current[id];
        }
      }
    });

    servicesToShow.forEach(service => {
      if (markersRef.current[service.id]) {
        markersRef.current[service.id].setLngLat([service.longitude, service.latitude]);
        return;
      }

      const isSelected = selectedService?.id === service.id;
      const el = createMarkerElement(service, isSelected);

      el.addEventListener('click', () => {
        if (debounceTimerRef.current) {
          window.clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = window.setTimeout(() => {
          handleMarkerClick(service);
        }, 100);
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([service.longitude, service.latitude])
        .addTo(map.current!);

      markersRef.current[service.id] = marker;
    });
  }, [filteredServices, geojsonData, selectedService]);

  useEffect(() => {
    if (!map.current || loading) return;

    try {
      const source = map.current.getSource('services');
      if (source) {
        (source as mapboxgl.GeoJSONSource).setData(geojsonData);
        if (Object.keys(markersRef.current).length > 0) {
          Object.values(markersRef.current).forEach(marker => marker.remove());
          markersRef.current = {};
        }
      }

      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = window.setTimeout(() => {
        updateVisibleMarkers();
        debounceTimerRef.current = null;
      }, 100);
    } catch (err) {
      console.error('Error updating map data:', err);
    }
  }, [geojsonData, loading, updateVisibleMarkers]);

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

  const handleMarkerClick = useCallback((service: Service) => {
    setSelectedService(service);

    if (map.current) {
      map.current.easeTo({
        center: [service.longitude, service.latitude],
        zoom: 15,
        duration: 800
      });
    }

    if (sheetHeight === 'collapsed') {
      setSheetHeight('partial');
    }
  }, []);

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

  const handleJoinQueue = useCallback(async (serviceId: number) => {
    if (!user) {
      navigate('/login', { state: { from: '/map', service: serviceId } });
      return;
    }

    try {
      const service = serviceMapRef.current.get(serviceId);
      if (!service) {
        throw new Error('Service not found');
      }

      navigate(`/book/${serviceId}`, {
        state: {
          serviceName: service.name,
          serviceCategory: service.category,
          waitTime: service.wait_time || 10
        }
      });
    } catch (err) {
      console.error('Error joining queue:', err);
      setSnackbarState({
        open: true,
        message: `Failed to join queue: ${err instanceof Error ? err.message : 'Unknown error'}`,
        severity: 'error'
      });
    }
  }, [navigate, user]);

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

  const renderServiceList = useCallback(() => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      );
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

    const MAX_VISIBLE_SERVICES = 20;
    const visibleServices = filteredServices.slice(0, MAX_VISIBLE_SERVICES);

    return visibleServices.map(service => (
      <ServiceCard
        key={service.id}
        service={service}
        isSelected={selectedService?.id === service.id}
        onCardClick={handleMarkerClick}
        onJoinClick={handleJoinQueue}
        theme={theme}
      />
    ));
  }, [filteredServices, handleJoinQueue, handleMarkerClick, handleResetFilters, loading, selectedService, theme]);

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
                    Join Queue
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