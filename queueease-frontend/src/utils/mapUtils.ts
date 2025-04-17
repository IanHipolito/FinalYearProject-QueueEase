import { FeatureCollection, Feature, Point } from 'geojson';
import { Service } from 'types/serviceTypes';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import FastfoodIcon from '@mui/icons-material/Fastfood';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import LocalBarIcon from '@mui/icons-material/LocalBar';
import HotelIcon from '@mui/icons-material/Hotel';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import AttractionsIcon from '@mui/icons-material/Attractions';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import StorefrontIcon from '@mui/icons-material/Storefront';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import React from 'react';

export const DUBLIN_CENTER: [number, number] = [-6.2603, 53.3498];

export const DUBLIN_BOUNDS = {
  north: 53.4,
  south: 53.3,
  east: -6.1,
  west: -6.4
};

export const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || '';

export const MARKER_COLORS = {
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

export const CATEGORIES = [
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

export const generateRandomDublinCoordinates = () => {
  return {
    latitude: DUBLIN_BOUNDS.south + Math.random() * (DUBLIN_BOUNDS.north - DUBLIN_BOUNDS.south),
    longitude: DUBLIN_BOUNDS.west + Math.random() * (DUBLIN_BOUNDS.east - DUBLIN_BOUNDS.west)
  };
};

export const getCategoryColor = (category: string): string => {
  const lowerCategory = category?.toLowerCase() || '';

  switch (lowerCategory) {
    case 'restaurant':
      return MARKER_COLORS.restaurant;
    case 'fast_food':
      return MARKER_COLORS.fast_food;
    case 'cafe':
      return MARKER_COLORS.cafe;
    case 'bar':
      return MARKER_COLORS.bar;
    case 'hotel':
      return MARKER_COLORS.hotel;
    case 'bank':
      return MARKER_COLORS.bank;
    case 'shop':
      return MARKER_COLORS.shop;
    case 'storefront':
      return MARKER_COLORS.shop;
    case 'attraction':
      return MARKER_COLORS.attraction;
    case 'healthcare':
      return MARKER_COLORS.healthcare;
    default:
      return MARKER_COLORS.default;
  }
};

export const prepareGeoJSON = (services: Service[], selectedServiceId?: number): FeatureCollection<Point> => {
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
        selected: selectedServiceId === service.id
      }
    }))
  };
};

// GeoJSON Generator class for optimized GeoJSON creation
export class GeoJSONGenerator {
  private serviceIdToFeatureCache: Map<string, Feature<Point>> = new Map();
  private geoJSONCache: Map<string, FeatureCollection<Point>> = new Map();
  
  prepareGeoJSON(services: Service[], selectedServiceId?: number): FeatureCollection<Point> {
    // Create a unique cache key based on services array and selected ID
    const serviceHashCode = services.length > 0 ? 
      services.reduce((hash, service) => hash + service.id, 0) : 0;
    const cacheKey = `${services.length}-${selectedServiceId || 0}-${serviceHashCode}`;
    
    // Return cached version if available
    if (this.geoJSONCache.has(cacheKey)) {
      return this.geoJSONCache.get(cacheKey)!;
    }
    
    // Reuse features when possible for better performance
    const features = services.map(service => {
      const featureCacheKey = `${service.id}-${selectedServiceId === service.id ? 1 : 0}`;
      
      if (this.serviceIdToFeatureCache.has(featureCacheKey)) {
        return this.serviceIdToFeatureCache.get(featureCacheKey)!;
      }
      
      // Create new feature if not cached
      const feature: Feature<Point> = {
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
          selected: selectedServiceId === service.id
        }
      };
      
      // Cache the feature
      this.serviceIdToFeatureCache.set(featureCacheKey, feature);
      return feature;
    });
    
    // Create full GeoJSON
    const geoJSON: FeatureCollection<Point> = {
      type: 'FeatureCollection',
      features
    };
    
    // Cache the GeoJSON result
    this.geoJSONCache.set(cacheKey, geoJSON);
    
    // Limit cache size to prevent memory leaks
    if (this.geoJSONCache.size > 20) {
      const firstKey = this.geoJSONCache.keys().next().value;
      if (firstKey !== undefined) {
        this.geoJSONCache.delete(firstKey);
      }
    }
    
    // Limit feature cache size as well
    if (this.serviceIdToFeatureCache.size > 1000) {
      // Get first 200 keys to delete
      const keysToDelete = Array.from(this.serviceIdToFeatureCache.keys()).slice(0, 200);
      keysToDelete.forEach(key => this.serviceIdToFeatureCache.delete(key));
    }
    
    return geoJSON;
  }
  
  // Clear caches when no longer needed
  clearCaches(): void {
    this.serviceIdToFeatureCache.clear();
    this.geoJSONCache.clear();
  }
}

// Export a singleton instance
export const geoJSONGenerator = new GeoJSONGenerator();

export const getServicePointLayer = (selectedService: Service | null): mapboxgl.CircleLayer => {
  return {
    id: 'service-points',
    type: 'circle' as const,
    source: 'services',
    filter: ['!', ['has', 'point_count']],
    paint: {
      // Use proper type for interpolate expression
      'circle-radius': [
        'interpolate' as const,
        ['linear' as const],
        ['zoom' as const],
        10, 6,
        14, 12,
        16, 16
      ] as mapboxgl.Expression,
      
      // Use proper type for match expression
      'circle-color': [
        'match' as const,
        ['get' as const, 'category'],
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
      ] as mapboxgl.Expression,
      
      // Use proper type for case expression
      'circle-stroke-width': [
        'case' as const,
        ['==' as const, ['get' as const, 'id'], ['literal' as const, selectedService ? selectedService.id : -1]],
        3,
        1.5
      ] as mapboxgl.Expression,
      
      'circle-stroke-color': 'white',
      'circle-opacity': 0.9
    }
  };
};

// Pre-defined symbol layer
const SYMBOL_LAYER_STYLE = {
  'text-field': ['get' as const, 'initial'] as mapboxgl.Expression,
  'text-size': 10,
  'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
  'text-allow-overlap': true
};

export const getServiceSymbolLayer = (): mapboxgl.SymbolLayer => ({
  id: 'service-symbols',
  type: 'symbol' as const,
  source: 'services',
  filter: ['!', ['has', 'point_count']],
  layout: SYMBOL_LAYER_STYLE,
  paint: {
    'text-color': 'white'
  }
});

// Cached map of category icons for re-use
const categoryIconCache = new Map<string, React.ReactNode>();

export const getCategoryIcon = (category: string, size: 'small' | 'medium' | 'large' = 'small'): React.ReactElement | undefined => {
  // Create cache key
  const cacheKey = `${category}-${size}`;
  
  // Check cache first
  if (categoryIconCache.has(cacheKey)) {
    return categoryIconCache.get(cacheKey) as React.ReactElement || undefined;
  }
  
  const iconProps = { fontSize: size };
  const lowerCategory = category?.toLowerCase() || '';
  
  let icon: React.ReactElement | undefined;
  
  // Regular function approach
  switch (lowerCategory) {
    case 'restaurant':
      icon = React.createElement(RestaurantIcon, iconProps);
      break;
    case 'fast_food':
      icon = React.createElement(FastfoodIcon, iconProps);
      break;
    case 'cafe':
      icon = React.createElement(LocalCafeIcon, iconProps);
      break;
    case 'bar':
      icon = React.createElement(LocalBarIcon, iconProps);
      break;
    case 'hotel':
      icon = React.createElement(HotelIcon, iconProps);
      break;
    case 'bank':
      icon = React.createElement(LocalAtmIcon, iconProps);
      break;
    case 'shop':
      icon = React.createElement(ShoppingBagIcon, iconProps);
      break;
    case 'storefront':
      icon = React.createElement(StorefrontIcon, iconProps);
      break;
    case 'attraction':
      icon = React.createElement(AttractionsIcon, iconProps);
      break;
    case 'healthcare':
      icon = React.createElement(LocalHospitalIcon, iconProps);
      break;
    default:
      icon = React.createElement(MyLocationIcon, iconProps);
  }
  
  // Cache the result
  categoryIconCache.set(cacheKey, icon);
  
  return icon;
};

// Global style element to avoid repeatedly adding/removing it
let mapStyleElement: HTMLStyleElement | null = null;

export const addMapStyles = () => {
  // Only add styles once
  if (mapStyleElement) return mapStyleElement;
  
  mapStyleElement = document.createElement('style');
  mapStyleElement.innerHTML = `
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
      contain: layout style paint;
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
      contain: content;
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
    
    /* GPU acceleration for map elements */
    .mapboxgl-canvas-container {
      will-change: transform;
      transform: translateZ(0);
      backface-visibility: hidden;
    }
    
    /* Smoother animations */
    .mapboxgl-marker {
      will-change: transform;
      transition: transform 0.15s ease;
    }
  `;
  document.head.appendChild(mapStyleElement);
  return mapStyleElement;
};

export const createServicePopupContent = (service: Service) => `
  <div style="padding: 12px;">
    <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: 600;">${service.name}</h3>
    <div style="font-size: 13px; color: #666; margin-bottom: 8px;">
      ${service.category || ''}
      ${service.wait_time ? ` • ${service.wait_time} min wait` : ''}
      ${service.queue_length ? ` • ${service.queue_length} in queue` : ''}
    </div>
  </div>
`;

// Add cleanup function to remove styles on unmount
export const removeMapStyles = () => {
  if (mapStyleElement && document.head.contains(mapStyleElement)) {
    document.head.removeChild(mapStyleElement);
    mapStyleElement = null;
  }
};