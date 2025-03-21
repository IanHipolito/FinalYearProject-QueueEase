import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Box } from '@mui/material';
import { Service } from '../../types/serviceTypes';
import { createServicePopupContent, prepareGeoJSON, getServicePointLayer, getServiceSymbolLayer, addMapStyles } from './mapUtils';
import { DUBLIN_CENTER, DUBLIN_BOUNDS, MAPBOX_TOKEN } from '../../utils/mapUtils';

interface ServiceMapProps {
  services: Service[];
  selectedService: Service | null;
  onServiceClick: (service: Service) => void;
  height?: string;
  isMobile?: boolean;
}

const ServiceMap: React.FC<ServiceMapProps> = ({
  services,
  selectedService,
  onServiceClick,
  height = '100%',
  isMobile = false
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const isMapMovingRef = useRef<boolean>(false);
  const serviceMapRef = useRef<Map<number, Service>>(new Map());
  
  // Initialize service map
  useEffect(() => {
    const serviceMap = new Map<number, Service>();
    services.forEach(service => {
      serviceMap.set(service.id, service);
    });
    serviceMapRef.current = serviceMap;
  }, [services]);
  
  // Initialize map
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
          const styleElement = addMapStyles();
          initializeMapLayers();
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
      if (map.current) map.current.remove();
      map.current = null;
    };
  }, [isMobile, selectedService]);

  const updateMapData = () => {
    if (!map.current) return;
    if (isMapMovingRef.current) return;

    const source = map.current.getSource('services') as mapboxgl.GeoJSONSource;
    if (!source) return;

    requestAnimationFrame(() => {
      source.setData(prepareGeoJSON(services, selectedService?.id));

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
  };

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

      popupRef.current
        .setLngLat([selectedService.longitude, selectedService.latitude])
        .setHTML(createServicePopupContent(selectedService))
        .addTo(map.current);

      map.current.flyTo({
        center: [selectedService.longitude, selectedService.latitude],
        zoom: Math.max(map.current.getZoom(), 14),
        duration: 500,
        essential: true
      });
    }
  }, [services, selectedService]);

  return (
    <Box
      ref={mapContainer}
      sx={{
        height,
        width: '100%',
        position: 'relative',
        '& .mapboxgl-canvas': {
          outline: 'none'
        }
      }}
    />
  );
};

export default ServiceMap;