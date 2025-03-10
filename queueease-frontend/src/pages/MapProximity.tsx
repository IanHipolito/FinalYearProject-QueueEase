import React, { useEffect, useState, useRef, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import { FeatureCollection, Feature, Point } from 'geojson';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from './AuthContext'; // Adjust the import path as needed

// Material UI imports
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Paper,
  IconButton,
  Chip,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Alert,
  Fade,
  Collapse,
  Tooltip,
  Snackbar
} from '@mui/material';

// Material UI icons
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import FilterListIcon from '@mui/icons-material/FilterList';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import LocalBarIcon from '@mui/icons-material/LocalBar';
import HotelIcon from '@mui/icons-material/Hotel';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import AttractionsIcon from '@mui/icons-material/Attractions';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import WarningIcon from '@mui/icons-material/Warning';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PeopleIcon from '@mui/icons-material/People';
import GroupsIcon from '@mui/icons-material/Groups';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HomeIcon from '@mui/icons-material/Home';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AddIcon from '@mui/icons-material/Add';

// Define types
interface Service {
  id: number;
  name: string;
  category: string;
  description?: string;
  wait_time?: number;
  queue_length?: number;
  latitude: number;
  longitude: number;
}

interface MapProximityProps {
  apiUrl?: string;
  mapStyle?: string;
}

// Dublin coordinates (center)
const DUBLIN_CENTER: [number, number] = [-6.2603, 53.3498];
// Dublin bounding box (approximately)
const DUBLIN_BOUNDS = {
  north: 53.4,
  south: 53.3,
  east: -6.1,
  west: -6.4
};

// Category icons mapping
const getCategoryIcon = (category: string, size: 'small' | 'medium' | 'large' = 'small') => {
  const iconProps = { fontSize: size };
  
  switch (category?.toLowerCase()) {
    case 'restaurant':
      return <RestaurantIcon {...iconProps} />;
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
    case 'attraction':
      return <AttractionsIcon {...iconProps} />;
    default:
      return <MyLocationIcon {...iconProps} />;
  }
};

// Category colors mapping
const getCategoryColor = (category: string): string => {
  switch (category?.toLowerCase()) {
    case 'restaurant':
      return '#FF5722'; // Deep Orange
    case 'cafe':
      return '#FF9800'; // Orange
    case 'bar':
      return '#9C27B0'; // Purple
    case 'hotel':
      return '#2196F3'; // Blue
    case 'bank':
      return '#FFC107'; // Amber
    case 'shop':
      return '#795548'; // Brown
    case 'attraction':
      return '#4CAF50'; // Green
    default:
      return '#00BCD4'; // Cyan
  }
};

const MapProximity: React.FC<MapProximityProps> = ({
  apiUrl = 'http://127.0.0.1:8000/api/list_services/',
  mapStyle = 'mapbox://styles/mapbox/light-v11'
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth(); // Get current user
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery('(max-width:480px)');
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const activeMarkerRef = useRef<number | null>(null);
  
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [showFilters, setShowFilters] = useState(!isMobile);
  const [showLegend, setShowLegend] = useState(true);
  const [isJoiningQueue, setIsJoiningQueue] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "info">("success");

  // Filter services based on search text, category, and Dublin area
  const filteredServices = useMemo(() => {
    // First filter by Dublin area
    let filtered = services.filter(service => 
      service.latitude >= DUBLIN_BOUNDS.south &&
      service.latitude <= DUBLIN_BOUNDS.north &&
      service.longitude >= DUBLIN_BOUNDS.west &&
      service.longitude <= DUBLIN_BOUNDS.east
    );

    // Then filter by search text
    if (filterText.trim() !== "") {
      const lowerFilter = filterText.toLowerCase();
      filtered = filtered.filter(
        (service) =>
          service.name.toLowerCase().includes(lowerFilter) ||
          (service.description?.toLowerCase().includes(lowerFilter) || false)
      );
    }

    // Then filter by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter((service) => {
        const category = service.category?.toLowerCase();
        const serviceName = service.name.toLowerCase();

        if (selectedCategory === "healthcare") {
          return ["doctors", "clinic", "dentist", "general checkup", "doctor"].includes(category ?? "");
        }

        if (selectedCategory === "fast_food") {
          return category === "fast_food" || ["mcdonald's", "burger king"].includes(serviceName);
        }

        return category === selectedCategory.toLowerCase();
      });
    }

    return filtered;
  }, [services, filterText, selectedCategory]);

  // Convert services to GeoJSON
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
        description: service.description || "",
        wait_time: service.wait_time || 0,
        queue_length: service.queue_length || 0
      }
    }))
  }), [filteredServices]);

  // Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch services: ${response.status}`);
        }
        const data = await response.json();
        setServices(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching services:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [apiUrl]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || '';
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: DUBLIN_CENTER,
      zoom: isMobile ? 11 : 12,
      minZoom: 10,
      maxZoom: 18,
      pitch: 0,
      attributionControl: true,
      antialias: true,
      localIdeographFontFamily: "'Noto Sans', 'Noto Sans CJK SC', sans-serif",
      cooperativeGestures: isMobile
    });

    // Add navigation control (zoom buttons)
    map.current.addControl(new mapboxgl.NavigationControl({
      showCompass: true,
      visualizePitch: true
    }), 'top-right');
    
    // Add geolocation control
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true
      }), 
      'top-right'
    );
    
    // Add scale control
    map.current.addControl(new mapboxgl.ScaleControl({
      maxWidth: 100,
      unit: 'metric'
    }), 'bottom-left');
    
    // Add fullscreen control for better mobile experience
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    // Create popup but don't add to map yet
    popupRef.current = new mapboxgl.Popup({
      closeButton: true,
      closeOnClick: false,
      maxWidth: '320px',
      className: 'custom-popup',
      offset: 15,
      anchor: 'bottom'
    });
    
    // Add custom styles to the document head for popup and mobile compatibility
    const style = document.createElement('style');
    style.innerHTML = `
      .custom-popup {
        border-radius: 12px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      }
      .custom-popup .mapboxgl-popup-content {
        padding: 16px;
        border-radius: 12px;
        border: none;
      }
      .custom-popup .mapboxgl-popup-tip {
        border-top-color: white;
      }
      .custom-popup .mapboxgl-popup-close-button {
        font-size: 18px;
        padding: 6px 8px;
        color: #666;
        right: 6px;
        top: 6px;
      }
      .custom-popup .mapboxgl-popup-close-button:hover {
        background-color: rgba(0,0,0,0.05);
        color: #333;
        border-radius: 50%;
      }
      .mapboxgl-ctrl-group {
        border-radius: 8px !important;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
      }
      .mapboxgl-ctrl-group button {
        width: 36px !important;
        height: 36px !important;
      }
      
      /* Mobile compatibility adjustments */
      @media (max-width: 767px) {
        .mapboxgl-ctrl-top-right {
          top: 10px;
          right: 10px;
        }
        .mapboxgl-ctrl-top-right .mapboxgl-ctrl {
          margin: 0 0 10px;
        }
        .custom-popup {
          max-width: 90% !important;
        }
        .custom-popup .mapboxgl-popup-content {
          padding: 12px;
        }
      }
    `;
    document.head.appendChild(style);

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      if (popupRef.current) popupRef.current.remove();
      if (map.current) map.current.remove();
      map.current = null;
    };
  }, [mapStyle, isMobile]);

  // Update map data when services or map change
  useEffect(() => {
    if (!map.current || !mapLoaded || loading || filteredServices.length === 0) return;

    // Add or update source
    const source = map.current.getSource('services');
    if (source) {
      (source as mapboxgl.GeoJSONSource).setData(geojsonData);
    } else {
      map.current.addSource('services', {
        type: 'geojson',
        data: geojsonData,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
        clusterProperties: {
          // Count by category
          count: ['+', 1]
        }
      });

      // Add cluster layers
      map.current.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'services',
        filter: ['has', 'point_count'],
        paint: {
          // Using a consistent purple gradient theme
          'circle-color': [
            'step',
            ['get', 'point_count'],
            theme.palette.primary.light, // Small clusters
            20, theme.palette.primary.main, // Medium clusters
            50, theme.palette.primary.dark, // Large clusters
            100, theme.palette.secondary.main  // Very large clusters
          ],
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'point_count'],
            3, 25,    // Min 3 points = 25px radius
            10, 30,   // 10 points = 30px 
            50, 35,   // 50 points = 35px
            100, 40,  // 100 points = 40px
            500, 50,  // 500 points = 50px
            1000, 60  // 1000+ points = 60px
          ],
          'circle-stroke-width': 3,
          'circle-stroke-color': 'rgba(255, 255, 255, 0.8)',
          'circle-opacity': 0.9
        }
      });

      // Add cluster count labels
      map.current.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'services',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-size': 16,
          'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
          'text-allow-overlap': true
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': 'rgba(0, 0, 0, 0.2)',
          'text-halo-width': 1
        }
      });

      // Add a drop shadow effect for markers
      map.current.addLayer({
        id: 'point-shadow',
        type: 'circle',
        source: 'services',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-radius': 12,
          'circle-color': 'rgba(0, 0, 0, 0.2)',
          'circle-opacity': 0.6,
          'circle-translate': [2, 2],
          'circle-blur': 1
        }
      });

      // Individual points with improved styling
      map.current.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'services',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'match',
            ['get', 'category'],
            'restaurant', getCategoryColor('restaurant'),
            'cafe', getCategoryColor('cafe'),
            'bar', getCategoryColor('bar'),
            'hotel', getCategoryColor('hotel'),
            'attraction', getCategoryColor('attraction'),
            'shop', getCategoryColor('shop'),
            getCategoryColor('default') // default color
          ],
          'circle-radius': 10,
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 1
        }
      });

      // Add symbol layer for icons with responsive text sizing
      map.current.addLayer({
        id: 'poi-labels',
        type: 'symbol',
        source: 'services',
        filter: ['!', ['has', 'point_count']],
        layout: {
          'text-field': ['get', 'name'],
          'text-size': isMobile ? 10 : 12,
          'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
          'text-offset': [0, 1.5],
          'text-anchor': 'top',
          'text-allow-overlap': false,
          'text-ignore-placement': false,
          'text-optional': true,
          'visibility': 'visible'
        },
        paint: {
          'text-color': '#333',
          'text-halo-color': '#fff',
          'text-halo-width': 1.5,
          // Fade in text as you zoom in
          'text-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            12, 0,
            13, 1
          ]
        }
      });

      // Handle mouse events for interactivity
      map.current.on('mouseenter', 'clusters', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      
      map.current.on('mouseleave', 'clusters', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
      
      // Handle click on points to show persistent popup
      map.current.on('click', 'unclustered-point', (e) => {
        if (!map.current || !popupRef.current || !e.features || e.features.length === 0) return;
        
        const feature = e.features[0];
        const pointId = feature.properties?.id as number;
        const coordinates = (feature.geometry as Point).coordinates.slice() as [number, number];
        const { 
          name, 
          category, 
          description = "No description available",
          wait_time = 0,
          queue_length = 0
        } = feature.properties as { 
          name: string; 
          category: string; 
          description: string;
          wait_time: number;
          queue_length: number;
        };
        
        // If clicking on the same marker that has an open popup, close it
        if (activeMarkerRef.current === pointId && popupRef.current.isOpen()) {
          popupRef.current.remove();
          activeMarkerRef.current = null;
          return;
        }
        
        // Close existing popup if one is open
        if (popupRef.current.isOpen()) {
          popupRef.current.remove();
        }
        
        // Save the active marker ID
        activeMarkerRef.current = pointId;
        
        // Create popup content with Material UI styling
        const categoryColor = getCategoryColor(category);
        const queueColor = queue_length > 10 ? theme.palette.error.light : theme.palette.success.light;
        const queueTextColor = queue_length > 10 ? theme.palette.error.main : theme.palette.success.main;
        const waitTimeColor = wait_time > 30 ? theme.palette.error.main : theme.palette.success.main;

        // Total time calculation
        const totalWaitTime = wait_time * queue_length;
        const totalWaitHours = Math.floor(totalWaitTime / 60);
        const totalWaitMinutes = totalWaitTime % 60;
        const formattedTotalWait = totalWaitHours > 0 
          ? `${totalWaitHours}h ${totalWaitMinutes}m` 
          : `${totalWaitMinutes}m`;

        // Style popup content with CSS that matches Material UI
        const popupContent = `
          <div style="font-family: ${theme.typography.fontFamily};">
            <div style="border-left: 4px solid ${categoryColor}; padding-left: 12px;">
              <h3 style="margin: 0 0 5px 0; font-size: 16px; color: rgba(0, 0, 0, 0.87); font-weight: 500;">${name}</h3>
              <div style="margin: 5px 0; display: flex; align-items: center; flex-wrap: wrap; gap: 5px;">
                <span style="
                  display: inline-block;
                  font-size: 12px;
                  padding: 2px 8px;
                  background-color: ${categoryColor}20;
                  color: ${categoryColor};
                  border-radius: 16px;
                  font-weight: 500;
                ">${category}</span>
                
                ${queue_length > 0 ? `
                <span style="
                  display: inline-block;
                  font-size: 12px;
                  padding: 2px 8px;
                  background-color: ${queueColor};
                  color: ${queueTextColor};
                  border-radius: 16px;
                  font-weight: 500;
                ">Queue: ${queue_length} ${queue_length === 1 ? 'person' : 'people'}</span>
                ` : ''}
              </div>
            </div>
            
            <p style="margin: 10px 0; font-size: 13px; color: rgba(0, 0, 0, 0.6); line-height: 1.5;">
              ${description}
            </p>
            
            ${wait_time > 0 ? `
            <div style="margin: 12px 0; font-size: 13px; color: rgba(0, 0, 0, 0.6); display: flex; align-items: center; gap: 8px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" fill="rgba(0, 0, 0, 0.54)"/>
                <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z" fill="rgba(0, 0, 0, 0.54)"/>
              </svg>
              Estimated Wait: <span style="color: ${waitTimeColor}; font-weight: 500;">${wait_time} mins</span> per person
            </div>
            ` : ''}
            
            ${(wait_time > 0 && queue_length > 0) ? `
            <div style="
              margin: 12px 0; 
              padding: 8px 12px;
              border-radius: 4px;
              background-color: ${theme.palette.info.light}20;
              color: ${theme.palette.info.dark};
              font-size: 13px;
              font-weight: 500;
            ">
              Total queue time: ~ ${formattedTotalWait}
            </div>
            ` : ''}
            
            <div style="margin-top: 12px; font-size: 13px; color: rgba(0, 0, 0, 0.6); display: flex; align-items: center; gap: 8px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" 
                fill="rgba(0, 0, 0, 0.54)"/>
              </svg>
              Dublin, Ireland
            </div>
            <div style="margin-top: 16px; display: flex; justify-content: space-between; gap: 8px;">
              <button 
                id="join-queue-btn-${pointId}"
                style="
                  border: none; 
                  background: ${theme.palette.primary.main}; 
                  color: white; 
                  padding: 6px 12px; 
                  border-radius: 4px;
                  font-size: 13px;
                  font-weight: 500;
                  cursor: pointer;
                  flex: 1;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 6px;
                "
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="white"/>
                </svg>
                Join Queue
              </button>
              <button 
                style="
                  border: 1px solid ${theme.palette.primary.main}; 
                  background: white; 
                  color: ${theme.palette.primary.main}; 
                  padding: 6px 12px; 
                  border-radius: 4px;
                  font-size: 13px;
                  font-weight: 500;
                  cursor: pointer;
                  flex: 1;
                "
              >
                Directions
              </button>
            </div>
          </div>
        `;
        
        popupRef.current
          .setLngLat(coordinates)
          .setHTML(popupContent)
          .addTo(map.current);
          
        // Add event listener to the join queue button
        setTimeout(() => {
          const joinQueueBtn = document.getElementById(`join-queue-btn-${pointId}`);
          if (joinQueueBtn) {
            joinQueueBtn.addEventListener('click', () => {
              handleJoinQueue(pointId);
            });
          }
        }, 100);
      });
      
      map.current.on('mouseenter', 'unclustered-point', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      
      map.current.on('mouseleave', 'unclustered-point', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
      
      // Handle cluster click to zoom in
      map.current.on('click', 'clusters', (e) => {
        if (!map.current || !e.features || e.features.length === 0) return;
        
        // Close any open popup when clicking on clusters
        if (popupRef.current && popupRef.current.isOpen()) {
          popupRef.current.remove();
          activeMarkerRef.current = null;
        }
        
        const feature = e.features[0];
        const clusterId = feature.properties?.cluster_id;
        if (!clusterId) return;
        
        (map.current.getSource('services') as mapboxgl.GeoJSONSource).getClusterExpansionZoom(
          clusterId,
          (err, zoom) => {
            if (err || !map.current) return;
            
            map.current.easeTo({
              center: (feature.geometry as Point).coordinates as [number, number],
              zoom: zoom,
              duration: 800,
              easing: (t) => t * (2 - t)
            });
          }
        );
      });
    }

    // Fit map to Dublin bounds with different padding for mobile
    map.current.fitBounds([
      [DUBLIN_BOUNDS.west, DUBLIN_BOUNDS.south],
      [DUBLIN_BOUNDS.east, DUBLIN_BOUNDS.north]
    ], {
      padding: isMobile 
        ? { top: 140, bottom: 20, left: 20, right: 20 }
        : { top: 100, bottom: 50, left: 350, right: 50 },
      maxZoom: 14,
      duration: 1000 // Smooth animation
    });
    
    // Listen for popup close event to reset active marker
    popupRef.current?.on('close', () => {
      activeMarkerRef.current = null;
    });
    
  }, [geojsonData, filteredServices, mapLoaded, loading, isMobile, theme]);
  
  // Handle reset view
  const handleResetView = () => {
    if (!map.current) return;
    
    // Close any open popup
    if (popupRef.current && popupRef.current.isOpen()) {
      popupRef.current.remove();
      activeMarkerRef.current = null;
    }
    
    map.current.fitBounds([
      [DUBLIN_BOUNDS.west, DUBLIN_BOUNDS.south],
      [DUBLIN_BOUNDS.east, DUBLIN_BOUNDS.north]
    ], { 
      padding: isMobile 
        ? { top: 140, bottom: 20, left: 20, right: 20 }
        : { top: 100, bottom: 50, left: 350, right: 50 },
      duration: 1200
    });
  };
  
  // Clear all filters
  const handleClearFilters = () => {
    setFilterText("");
    setSelectedCategory("All");
  };

  // Toggle search panel visibility
  const toggleSearchPanel = () => {
    setShowFilters(!showFilters);
  };

  // Toggle legend visibility
  const toggleLegend = () => {
    setShowLegend(!showLegend);
  };

  // Handle join queue
  const handleJoinQueue = async (serviceId: number) => {
    if (!user || !user.id) {
      setSnackbarMessage("Please log in to join a queue");
      setSnackbarSeverity("info");
      setSnackbarOpen(true);
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    setIsJoiningQueue(true);
    setSelectedServiceId(serviceId);
    
    try {
      const response = await axios.post<{ queue_id: number }>(
        "http://127.0.0.1:8000/api/create-queue/",
        {
          user_id: user.id,
          service_id: serviceId,
        }
      );
      
      const { queue_id } = response.data;
      
      setSnackbarMessage("Successfully joined queue!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      
      // Navigate to the queue details page after a short delay
      setTimeout(() => {
        navigate(`/qrcodescreen/${queue_id}`);
      }, 1500);
      
    } catch (error) {
      console.error("Error creating queue", error);
      setSnackbarMessage("Failed to join queue. Please try again.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setIsJoiningQueue(false);
      setSelectedServiceId(null);
    }
  };

  const hasActiveFilters = filterText !== "" || selectedCategory !== "All";

  return (
    <Box sx={{ position: 'relative', height: '100vh', width: '100%' }}>
      {/* Main Map Container */}
      <Box ref={mapContainer} sx={{ height: '100%', width: '100%' }} />
      
      {/* Back to Home Button */}
      <Button
        variant="contained"
        color="primary"
        startIcon={<HomeIcon />}
        onClick={() => navigate('/usermainpage')}
        sx={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 11,
          borderRadius: 6,
          boxShadow: 2,
          px: 2
        }}
      >
        Home
      </Button>
      
      {/* Filter Controls with Toggle Button */}
      <Paper 
        elevation={3} 
        sx={{
          position: 'absolute',
          top: isMobile ? 70 : 20,
          left: isMobile ? 20 : 130,
          right: isMobile ? 20 : 'auto',
          width: isMobile ? 'auto' : 320,
          borderRadius: 3,
          overflow: 'hidden',
          zIndex: 10
        }}
      >
        <Box sx={{ p: 2, pb: showFilters ? 2 : 0 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            mb: showFilters ? 2 : 0
          }}>
            <Typography variant="h6" color="textPrimary" sx={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: 1,
              fontSize: isSmallMobile ? '1rem' : '1.25rem'
            }}>
              <MyLocationIcon color="primary" />
              Dublin Services
            </Typography>
            
            <IconButton
              size="small"
              onClick={toggleSearchPanel}
              color={showFilters ? "primary" : "default"}
            >
              {showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
          
          <Collapse in={showFilters}>
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                placeholder="Search services by name..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                variant="outlined"
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: filterText ? (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setFilterText("")}
                        edge="end"
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null
                }}
                sx={{ mb: 2 }}
              />
              
              <FormControl fullWidth size="small">
                <InputLabel id="category-select-label">Category</InputLabel>
                <Select
                  labelId="category-select-label"
                  id="category-select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as string)}
                  label="Category"
                >
                  <MenuItem value="All">All Categories</MenuItem>
                  <MenuItem value="restaurant">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <RestaurantIcon sx={{ color: getCategoryColor('restaurant') }} fontSize="small" />
                      Restaurant
                    </Box>
                  </MenuItem>
                  <MenuItem value="cafe">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocalCafeIcon sx={{ color: getCategoryColor('cafe') }} fontSize="small" />
                      Cafe
                    </Box>
                  </MenuItem>
                  <MenuItem value="bar">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocalBarIcon sx={{ color: getCategoryColor('bar') }} fontSize="small" />
                      Bar
                    </Box>
                  </MenuItem>
                  <MenuItem value="hotel">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <HotelIcon sx={{ color: getCategoryColor('hotel') }} fontSize="small" />
                      Hotel
                    </Box>
                  </MenuItem>
                  <MenuItem value="bank">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocalAtmIcon sx={{ color: getCategoryColor('bank') }} fontSize="small" />
                      Bank
                    </Box>
                  </MenuItem>
                  <MenuItem value="shop">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ShoppingBagIcon sx={{ color: getCategoryColor('shop') }} fontSize="small" />
                      Shop
                    </Box>
                  </MenuItem>
                  <MenuItem value="attraction">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AttractionsIcon sx={{ color: getCategoryColor('attraction') }} fontSize="small" />
                      Attraction
                    </Box>
                  </MenuItem>
                  <MenuItem value="post_office">Post Office</MenuItem>
                  <MenuItem value="events_venue">Events Venue</MenuItem>
                  <MenuItem value="veterinary">Veterinary</MenuItem>
                  <MenuItem value="charging_station">Charging Station</MenuItem>
                  <MenuItem value="healthcare">Healthcare</MenuItem>
                  <MenuItem value="government">Government</MenuItem>
                  <MenuItem value="fast_food">Fast Food</MenuItem>
                </Select>
              </FormControl>
              
              {filteredServices.length > 0 && hasActiveFilters && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip
                    icon={<CheckCircleIcon />}
                    label={`${filteredServices.length} service${filteredServices.length === 1 ? '' : 's'}`}
                    color="primary"
                    size="small"
                    variant="outlined"
                  />
                  
                  <Button 
                    size="small"
                    onClick={handleClearFilters}
                    startIcon={<ClearIcon />}
                    color="primary"
                  >
                    Clear Filters
                  </Button>
                </Box>
              )}
              
              {filteredServices.length === 0 && !loading && (
                <Alert 
                  severity="warning" 
                  icon={<WarningIcon fontSize="inherit" />}
                  sx={{ mt: 2 }}
                >
                  No services found with current filters
                </Alert>
              )}
            </Box>
          </Collapse>
        </Box>
      </Paper>
      
      {/* Reset View Button */}
      <Button
        variant="contained"
        color="primary"
        size="small"
        startIcon={<RestartAltIcon />}
        onClick={handleResetView}
        sx={{
          position: 'absolute',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 5,
          borderRadius: 6,
          boxShadow: 2,
          px: 2
        }}
      >
        Reset View
      </Button>
      
      {/* Map Legend with toggle */}
      <Paper
        elevation={3}
        sx={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          borderRadius: 3,
          overflow: 'hidden',
          zIndex: 5,
          maxWidth: 280,
          display: { xs: 'block', sm: 'block' }
        }}
      >
        <Box sx={{ 
          p: 2,
          pb: showLegend ? 2 : 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="subtitle1" fontWeight="medium">
            Legend
          </Typography>
          
          <IconButton
            size="small"
            onClick={toggleLegend}
            color="default"
          >
            {showLegend ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
        
        <Collapse in={showLegend}>
          <Box sx={{ p: 2, pt: 0 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 2, mb: 1 }}>
              Clusters
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Box sx={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.5
              }}>
                <Box sx={{ 
                  width: 24, 
                  height: 24, 
                  bgcolor: theme.palette.primary.light,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  border: '2px solid white',
                  boxShadow: 1
                }}>3+</Box>
                <Typography variant="caption" color="text.secondary">Small</Typography>
              </Box>
              
              <Box sx={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.5
              }}>
                <Box sx={{ 
                  width: 30, 
                  height: 30, 
                  bgcolor: theme.palette.primary.main,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  border: '2px solid white',
                  boxShadow: 1
                }}>25+</Box>
                <Typography variant="caption" color="text.secondary">Medium</Typography>
              </Box>
              
              <Box sx={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.5
              }}>
                <Box sx={{ 
                  width: 36, 
                  height: 36, 
                  bgcolor: theme.palette.secondary.main,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  border: '2px solid white',
                  boxShadow: 1
                }}>100+</Box>
                <Typography variant="caption" color="text.secondary">Large</Typography>
              </Box>
            </Box>
            
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 2, mb: 1 }}>
              Categories
            </Typography>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: 12, 
                  height: 12, 
                  bgcolor: getCategoryColor('restaurant'),
                  borderRadius: '50%',
                  boxShadow: 1
                }} />
                <Typography variant="caption">Restaurant</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: 12, 
                  height: 12, 
                  bgcolor: getCategoryColor('cafe'),
                  borderRadius: '50%',
                  boxShadow: 1
                }} />
                <Typography variant="caption">Café</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: 12, 
                  height: 12, 
                  bgcolor: getCategoryColor('bar'),
                  borderRadius: '50%',
                  boxShadow: 1
                }} />
                <Typography variant="caption">Bar</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: 12, 
                  height: 12, 
                  bgcolor: getCategoryColor('hotel'),
                  borderRadius: '50%',
                  boxShadow: 1
                }} />
                <Typography variant="caption">Hotel</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: 12, 
                  height: 12, 
                  bgcolor: getCategoryColor('attraction'),
                  borderRadius: '50%',
                  boxShadow: 1
                }} />
                <Typography variant="caption">Attraction</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: 12, 
                  height: 12, 
                  bgcolor: getCategoryColor('shop'),
                  borderRadius: '50%',
                  boxShadow: 1
                }} />
                <Typography variant="caption">Shop</Typography>
              </Box>
            </Box>
          </Box>
        </Collapse>
      </Paper>
      
      {/* Loading Indicator */}
      {loading && (
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(255, 255, 255, 0.7)',
          zIndex: 20
        }}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={40} color="primary" />
            <Typography variant="body1" color="text.secondary">
              Loading Dublin services...
            </Typography>
          </Paper>
        </Box>
      )}
      
      {/* Join Queue Loading Overlay */}
      {isJoiningQueue && (
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(255, 255, 255, 0.7)',
          zIndex: 20
        }}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={40} color="primary" />
            <Typography variant="body1" color="text.secondary">
              Joining queue...
            </Typography>
          </Paper>
        </Box>
      )}
      
      {/* Error Alert */}
      {error && (
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(255, 255, 255, 0.7)',
          zIndex: 20
        }}>
          <Alert 
            severity="error" 
            variant="filled" 
            sx={{ 
              maxWidth: 400,
              boxShadow: 3,
              '& .MuiAlert-message': {
                overflow: 'hidden'
              }
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Error Loading Map
            </Typography>
            <Typography variant="body2">{error}</Typography>
            <Button 
              variant="outlined" 
              color="inherit" 
              size="small" 
              sx={{ mt: 1 }}
              onClick={() => window.location.reload()}
            >
              Refresh
            </Button>
          </Alert>
        </Box>
      )}
      
      {/* Status Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MapProximity;