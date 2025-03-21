import React from 'react';
import { FeatureCollection, Feature, Point } from 'geojson';
import mapboxgl from 'mapbox-gl';
import { Service } from '../../types/serviceTypes';
import { MARKER_COLORS } from '../../utils/mapUtils';

// Icons
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

export const getServicePointLayer = (selectedService: Service | null): mapboxgl.CircleLayer => ({
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

export const getServiceSymbolLayer = (): mapboxgl.SymbolLayer => ({
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

export const getCategoryIcon = (category: string, size: 'small' | 'medium' | 'large' = 'small') => {
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

export const addMapStyles = () => {
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
  return style;
};